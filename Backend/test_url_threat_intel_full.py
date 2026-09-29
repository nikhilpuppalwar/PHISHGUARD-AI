import sys
import unittest
import uuid
from pathlib import Path
from unittest.mock import patch, MagicMock

sys.path.insert(0, str(Path(__file__).parent))

from app.database_mongo import mongo_db
from app.services.google_safe_browsing import GoogleSafeBrowsingService, google_safe_browsing_service
from app.services.virustotal import VirusTotalService, virustotal_service
from app.services.url_threat_intelligence import URLThreatIntelligenceCoordinator, url_threat_intelligence_coordinator
from app.services.url_agent import url_agent
from app.services.risk_engine import risk_engine
from app.services.explainability import explainability_engine
from app.config import settings

class TestExternalURLThreatIntelligence(unittest.TestCase):

    def setUp(self):
        self.coordinator = url_threat_intelligence_coordinator
        self.gsb = GoogleSafeBrowsingService()
        self.vt = VirusTotalService()

    # 1. Valid URL handling
    def test_01_valid_url_normalization(self):
        url = "  HTTP://Example.COM:80/path/test/?q=1#section "
        normalized = self.coordinator.normalize_url(url)
        self.assertEqual(normalized, "http://example.com/path/test?q=1")

    # 2. Invalid URL handling
    def test_02_invalid_url_handling(self):
        res = self.coordinator.fetch_url_threat_intelligence("")
        self.assertEqual(res["normalized_url"], "")
        self.assertEqual(res["combined_reputation"], "UNKNOWN")

    # 3. Safe Browsing threat match (Demo / Simulated)
    def test_03_gsb_threat_match(self):
        res = self.gsb.check_url("https://testsafebrowsing.appspot.com/s/phishing.html")
        self.assertTrue(res["checked"])
        self.assertTrue(res["known_threat"])
        self.assertIn("SOCIAL_ENGINEERING", res["threat_types"])

    # 4. Safe Browsing no match (clean)
    def test_04_gsb_no_match(self):
        res = self.gsb.check_url("https://clean-verified-portal.edu")
        self.assertTrue(res["checked"])
        self.assertFalse(res["known_threat"])
        self.assertIn("Not identified as a known Google Safe Browsing threat", res["details"])
        self.assertNotIn("This URL is safe", res["details"])

    # 5. Safe Browsing API failure handling
    @patch("requests.post")
    def test_05_gsb_api_failure(self, mock_post):
        mock_post.side_effect = Exception("Connection refused by remote host")
        service = GoogleSafeBrowsingService()
        service.api_key = "AIzaSyFakeKeyForTest12345"
        res = service.check_url("https://any-url.org")
        self.assertFalse(res["checked"])
        self.assertFalse(res["known_threat"])
        self.assertIn("unavailable", res["details"].lower())

    # 6. VirusTotal malicious result
    def test_06_vt_malicious_result(self):
        res = self.vt.check_url("https://malware.testing.google.test/binary")
        self.assertTrue(res["checked"])
        self.assertGreater(res["malicious"], 0)
        self.assertIn("/", res["detection_ratio"])

    # 7. VirusTotal no detection
    @patch("requests.get")
    def test_07_vt_no_detection(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "data": {
                "attributes": {
                    "last_analysis_stats": {
                        "malicious": 0, "suspicious": 0, "harmless": 20, "undetected": 70, "timeout": 0
                    }
                }
            }
        }
        mock_get.return_value = mock_resp
        service = VirusTotalService()
        service.api_key = "FakeVTKey1234567890abcdef"
        res = service.check_url("https://standard-legit-service.org")
        self.assertTrue(res["checked"])
        self.assertEqual(res["malicious"], 0)
        self.assertIn("No malicious detections reported by the queried engines", res["details"])
        self.assertNotIn("This URL is safe", res["details"])

    # 8. VirusTotal API failure handling
    @patch("requests.get")
    def test_08_vt_api_failure(self, mock_get):
        mock_get.side_effect = Exception("Read timeout")
        service = VirusTotalService()
        service.api_key = "FakeVTKey1234567890abcdef"
        res = service.check_url("https://another-url.org")
        self.assertFalse(res["checked"])
        self.assertEqual(res["malicious"], 0)
        self.assertIn("Assessment uses internal analysis", res["details"])

    # 9. Rate-limit response handling
    @patch("requests.get")
    def test_09_vt_rate_limit(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.status_code = 429
        mock_get.return_value = mock_resp
        service = VirusTotalService()
        service.api_key = "FakeVTKey1234567890abcdef"
        res = service.check_url("https://rate-limited-target.com")
        self.assertFalse(res["checked"])
        self.assertEqual(res["status"], "rate_limited")

    # 10. Missing API key handling
    def test_10_missing_api_key(self):
        service = VirusTotalService()
        service.api_key = ""
        # Disable demo mode temporarily to test unconfigured response
        with patch.object(settings, "DEMO_INTEL_MODE", False):
            res = service.check_url("https://target.com")
            self.assertFalse(res["checked"])
            self.assertEqual(res["status"], "not_configured")

    # 11. Both APIs unavailable resilience
    def test_11_both_apis_unavailable_resilience(self):
        # Even if both fail or are unconfigured, URL Agent continues with internal ML & structure
        with patch.object(self.coordinator, "fetch_url_threat_intelligence") as mock_fetch:
            mock_fetch.return_value = {
                "google_safe_browsing": {"checked": False, "status": "unavailable", "known_threat": False},
                "virustotal": {"checked": False, "status": "unavailable", "malicious": 0},
                "summary": "External threat intelligence unavailable. Assessment uses internal analysis."
            }
            res = url_agent.analyze(["https://suspicious-untrusted-site.xyz/login/verify"])
            self.assertIn("risk_score", res)
            self.assertGreaterEqual(res["risk_score"], 35.0)

    # 12 & 13. Cache miss then Cache hit in MongoDB
    def test_12_13_cache_miss_and_hit(self):
        unique_token = uuid.uuid4().hex[:10]
        test_url = f"https://testsafebrowsing.appspot.com/test?token={unique_token}"

        # Miss
        first = self.coordinator.fetch_url_threat_intelligence(test_url)
        self.assertFalse(first["cached"])

        # Hit
        second = self.coordinator.fetch_url_threat_intelligence(test_url)
        self.assertTrue(second["cached"])
        self.assertEqual(first["url_hash"], second["url_hash"])

    # 14. MongoDB persistence
    def test_14_mongodb_persistence(self):
        self.assertTrue(mongo_db.is_connected())
        doc_count = mongo_db.db.url_threat_checks.count_documents({})
        self.assertGreaterEqual(doc_count, 1)

    # 15. Risk AI Bayesian evidence fusion
    def test_15_risk_ai_fusion(self):
        url_evidence = {
            "risk_score": 85.0,
            "indicators": ["Multiple hyphens in domain", "Credential keyword in path"],
            "external_threat_intel": {
                "google_safe_browsing": {"checked": True, "known_threat": True, "threat_types": ["SOCIAL_ENGINEERING"]},
                "virustotal": {"checked": True, "malicious": 8, "total_engines": 90}
            }
        }
        text_evidence = {"risk_score": 80.0, "indicators": ["Urgent payment request"]}
        sender_evidence = {"risk_score": 70.0, "indicators": ["Impersonating campus administration"]}
        rag_evidence = {"similarity": 0.90, "title": "Internship advance fee phishing"}

        risk = risk_engine.compute_risk(text_evidence, url_evidence, sender_evidence, rag_evidence)
        self.assertGreaterEqual(risk["overall_score"], 85.0)
        self.assertEqual(risk["severity"], "High Risk")
        self.assertGreaterEqual(risk["confidence"], 0.85)

    # 16. Explainability integration
    def test_16_explainability_attribution(self):
        url_evidence = {
            "risk_score": 85.0,
            "indicators": ["High abuse TLD .xyz"],
            "model_probability": 0.85,
            "model_name": "XGBoost",
            "external_threat_intel": {
                "google_safe_browsing": {"checked": True, "known_threat": False},
                "virustotal": {"checked": True, "malicious": 4, "total_engines": 90}
            }
        }
        text_evidence = {"risk_score": 75.0, "indicators": ["Urgency cues"], "model_probability": 0.75}
        sender_evidence = {"risk_score": 60.0, "indicators": ["Suspicious display name"], "model_probability": 0.60}

        xai = explainability_engine.compute_contributions(84.0, text_evidence, url_evidence, sender_evidence)
        self.assertIn("url", xai["contributions"])
        self.assertIn("external_threat_intel", xai["agent_details"]["url"])
        self.assertEqual(sum(xai["contributions"].values()), 100)

    # 17. API-key security (Never exposed in results)
    def test_17_api_key_security(self):
        res = self.coordinator.fetch_url_threat_intelligence("https://check-security-cleanliness.org")
        res_str = str(res)
        if settings.GOOGLE_SAFE_BROWSING_API_KEY:
            self.assertNotIn(settings.GOOGLE_SAFE_BROWSING_API_KEY, res_str)
        if settings.VIRUSTOTAL_API_KEY:
            self.assertNotIn(settings.VIRUSTOTAL_API_KEY, res_str)

if __name__ == "__main__":
    unittest.main()
