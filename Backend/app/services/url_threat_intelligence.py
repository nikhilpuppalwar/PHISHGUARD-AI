import hashlib
import urllib.parse
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, Any, Optional

from app.config import settings
from app.database_mongo import mongo_db
from app.services.google_safe_browsing import google_safe_browsing_service
from app.services.virustotal import virustotal_service

class URLThreatIntelligenceCoordinator:
    """
    Coordinates external threat intelligence gathering across Google Safe Browsing
    and VirusTotal with MongoDB caching and URL normalization (Spec §1, §2, §5, §6, §7, §20).
    """

    def __init__(self):
        self.gsb_service = google_safe_browsing_service
        self.vt_service = virustotal_service

    @staticmethod
    def normalize_url(raw_url: str) -> str:
        """
        Validates and normalizes URL to prevent duplicate lookups for identical endpoints:
        - Ensures scheme (default http/https)
        - Lowercases hostname
        - Removes default ports (:80, :443)
        - Strips URL fragments (#...)
        - Strips trailing slash on root paths
        """
        if not raw_url:
            return ""

        url_str = raw_url.strip()
        url_lower = url_str.lower()
        if not (url_lower.startswith("http://") or url_lower.startswith("https://")):
            url_str = "http://" + url_str

        try:
            parsed = urllib.parse.urlparse(url_str)
            scheme = (parsed.scheme or "http").lower()
            netloc = (parsed.netloc or "").lower()

            # Remove standard ports
            if netloc.endswith(":80") and scheme == "http":
                netloc = netloc[:-3]
            elif netloc.endswith(":443") and scheme == "https":
                netloc = netloc[:-4]

            path = parsed.path or "/"
            if path != "/" and path.endswith("/"):
                path = path.rstrip("/")

            query = parsed.query
            normalized = urllib.parse.urlunparse((scheme, netloc, path, "", query, ""))
            return normalized
        except Exception:
            return raw_url.strip()

    @staticmethod
    def hash_url(normalized_url: str) -> str:
        """Computes stable SHA-256 hash of the normalized URL for caching and fast indexing."""
        return hashlib.sha256(normalized_url.encode("utf-8")).hexdigest()

    def get_provider_status(self) -> Dict[str, Any]:
        """
        Returns status of external intelligence providers and MongoDB connection (Spec §20).
        """
        gsb_configured = self.gsb_service.is_configured()
        vt_configured = self.vt_service.is_configured()
        mongo_connected = mongo_db.is_connected()

        def resolve_status(configured: bool) -> str:
            if configured:
                return "Available"
            if settings.DEMO_INTEL_MODE:
                return "Demo Mode — Simulated"
            return "Not configured"

        return {
            "google_safe_browsing": resolve_status(gsb_configured),
            "virustotal": resolve_status(vt_configured),
            "mongodb_persistence": "Available (Connected)" if mongo_connected else "Unavailable (In-Memory Fallback)",
            "demo_mode": settings.DEMO_INTEL_MODE
        }

    def fetch_url_threat_intelligence(
        self,
        raw_url: str,
        user_id: Optional[str] = None,
        bypass_cache: bool = False
    ) -> Dict[str, Any]:
        """
        Retrieves threat intelligence for a URL using MongoDB cache first.
        If cache miss, queries Google Safe Browsing and VirusTotal in parallel.
        Gracefully handles service degradations without breaking main analysis.
        """
        normalized_url = self.normalize_url(raw_url)
        if not normalized_url:
            return {
                "url": raw_url,
                "normalized_url": "",
                "url_hash": "",
                "cached": False,
                "checked_at": datetime.now(timezone.utc).isoformat(),
                "google_safe_browsing": {
                    "provider": "google_safe_browsing",
                    "checked": False,
                    "status": "invalid_url",
                    "known_threat": False,
                    "threat_types": [],
                    "platform_types": [],
                    "error": "Invalid URL"
                },
                "virustotal": {
                    "provider": "virustotal",
                    "checked": False,
                    "status": "invalid_url",
                    "malicious": 0,
                    "suspicious": 0,
                    "harmless": 0,
                    "undetected": 0,
                    "total_engines": 0,
                    "detection_ratio": "0/0",
                    "error": "Invalid URL"
                },
                "combined_reputation": "UNKNOWN",
                "summary": "Invalid URL provided for threat intelligence lookup."
            }

        url_hash = self.hash_url(normalized_url)

        # 1. Check MongoDB Cache (Spec §6)
        if not bypass_cache:
            cached_doc = mongo_db.get_cached_threat_check(url_hash, max_age_hours=24)
            if cached_doc:
                gsb_data = cached_doc.get("google_safe_browsing", {})
                vt_data = cached_doc.get("virustotal", {})
                return {
                    "url": raw_url,
                    "normalized_url": normalized_url,
                    "url_hash": url_hash,
                    "cached": True,
                    "checked_at": cached_doc.get("checked_at", datetime.now(timezone.utc).isoformat()),
                    "google_safe_browsing": gsb_data,
                    "virustotal": vt_data,
                    "combined_reputation": self._evaluate_reputation(gsb_data, vt_data),
                    "summary": self._generate_summary(gsb_data, vt_data, cached=True)
                }

        # 2. Parallel lookup to avoid serial latency overhead
        gsb_result = None
        vt_result = None

        with ThreadPoolExecutor(max_workers=2) as executor:
            future_gsb = executor.submit(self.gsb_service.check_url, normalized_url)
            future_vt = executor.submit(self.vt_service.check_url, normalized_url)

            try:
                gsb_result = future_gsb.result()
            except Exception as e:
                gsb_result = {
                    "provider": "google_safe_browsing",
                    "checked": False,
                    "status": "error",
                    "known_threat": False,
                    "threat_types": [],
                    "platform_types": [],
                    "error": str(e),
                    "details": "External threat intelligence unavailable. Assessment uses internal analysis."
                }

            try:
                vt_result = future_vt.result()
            except Exception as e:
                vt_result = {
                    "provider": "virustotal",
                    "checked": False,
                    "status": "error",
                    "malicious": 0,
                    "suspicious": 0,
                    "harmless": 0,
                    "undetected": 0,
                    "total_engines": 0,
                    "detection_ratio": "0/0",
                    "error": str(e),
                    "details": "External threat intelligence unavailable. Assessment uses internal analysis."
                }

        combined_reputation = self._evaluate_reputation(gsb_result, vt_result)
        summary = self._generate_summary(gsb_result, vt_result, cached=False)
        checked_at = datetime.now(timezone.utc).isoformat()

        # 3. Store normalized intelligence document in MongoDB (Spec §4, §6)
        doc_to_save = {
            "user_id": str(user_id) if user_id else "anonymous",
            "url_hash": url_hash,
            "normalized_url": normalized_url,
            "checked_at": checked_at,
            "google_safe_browsing": gsb_result,
            "virustotal": vt_result,
            "combined_reputation": combined_reputation
        }
        mongo_db.save_threat_check(doc_to_save)

        return {
            "url": raw_url,
            "normalized_url": normalized_url,
            "url_hash": url_hash,
            "cached": False,
            "checked_at": checked_at,
            "google_safe_browsing": gsb_result,
            "virustotal": vt_result,
            "combined_reputation": combined_reputation,
            "summary": summary
        }

    def _evaluate_reputation(self, gsb: Dict[str, Any], vt: Dict[str, Any]) -> str:
        """
        Derives high-level external indicator label from normalized provider data.
        Does NOT replace or dictate final risk (Spec §10).
        """
        gsb_threat = gsb.get("known_threat", False)
        vt_malicious = vt.get("malicious", 0)
        vt_suspicious = vt.get("suspicious", 0)

        if gsb_threat or vt_malicious >= 3:
            return "KNOWN_THREAT"
        elif vt_malicious > 0 or vt_suspicious > 0:
            return "SUSPICIOUS"
        elif gsb.get("checked") or vt.get("checked"):
            return "CLEAN_INDICATORS"
        return "UNAVAILABLE"

    def _generate_summary(self, gsb: Dict[str, Any], vt: Dict[str, Any], cached: bool = False) -> str:
        """
        Generates compliant explanatory summary respecting strict wording requirements.
        Spec §1, §2, §7.
        """
        parts = []
        if cached:
            parts.append("(Cached from recent verification)")

        # GSB wording
        if gsb.get("known_threat"):
            types = ", ".join(gsb.get("threat_types", [])) or "THREAT"
            parts.append(f"Google Safe Browsing: Flagged as {types}.")
        elif gsb.get("checked"):
            parts.append("Google Safe Browsing: Not identified as a known Google Safe Browsing threat.")
        else:
            parts.append("Google Safe Browsing: Unavailable.")

        # VT wording
        if vt.get("malicious", 0) > 0:
            parts.append(f"VirusTotal: {vt['malicious']} of {vt.get('total_engines', 0)} engines flagged malicious.")
        elif vt.get("checked"):
            parts.append("VirusTotal: No malicious detections reported by the queried engines.")
        else:
            parts.append("VirusTotal: Unavailable.")

        return " ".join(parts)

url_threat_intelligence_coordinator = URLThreatIntelligenceCoordinator()
