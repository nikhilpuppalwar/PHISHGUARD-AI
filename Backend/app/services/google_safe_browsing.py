import re
import urllib.parse
from typing import Dict, Any, List, Optional
import requests
from app.config import settings

SAFE_BROWSING_ENDPOINT = "https://safebrowsing.googleapis.com/v4/threatMatches:find"

# Known simulated demo patterns for faculty and testing verification (Spec §21)
DEMO_THREAT_DOMAINS = {
    "testsafebrowsing.appspot.com": ["SOCIAL_ENGINEERING"],
    "malware.testing.google.test": ["MALWARE"],
    "phish-alert-verify.com": ["SOCIAL_ENGINEERING"],
    "secure-login-update.online": ["SOCIAL_ENGINEERING"],
    "verify-campus-portal.xyz": ["SOCIAL_ENGINEERING"]
}

class GoogleSafeBrowsingService:
    """
    Google Safe Browsing Threat Intelligence Service (Spec §1, §7, §21, §22).
    Queries Google Safe Browsing API v4 for real-time reputation verification.
    Handles rate-limits, timeouts, and unconfigured states gracefully.
    """

    def __init__(self):
        self.api_key = settings.GOOGLE_SAFE_BROWSING_API_KEY
        self.client_id = "phishguard-ai-platform"
        self.client_version = "2.0.0"
        self.timeout_seconds = 4.0

    def is_configured(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 8)

    def check_url(self, normalized_url: str) -> Dict[str, Any]:
        """
        Queries Google Safe Browsing for the given normalized URL.
        Guaranteed to never throw an uncaught exception or expose credentials.
        """
        if not normalized_url or not isinstance(normalized_url, str):
            return {
                "provider": "google_safe_browsing",
                "checked": False,
                "status": "invalid_url",
                "known_threat": False,
                "threat_types": [],
                "platform_types": [],
                "error": "Invalid or empty URL provided",
                "details": "Invalid URL provided for inspection."
            }

        # Check if real API key configured
        if self.is_configured():
            try:
                params = {"key": self.api_key.strip()}
                body = {
                    "client": {
                        "clientId": self.client_id,
                        "clientVersion": self.client_version
                    },
                    "threatInfo": {
                        "threatTypes": [
                            "MALWARE",
                            "SOCIAL_ENGINEERING",
                            "UNWANTED_SOFTWARE",
                            "POTENTIALLY_HARMFUL_APPLICATION"
                        ],
                        "platformTypes": ["ANY_PLATFORM"],
                        "threatEntryTypes": ["URL"],
                        "threatEntries": [{"url": normalized_url}]
                    }
                }

                resp = requests.post(
                    SAFE_BROWSING_ENDPOINT,
                    params=params,
                    json=body,
                    timeout=self.timeout_seconds
                )

                if resp.status_code == 200:
                    data = resp.json()
                    matches = data.get("matches", [])
                    if matches:
                        threat_types = list(dict.fromkeys(m.get("threatType") for m in matches if m.get("threatType")))
                        platform_types = list(dict.fromkeys(m.get("platformType") for m in matches if m.get("platformType")))
                        return {
                            "provider": "google_safe_browsing",
                            "checked": True,
                            "status": "success",
                            "known_threat": True,
                            "threat_types": threat_types,
                            "platform_types": platform_types,
                            "error": None,
                            "details": f"Known threat identified by Google Safe Browsing: {', '.join(threat_types)}."
                        }
                    else:
                        # IMPORTANT (Spec §1): "Not identified as a known threat" must NOT be "Safe"
                        return {
                            "provider": "google_safe_browsing",
                            "checked": True,
                            "status": "success",
                            "known_threat": False,
                            "threat_types": [],
                            "platform_types": [],
                            "error": None,
                            "details": "Not identified as a known Google Safe Browsing threat."
                        }
                elif resp.status_code in (429, 403):
                    return {
                        "provider": "google_safe_browsing",
                        "checked": False,
                        "status": "rate_limited",
                        "known_threat": False,
                        "threat_types": [],
                        "platform_types": [],
                        "error": "Google Safe Browsing quota or rate limit reached.",
                        "details": "External threat intelligence unavailable (Quota reached). Assessment uses internal analysis."
                    }
                else:
                    return {
                        "provider": "google_safe_browsing",
                        "checked": False,
                        "status": "error",
                        "known_threat": False,
                        "threat_types": [],
                        "platform_types": [],
                        "error": f"Safe Browsing API returned status {resp.status_code}",
                        "details": "External threat intelligence unavailable. Assessment uses internal analysis."
                    }

            except requests.Timeout:
                return {
                    "provider": "google_safe_browsing",
                    "checked": False,
                    "status": "timeout",
                    "known_threat": False,
                    "threat_types": [],
                    "platform_types": [],
                    "error": "Request timed out",
                    "details": "Google Safe Browsing request timed out. Assessment uses internal analysis."
                }
            except Exception as e:
                return {
                    "provider": "google_safe_browsing",
                    "checked": False,
                    "status": "error",
                    "known_threat": False,
                    "threat_types": [],
                    "platform_types": [],
                    "error": "Connection error",
                    "details": "External threat intelligence unavailable. Assessment uses internal analysis."
                }

        # Safe Demo Fallback for Faculty / Offline testing (Spec §21)
        if settings.DEMO_INTEL_MODE:
            parsed = urllib.parse.urlparse(normalized_url if "://" in normalized_url else f"http://{normalized_url}")
            domain = (parsed.netloc or "").lower().split(":")[0]

            for test_domain, threat_types in DEMO_THREAT_DOMAINS.items():
                if test_domain in domain or test_domain in normalized_url.lower():
                    return {
                        "provider": "google_safe_browsing",
                        "checked": True,
                        "status": "demo_simulated",
                        "known_threat": True,
                        "threat_types": threat_types,
                        "platform_types": ["ANY_PLATFORM"],
                        "error": None,
                        "details": f"Demo Mode — Simulated: Known {threat_types[0]} threat."
                    }

            # Normal demo result
            return {
                "provider": "google_safe_browsing",
                "checked": True,
                "status": "demo_simulated",
                "known_threat": False,
                "threat_types": [],
                "platform_types": [],
                "error": None,
                "details": "Demo Mode — Simulated: Not identified as a known Google Safe Browsing threat."
            }

        # Unconfigured state (Spec §20)
        return {
            "provider": "google_safe_browsing",
            "checked": False,
            "status": "unconfigured",
            "known_threat": False,
            "threat_types": [],
            "platform_types": [],
            "error": "API key not configured",
            "details": "Google Safe Browsing is not configured."
        }


# Singleton export
google_safe_browsing = GoogleSafeBrowsingService()
google_safe_browsing_service = google_safe_browsing
