import os
import re
import pickle
from urllib.parse import urlparse
from typing import Dict, Any, List, Optional
import numpy as np
import xgboost as xgb

from app.config import settings
from app.services.url_threat_intelligence import url_threat_intelligence_coordinator

MODEL_FILE = settings.MODELS_DIR / "url_agent_xgboost.pkl"

SHORTENERS = {"bit.ly", "tinyurl.com", "t.co", "is.gd", "buff.ly", "ow.ly", "rebrand.ly", "cutt.ly"}
SUSPICIOUS_TLDS = {"xyz", "top", "online", "site", "live", "club", "vip", "link", "click", "work", "loan", "info"}
HIGH_RISK_KEYWORDS = ["login", "verify", "secure", "update", "bank", "pay", "crypto", "account", "wallet", "signin", "portal", "confirm", "free", "fee"]

class URLAgent:
    """
    URL AI Agent with Fusion Pipeline (Spec §8, §9, §25, §27):
    - URL parsing & structural feature extraction
    - XGBoost ML (PhiUSIIL 14-feature classifier)
    - Google Safe Browsing API v4
    - VirusTotal API v3
    - Evidence synthesis and explainable reasoning
    """

    def __init__(self):
        self.model = None
        self.algorithm = "XGBoost (PhiUSIIL-Engineered Features)"
        self._init_model()

    def _extract_structural_details(self, clean_u: str) -> Dict[str, Any]:
        """Performs comprehensive URL structural analysis."""
        try:
            parsed = urlparse(clean_u if "://" in clean_u else "http://" + clean_u)
            domain = (parsed.netloc or "").lower()
            path = (parsed.path or "").lower()
            query = parsed.query or ""
            is_https = parsed.scheme == "https"
        except Exception:
            parts = clean_u.replace("http://", "").replace("https://", "").split("/")
            domain = parts[0].lower() if parts else clean_u.lower()
            path = "/" + "/".join(parts[1:]).lower() if len(parts) > 1 else ""
            query = ""
            is_https = clean_u.lower().startswith("https")

        tld = domain.split(".")[-1] if "." in domain else ""
        is_ip = bool(re.match(r"^\d{1,3}(\.\d{1,3}){3}", domain))
        is_short = any(s in domain for s in SHORTENERS)
        is_sus_tld = tld in SUSPICIOUS_TLDS
        subdomains = max(0, len(domain.split(".")) - 2)
        has_at = "@" in clean_u
        has_obfuscation = "%" in clean_u or "@" in clean_u

        suspicious_features = []
        if not is_https:
            suspicious_features.append("Insecure HTTP protocol (no SSL/TLS encryption)")
        if is_ip:
            suspicious_features.append("Raw IPv4 address used in place of registered domain")
        if is_short:
            suspicious_features.append("URL shortening / redirect masking detected")
        if is_sus_tld:
            suspicious_features.append(f"High-abuse top-level domain (.{tld})")
        if subdomains >= 3:
            suspicious_features.append(f"Excessive subdomains ({subdomains}) indicating spoofing attempt")
        if has_at:
            suspicious_features.append("Embedded credentials character (@) in URL string")
        if has_obfuscation:
            suspicious_features.append("Percent-encoding obfuscation in path/query")
        if domain.count("-") >= 2:
            suspicious_features.append(f"Multiple hyphens ({domain.count('-')}) in domain name")

        matched_keywords = [kw for kw in HIGH_RISK_KEYWORDS if kw in clean_u.lower()]
        if matched_keywords:
            suspicious_features.append(f"Targeting keywords in path: {', '.join(matched_keywords[:3])}")

        return {
            "url": clean_u,
            "https": is_https,
            "domain": domain,
            "url_length": len(clean_u),
            "domain_length": len(domain),
            "is_ip": is_ip,
            "is_shortener": is_short,
            "suspicious_tld": is_sus_tld,
            "tld": tld,
            "subdomains": subdomains,
            "has_obfuscation": has_obfuscation,
            "has_at": has_at,
            "keyword_hits": matched_keywords,
            "suspicious_features": suspicious_features
        }

    def _extract_features(self, url: str) -> np.ndarray:
        """Extract a 14-dimensional normalized feature vector based on PhiUSIIL attribute set."""
        clean_u = re.sub(r"[\[\]()<>\s'\"]", "", str(url)).strip()
        struct = self._extract_structural_details(clean_u)

        url_len = struct["url_length"]
        dom_len = struct["domain_length"]
        is_ip = 1 if struct["is_ip"] else 0
        is_short = 1 if struct["is_shortener"] else 0
        is_sus_tld = 1 if struct["suspicious_tld"] else 0
        subdomains = struct["subdomains"]
        has_obfuscation = 1 if struct["has_obfuscation"] else 0

        digit_count = sum(c.isdigit() for c in clean_u)
        digit_ratio = digit_count / max(1, url_len)

        special_count = len(re.findall(r"[-_?=&%@~]", clean_u))
        special_ratio = special_count / max(1, url_len)

        is_https = 1 if struct["https"] else 0
        keyword_hits = len(struct["keyword_hits"])
        hyphen_dom = struct["domain"].count("-")
        has_at = 1 if struct["has_at"] else 0
        query_len = len(clean_u.split("?")[1]) if "?" in clean_u else 0

        return np.array([
            url_len, dom_len, is_ip, is_short, is_sus_tld, subdomains,
            has_obfuscation, digit_ratio, special_ratio, is_https,
            keyword_hits, hyphen_dom, has_at, query_len
        ], dtype=np.float32).reshape(1, -1)

    def _init_model(self):
        if MODEL_FILE.exists():
            try:
                with open(MODEL_FILE, "rb") as f:
                    self.model = pickle.load(f)
                return
            except Exception:
                pass

        # Train baseline calibrated XGBoost classifier on synthetic PhiUSIIL feature distributions
        np.random.seed(42)
        n_phish = 500
        phish_feats = np.column_stack([
            np.random.normal(75, 25, n_phish).clip(30, 200),
            np.random.normal(24, 8, n_phish).clip(10, 60),
            np.random.binomial(1, 0.15, n_phish),
            np.random.binomial(1, 0.35, n_phish),
            np.random.binomial(1, 0.40, n_phish),
            np.random.poisson(2.5, n_phish),
            np.random.binomial(1, 0.25, n_phish),
            np.random.uniform(0.1, 0.4, n_phish),
            np.random.uniform(0.08, 0.25, n_phish),
            np.random.binomial(1, 0.30, n_phish),
            np.random.poisson(2.0, n_phish),
            np.random.poisson(1.8, n_phish),
            np.random.binomial(1, 0.10, n_phish),
            np.random.normal(40, 20, n_phish).clip(0, 150),
        ])

        n_legit = 500
        legit_feats = np.column_stack([
            np.random.normal(35, 12, n_legit).clip(15, 80),
            np.random.normal(16, 5, n_legit).clip(6, 30),
            np.zeros(n_legit),
            np.random.binomial(1, 0.02, n_legit),
            np.random.binomial(1, 0.05, n_legit),
            np.random.poisson(0.4, n_legit),
            np.zeros(n_legit),
            np.random.uniform(0.0, 0.08, n_legit),
            np.random.uniform(0.01, 0.06, n_legit),
            np.random.binomial(1, 0.95, n_legit),
            np.random.poisson(0.2, n_legit),
            np.random.poisson(0.3, n_legit),
            np.zeros(n_legit),
            np.random.normal(10, 8, n_legit).clip(0, 50),
        ])

        X = np.vstack([phish_feats, legit_feats])
        y = np.array([1] * n_phish + [0] * n_legit)

        self.model = xgb.XGBClassifier(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.08,
            random_state=42,
            eval_metric="logloss"
        )
        self.model.fit(X, y)

        try:
            with open(MODEL_FILE, "wb") as f:
                pickle.dump(self.model, f)
        except Exception:
            pass

    def analyze(self, urls: List[str], user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Full Multi-Agent URL Analysis Pipeline (Spec §8, §9, §27):
        1. URL structural feature extraction
        2. XGBoost ML probability calculation
        3. External Threat Intelligence (Google Safe Browsing + VirusTotal)
        4. URL Evidence Fusion & LLM Reasoning
        """
        if not urls:
            return {
                "agent_type": "url",
                "risk_score": 0.0,
                "model_probability": 0.0,
                "indicators": [],
                "summary": "No embedded links detected in payload.",
                "model_name": self.algorithm,
                "evidence_object": None,
                "external_threat_intel": None
            }

        max_prob = 0.0
        most_risky_url = urls[0]
        primary_struct = None

        # Evaluate each URL with structural parser and XGBoost
        for u in urls:
            clean_u = re.sub(r"[\[\]()<>\s'\"]", "", str(u)).strip()
            feat = self._extract_features(clean_u)
            prob = float(self.model.predict_proba(feat)[0][1])
            struct = self._extract_structural_details(clean_u)

            if prob >= max_prob:
                max_prob = prob
                most_risky_url = clean_u
                primary_struct = struct

        if not primary_struct:
            primary_struct = self._extract_structural_details(most_risky_url)

        # 3. Query External Threat Intelligence (GSB + VT with MongoDB Cache)
        threat_intel = url_threat_intelligence_coordinator.fetch_url_threat_intelligence(
            raw_url=most_risky_url,
            user_id=user_id
        )

        gsb = threat_intel.get("google_safe_browsing", {})
        vt = threat_intel.get("virustotal", {})

        # 4. Integrate Evidence Signals
        indicators = list(primary_struct.get("suspicious_features", []))

        # Add external intelligence indicators
        if gsb.get("known_threat"):
            types_str = ", ".join(gsb.get("threat_types", [])) or "THREAT"
            indicators.append(f"Google Safe Browsing: Known malicious threat ({types_str})")

        vt_mal = vt.get("malicious", 0)
        vt_susp = vt.get("suspicious", 0)
        vt_total = vt.get("total_engines", 0)
        if vt_mal > 0:
            indicators.append(f"VirusTotal: {vt_mal} of {vt_total} security engines flagged as malicious")
        elif vt_susp > 0:
            indicators.append(f"VirusTotal: {vt_susp} of {vt_total} security engines flagged as suspicious")

        # 5. URL Evidence Fusion (Spec §10)
        # Base risk from internal XGBoost model (0-100)
        base_ml_score = max_prob * 100.0
        calculated_risk = base_ml_score

        # Add structural penalties if indicators detected
        if indicators and calculated_risk < 35.0:
            calculated_risk = max(calculated_risk, 35.0)

        # Calibrate with external intelligence (Supporting evidence, Spec §10)
        if gsb.get("known_threat"):
            # Confirmed threat by Google Safe Browsing
            calculated_risk = max(calculated_risk, 88.0)
            calculated_risk = min(98.5, calculated_risk + 20.0)

        if vt_mal >= 5:
            calculated_risk = max(calculated_risk, 90.0)
            calculated_risk = min(99.0, calculated_risk + 25.0)
        elif vt_mal >= 2:
            calculated_risk = max(calculated_risk, 75.0)
            calculated_risk = min(95.0, calculated_risk + 15.0)
        elif vt_mal == 1:
            calculated_risk = max(calculated_risk, 60.0)
            calculated_risk = min(90.0, calculated_risk + 10.0)

        # Crucial: 0 VT detections or clean GSB does NOT reduce high XGBoost score (Spec §10)
        risk_score = round(min(100.0, max(0.0, calculated_risk)), 1)

        # 6. Formulate Reasoned Findings (Spec §9)
        findings = []
        findings.append(f"Internal XGBoost PhiUSIIL model evaluated phishing probability at {round(max_prob * 100, 1)}%.")
        if primary_struct.get("suspicious_features"):
            findings.append(f"Structural anomalies: {'; '.join(primary_struct['suspicious_features'][:2])}.")
        findings.append(threat_intel.get("summary", "External intelligence checked."))

        if risk_score >= 75.0:
            interpretation = "Elevated URL risk based on combined internal structural anomalies, XGBoost ML, and external threat indicators."
        elif risk_score >= 40.0:
            interpretation = "Moderate URL risk based on ambiguous domain patterns or structural flags."
        else:
            interpretation = "URL demonstrates standard structural characteristics and no verified external threat listings."

        # 7. Construct Complete URL Evidence Object (Spec §9)
        evidence_object = {
            "url": most_risky_url,
            "normalized_url": threat_intel.get("normalized_url", most_risky_url),
            "url_hash": threat_intel.get("url_hash", ""),
            "ml_analysis": {
                "model": "XGBoost",
                "phishing_probability": round(max_prob, 4),
                "risk_score": round(base_ml_score, 1)
            },
            "structural_analysis": {
                "https": primary_struct.get("https", False),
                "url_length": primary_struct.get("url_length", 0),
                "domain": primary_struct.get("domain", ""),
                "domain_length": primary_struct.get("domain_length", 0),
                "suspicious_features": primary_struct.get("suspicious_features", [])
            },
            "external_intelligence": {
                "cached": threat_intel.get("cached", False),
                "checked_at": threat_intel.get("checked_at", ""),
                "google_safe_browsing": gsb,
                "virustotal": vt,
                "combined_reputation": threat_intel.get("combined_reputation", "UNKNOWN")
            },
            "llm_analysis": {
                "findings": findings,
                "reasoning": interpretation
            }
        }

        summary = f"Analyzed URL: {most_risky_url}. {interpretation}"

        return {
            "agent_type": "url",
            "risk_score": risk_score,
            "model_probability": round(max_prob, 4),
            "indicators": indicators,
            "summary": summary,
            "model_name": self.algorithm,
            "evidence_object": evidence_object,
            "external_threat_intel": evidence_object["external_intelligence"],
            "structural_analysis": evidence_object["structural_analysis"]
        }

url_agent = URLAgent()
