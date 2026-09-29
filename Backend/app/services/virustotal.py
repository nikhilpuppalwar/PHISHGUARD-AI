import base64
import urllib.parse
from typing import Dict, Any, Optional
import requests
from app.config import settings

VIRUSTOTAL_URL_ENDPOINT = "https://www.virustotal.com/api/v3/urls"

# Known simulated demo patterns for faculty and testing verification (Spec §21)
DEMO_MALICIOUS_DOMAINS = {
    "malware.testing.google.test": {"malicious": 18, "suspicious": 4, "harmless": 10, "undetected": 58},
    "testsafebrowsing.appspot.com": {"malicious": 12, "suspicious": 3, "harmless": 15, "undetected": 60},
    "phish-alert-verify.com": {"malicious": 8, "suspicious": 2, "harmless": 12, "undetected": 68},
    "secure-login-update.online": {"malicious": 14, "suspicious": 1, "harmless": 8, "undetected": 67},
    "verify-campus-portal.xyz": {"malicious": 7, "suspicious": 3, "harmless": 14, "undetected": 66}
}

class VirusTotalService:
    """
    VirusTotal Threat Intelligence Service (Spec §2, §7, §21, §22).
    Integrates with VirusTotal API v3 via the 'x-apikey' header.
    Handles rate-limits, timeouts, quotas, and missing credentials securely.
    Guarantees that credentials are never logged or exposed.
    """

    def __init__(self):
        self.api_key = settings.VIRUSTOTAL_API_KEY
        self.timeout_seconds = 4.0

    def is_configured(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 8)

    @staticmethod
    def encode_url_id(url: str) -> str:
        """
        Encodes a URL into VirusTotal v3 URL identifier:
        URL-safe Base64 representation without '=' padding.
        """
        encoded = base64.urlsafe_b64encode(url.encode("utf-8")).decode("ascii")
        return encoded.rstrip("=")

    def check_url(self, normalized_url: str) -> Dict[str, Any]:
        """
        Queries VirusTotal API v3 for the reputation of the normalized URL.
        Never throws uncaught exceptions and strictly formats results according to Spec §2.
        """
        if not normalized_url or not isinstance(normalized_url, str):
            return {
                "provider": "virustotal",
                "checked": False,
                "status": "invalid_url",
                "malicious": 0,
                "suspicious": 0,
                "harmless": 0,
                "undetected": 0,
                "total_engines": 0,
                "detection_ratio": "0/0",
                "error": "Invalid or empty URL provided",
                "details": "Invalid URL provided for inspection.",
                "is_simulated": False
            }

        # Check known demo domains or demo mode first (Spec §21)
        try:
            parsed = urllib.parse.urlparse(normalized_url)
            host = (parsed.hostname or "").lower()
        except Exception:
            host = normalized_url.lower()

        if any(demo_host in host for demo_host in DEMO_MALICIOUS_DOMAINS) or (settings.DEMO_INTEL_MODE and not self.is_configured()):
            return self._handle_demo_mode(normalized_url)

        # Check if real API key is configured
        if self.is_configured():
            try:
                url_id = self.encode_url_id(normalized_url)
                endpoint = f"{VIRUSTOTAL_URL_ENDPOINT}/{url_id}"
                headers = {
                    "x-apikey": self.api_key.strip(),
                    "Accept": "application/json"
                }

                resp = requests.get(endpoint, headers=headers, timeout=self.timeout_seconds)

                if resp.status_code == 200:
                    data = resp.json()
                    attributes = data.get("data", {}).get("attributes", {})
                    stats = attributes.get("last_analysis_stats", {})

                    malicious = int(stats.get("malicious", 0))
                    suspicious = int(stats.get("suspicious", 0))
                    harmless = int(stats.get("harmless", 0))
                    undetected = int(stats.get("undetected", 0))
                    timeout_count = int(stats.get("timeout", 0))

                    total_engines = malicious + suspicious + harmless + undetected + timeout_count
                    if total_engines == 0:
                        total_engines = len(attributes.get("last_analysis_results", {})) or 1

                    ratio_str = f"{malicious}/{total_engines}"

                    if malicious > 0 or suspicious > 0:
                        details_msg = f"{malicious} engine(s) detected malicious characteristics, {suspicious} suspicious out of {total_engines} engines."
                    else:
                        # MANDATORY SPEC §2: 0 detections does NOT mean safe
                        details_msg = "No malicious detections reported by the queried engines."

                    return {
                        "provider": "virustotal",
                        "checked": True,
                        "status": "success",
                        "malicious": malicious,
                        "suspicious": suspicious,
                        "harmless": harmless,
                        "undetected": undetected,
                        "total_engines": total_engines,
                        "detection_ratio": ratio_str,
                        "error": None,
                        "details": details_msg,
                        "is_simulated": False
                    }

                elif resp.status_code == 404:
                    # URL has not been analyzed by VirusTotal yet
                    return {
                        "provider": "virustotal",
                        "checked": True,
                        "status": "unseen",
                        "malicious": 0,
                        "suspicious": 0,
                        "harmless": 0,
                        "undetected": 0,
                        "total_engines": 0,
                        "detection_ratio": "0/0",
                        "error": None,
                        "details": "No prior VirusTotal intelligence found for this URL.",
                        "is_simulated": False
                    }

                elif resp.status_code == 429:
                    return {
                        "provider": "virustotal",
                        "checked": False,
                        "status": "rate_limited",
                        "malicious": 0,
                        "suspicious": 0,
                        "harmless": 0,
                        "undetected": 0,
                        "total_engines": 0,
                        "detection_ratio": "0/0",
                        "error": "VirusTotal request rate limit reached (HTTP 429)",
                        "details": "External threat intelligence unavailable. Assessment uses internal analysis.",
                        "is_simulated": False
                    }

                elif resp.status_code in (401, 403):
                    return {
                        "provider": "virustotal",
                        "checked": False,
                        "status": "quota_exceeded_or_unauthorized",
                        "malicious": 0,
                        "suspicious": 0,
                        "harmless": 0,
                        "undetected": 0,
                        "total_engines": 0,
                        "detection_ratio": "0/0",
                        "error": f"VirusTotal authorization or quota limitation (HTTP {resp.status_code})",
                        "details": "External threat intelligence unavailable. Assessment uses internal analysis.",
                        "is_simulated": False
                    }

                else:
                    return {
                        "provider": "virustotal",
                        "checked": False,
                        "status": "api_error",
                        "malicious": 0,
                        "suspicious": 0,
                        "harmless": 0,
                        "undetected": 0,
                        "total_engines": 0,
                        "detection_ratio": "0/0",
                        "error": f"VirusTotal returned unexpected status {resp.status_code}",
                        "details": "External threat intelligence unavailable. Assessment uses internal analysis.",
                        "is_simulated": False
                    }

            except requests.exceptions.Timeout:
                return {
                    "provider": "virustotal",
                    "checked": False,
                    "status": "timeout",
                    "malicious": 0,
                    "suspicious": 0,
                    "harmless": 0,
                    "undetected": 0,
                    "total_engines": 0,
                    "detection_ratio": "0/0",
                    "error": "VirusTotal request timed out",
                    "details": "External threat intelligence unavailable. Assessment uses internal analysis.",
                    "is_simulated": False
                }
            except requests.exceptions.RequestException as e:
                # Do not leak credentials in exception string
                return {
                    "provider": "virustotal",
                    "checked": False,
                    "status": "network_error",
                    "malicious": 0,
                    "suspicious": 0,
                    "harmless": 0,
                    "undetected": 0,
                    "total_engines": 0,
                    "detection_ratio": "0/0",
                    "error": "Network connectivity error contacting VirusTotal",
                    "details": "External threat intelligence unavailable. Assessment uses internal analysis.",
                    "is_simulated": False
                }
            except Exception as e:
                return {
                    "provider": "virustotal",
                    "checked": False,
                    "status": "unexpected_error",
                    "malicious": 0,
                    "suspicious": 0,
                    "harmless": 0,
                    "undetected": 0,
                    "total_engines": 0,
                    "detection_ratio": "0/0",
                    "error": "Error querying VirusTotal service",
                    "details": "External threat intelligence unavailable. Assessment uses internal analysis.",
                    "is_simulated": False
                }

        # Safe Demo Fallback Mode (Spec §20, §21)
        if settings.DEMO_INTEL_MODE:
            return self._handle_demo_mode(normalized_url)

        # Provider is not configured and demo mode is off
        return {
            "provider": "virustotal",
            "checked": False,
            "status": "not_configured",
            "malicious": 0,
            "suspicious": 0,
            "harmless": 0,
            "undetected": 0,
            "total_engines": 0,
            "detection_ratio": "0/0",
            "error": "VirusTotal API key not configured",
            "details": "External threat intelligence unavailable. Assessment uses internal analysis.",
            "is_simulated": False
        }

    def _handle_demo_mode(self, normalized_url: str) -> Dict[str, Any]:
        """
        Provides clearly labeled simulated intelligence for academic/faculty demonstrations.
        Spec §21: "Never mix simulated data with real provider data without labeling it."
        """
        try:
            parsed = urllib.parse.urlparse(normalized_url)
            host = (parsed.hostname or "").lower()
        except Exception:
            host = normalized_url.lower()

        for demo_host, stats in DEMO_MALICIOUS_DOMAINS.items():
            if demo_host in host:
                mal = stats["malicious"]
                susp = stats["suspicious"]
                tot = stats["malicious"] + stats["suspicious"] + stats["harmless"] + stats["undetected"]
                return {
                    "provider": "virustotal",
                    "checked": True,
                    "status": "success",
                    "malicious": mal,
                    "suspicious": susp,
                    "harmless": stats["harmless"],
                    "undetected": stats["undetected"],
                    "total_engines": tot,
                    "detection_ratio": f"{mal}/{tot}",
                    "error": None,
                    "details": f"{mal} engine(s) detected malicious characteristics (Demo Mode — Simulated).",
                    "is_simulated": True
                }

        # Clean demo domain
        return {
            "provider": "virustotal",
            "checked": True,
            "status": "success",
            "malicious": 0,
            "suspicious": 0,
            "harmless": 18,
            "undetected": 72,
            "total_engines": 90,
            "detection_ratio": "0/90",
            "error": None,
            "details": "No malicious detections reported by the queried engines (Demo Mode — Simulated).",
            "is_simulated": True
        }

virustotal_service = VirusTotalService()
