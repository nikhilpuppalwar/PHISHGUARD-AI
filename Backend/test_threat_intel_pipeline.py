import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from app.database_mongo import mongo_db
from app.services.google_safe_browsing import google_safe_browsing_service
from app.services.virustotal import virustotal_service
from app.services.url_threat_intelligence import url_threat_intelligence_coordinator
from app.services.url_agent import url_agent
from app.services.risk_engine import risk_engine
from app.services.explainability import explainability_engine

def run_tests():
    print("=== 1. Testing MongoDB Connection ===")
    connected = mongo_db.is_connected()
    print(f"MongoDB connected: {connected}")
    assert connected, "MongoDB should be connected on 127.0.0.1:27017"

    print("\n=== 2. Testing Provider Status ===")
    status = url_threat_intelligence_coordinator.get_provider_status()
    print("Provider status:", status)
    assert "google_safe_browsing" in status
    assert "virustotal" in status
    assert "mongodb_persistence" in status

    print("\n=== 3. Testing Google Safe Browsing Service (Demo/Simulated) ===")
    gsb_clean = google_safe_browsing_service.check_url("https://www.wikipedia.org/wiki/Phishing")
    print("GSB Clean Result:", gsb_clean)
    assert gsb_clean["checked"] is True
    assert gsb_clean["known_threat"] is False
    assert "Not identified as a known Google Safe Browsing threat" in gsb_clean["details"]

    gsb_threat = google_safe_browsing_service.check_url("https://testsafebrowsing.appspot.com/s/phishing.html")
    print("GSB Threat Result:", gsb_threat)
    assert gsb_threat["checked"] is True
    assert gsb_threat["known_threat"] is True

    print("\n=== 4. Testing VirusTotal Service (Demo/Simulated) ===")
    vt_clean = virustotal_service.check_url("https://www.wikipedia.org/wiki/Phishing")
    print("VT Clean Result:", vt_clean)
    assert vt_clean["checked"] is True
    assert vt_clean["malicious"] == 0
    assert "No malicious detections reported by the queried engines" in vt_clean["details"]

    vt_threat = virustotal_service.check_url("https://malware.testing.google.test/sample")
    print("VT Threat Result:", vt_threat)
    assert vt_threat["checked"] is True
    assert vt_threat["malicious"] > 0

    print("\n=== 5. Testing URL Threat Intelligence Coordinator & MongoDB Caching ===")
    import uuid
    test_url = f"https://phish-alert-verify.com/login/update?token={uuid.uuid4().hex[:8]}"
    
    # First lookup (Cache Miss)
    intel_1 = url_threat_intelligence_coordinator.fetch_url_threat_intelligence(test_url)
    print("Intel 1 (Cached?):", intel_1.get("cached"))
    assert intel_1["cached"] is False
    assert intel_1["combined_reputation"] in ["KNOWN_THREAT", "SUSPICIOUS"]

    # Second lookup (Cache Hit from MongoDB)
    intel_2 = url_threat_intelligence_coordinator.fetch_url_threat_intelligence(test_url)
    print("Intel 2 (Cached?):", intel_2.get("cached"))
    assert intel_2["cached"] is True
    assert intel_2["url_hash"] == intel_1["url_hash"]

    print("\n=== 6. Testing URL Agent Full Pipeline ===")
    url_result = url_agent.analyze(["https://phish-alert-verify.com/login/update"])
    print("URL Agent Risk Score:", url_result["risk_score"])
    print("URL Agent Indicators:", url_result["indicators"])
    print("URL Agent Summary:", url_result["summary"])
    assert url_result["risk_score"] > 70.0
    assert url_result["evidence_object"] is not None
    assert "external_intelligence" in url_result["evidence_object"]
    assert "structural_analysis" in url_result["evidence_object"]

    print("\n=== 7. Testing Bayesian Risk Engine Fusion with Threat Intel ===")
    text_mock = {"risk_score": 78.0, "indicators": ["Urgent payment request", "Suspicious sender domain"]}
    sender_mock = {"risk_score": 65.0, "indicators": ["Free webmail provider impersonating corporate brand"]}
    rag_mock = {"similarity": 0.88, "title": "Payroll credential phishing"}

    risk_out = risk_engine.compute_risk(text_mock, url_result, sender_mock, rag_mock)
    print("Risk Engine Output Score:", risk_out["overall_score"], "Severity:", risk_out["severity"])
    assert risk_out["overall_score"] >= 80.0
    assert any("Google Safe Browsing" in f["factor"] or "VirusTotal" in f["factor"] for f in risk_out["risk_factors"])

    print("\n=== 8. Testing Explainability Attribution ===")
    xai_out = explainability_engine.compute_contributions(
        risk_out["overall_score"],
        text_mock,
        url_result,
        sender_mock,
        rag_mock
    )
    print("XAI Contributions:", xai_out["contributions"])
    print("XAI URL Details:", xai_out["agent_details"]["url"]["summary"])
    assert "url" in xai_out["contributions"]
    assert sum(xai_out["contributions"].values()) == 100

    print("\n ALL BACKEND THREAT INTELLIGENCE TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
