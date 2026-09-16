import os
import re
import pickle
from urllib.parse import urlparse
from typing import Dict, Any, List, Optional
import numpy as np
import xgboost as xgb
from app.config import settings

MODEL_FILE = settings.MODELS_DIR / "url_agent_xgboost.pkl"

SHORTENERS = {"bit.ly", "tinyurl.com", "t.co", "is.gd", "buff.ly", "ow.ly", "rebrand.ly", "cutt.ly"}
SUSPICIOUS_TLDS = {"xyz", "top", "online", "site", "live", "club", "vip", "link", "click", "work", "loan", "info"}
HIGH_RISK_KEYWORDS = ["login", "verify", "secure", "update", "bank", "pay", "crypto", "account", "wallet", "signin", "portal", "confirm", "free", "fee"]

class URLAgent:
    def __init__(self):
        self.model = None
        self.algorithm = "XGBoost (PhiUSIIL-Engineered Features)"
        self._init_model()

    def _extract_features(self, url: str) -> np.ndarray:
        """Extract a 14-dimensional normalized feature vector based on PhiUSIIL attribute set."""
        parsed = urlparse(url if "://" in url else "http://" + url)
        domain = parsed.netloc.lower()
        path = parsed.path.lower()
        full = url.lower()

        # 1. URLLength
        url_len = len(url)
        # 2. DomainLength
        dom_len = len(domain)
        # 3. IsDomainIP
        is_ip = 1 if re.match(r"^\d{1,3}(\.\d{1,3}){3}", domain) else 0
        # 4. HasShortener
        is_short = 1 if any(s in domain for s in SHORTENERS) else 0
        # 5. SuspiciousTLD
        tld = domain.split(".")[-1] if "." in domain else ""
        is_sus_tld = 1 if tld in SUSPICIOUS_TLDS else 0
        # 6. NoOfSubDomain
        subdomains = max(0, len(domain.split(".")) - 2)
        # 7. NoOfObfuscatedChar / Hex
        has_obfuscation = 1 if "%" in url or "@" in url else 0
        # 8. DigitRatio
        digit_count = sum(c.isdigit() for c in url)
        digit_ratio = digit_count / max(1, url_len)
        # 9. SpecialCharCount
        special_count = len(re.findall(r"[-_?=&%@~]", url))
        special_ratio = special_count / max(1, url_len)
        # 10. IsHTTPS
        is_https = 1 if parsed.scheme == "https" else 0
        # 11. KeywordCount
        keyword_hits = sum(1 for kw in HIGH_RISK_KEYWORDS if kw in full)
        # 12. HyphenInDomain
        hyphen_dom = domain.count("-")
        # 13. AtSymbol
        has_at = 1 if "@" in url else 0
        # 14. QueryParamLength
        query_len = len(parsed.query)

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
        # Phishing distribution
        n_phish = 500
        phish_feats = np.column_stack([
            np.random.normal(75, 25, n_phish).clip(30, 200),     # URLLength
            np.random.normal(24, 8, n_phish).clip(10, 60),       # DomainLength
            np.random.binomial(1, 0.15, n_phish),                # IsDomainIP
            np.random.binomial(1, 0.35, n_phish),                # is_short
            np.random.binomial(1, 0.40, n_phish),                # is_sus_tld
            np.random.poisson(2.5, n_phish),                     # subdomains
            np.random.binomial(1, 0.25, n_phish),                # has_obfuscation
            np.random.uniform(0.1, 0.4, n_phish),                # digit_ratio
            np.random.uniform(0.08, 0.25, n_phish),              # special_ratio
            np.random.binomial(1, 0.30, n_phish),                # is_https (many phish still http or fake https)
            np.random.poisson(2.0, n_phish),                     # keyword_hits
            np.random.poisson(1.8, n_phish),                     # hyphen_dom
            np.random.binomial(1, 0.10, n_phish),                # has_at
            np.random.normal(40, 20, n_phish).clip(0, 150),      # query_len
        ])

        # Legitimate distribution
        n_legit = 500
        legit_feats = np.column_stack([
            np.random.normal(35, 12, n_legit).clip(15, 80),      # URLLength
            np.random.normal(16, 5, n_legit).clip(6, 30),        # DomainLength
            np.zeros(n_legit),                                   # IsDomainIP
            np.random.binomial(1, 0.02, n_legit),                # is_short
            np.random.binomial(1, 0.05, n_legit),                # is_sus_tld
            np.random.poisson(0.4, n_legit),                     # subdomains
            np.zeros(n_legit),                                   # has_obfuscation
            np.random.uniform(0.0, 0.08, n_legit),               # digit_ratio
            np.random.uniform(0.01, 0.06, n_legit),              # special_ratio
            np.random.binomial(1, 0.95, n_legit),                # is_https
            np.random.poisson(0.2, n_legit),                     # keyword_hits
            np.random.poisson(0.3, n_legit),                     # hyphen_dom
            np.zeros(n_legit),                                   # has_at
            np.random.normal(10, 8, n_legit).clip(0, 50),        # query_len
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

    def analyze(self, urls: List[str]) -> Dict[str, Any]:
        """Evaluate extracted URLs and return maximum risk probability and flagged features."""
        if not urls:
            return {
                "agent_type": "url",
                "risk_score": 0.0,
                "model_probability": 0.0,
                "indicators": [],
                "summary": "No embedded links detected in payload.",
                "model_name": self.algorithm
            }

        max_prob = 0.0
        flagged_indicators = []
        most_risky_url = urls[0]

        for u in urls:
            feat = self._extract_features(u)
            prob = float(self.model.predict_proba(feat)[0][1])
            parsed = urlparse(u if "://" in u else "http://" + u)
            domain = parsed.netloc.lower()

            url_indicators = []
            if any(s in domain for s in SHORTENERS):
                url_indicators.append("URL shortening / redirect obfuscation detected (e.g. bit.ly)")
            if any(domain.endswith("." + tld) for tld in SUSPICIOUS_TLDS):
                url_indicators.append(f"Suspicious / untrusted top-level domain (.{domain.split('.')[-1]})")
            if re.match(r"^\d{1,3}(\.\d{1,3}){3}", domain):
                url_indicators.append("Raw numeric IP address used instead of legitimate domain name")
            if parsed.scheme != "https":
                url_indicators.append("Insecure plain HTTP protocol (no TLS certificate encryption)")
            if any(kw in u.lower() for kw in ["login", "verify", "account", "portal", "fee"]):
                url_indicators.append("Credential or payment keyword in URL path")
            if domain.count("-") >= 2:
                url_indicators.append("Excessive hyphens in hostname suggesting typosquatting")

            if prob > max_prob:
                max_prob = prob
                most_risky_url = u
                flagged_indicators = url_indicators

        # Adjust risk score based on model prob and flags
        risk_score = round(max(max_prob, 0.35 if flagged_indicators else 0.0) * 100, 1)
        summary = f"Analyzed URL: {most_risky_url}. Flagged {len(flagged_indicators)} risk anomalies." if flagged_indicators else "URL structure aligns with legitimate domain standards."

        return {
            "agent_type": "url",
            "risk_score": risk_score,
            "model_probability": round(max_prob, 4),
            "indicators": flagged_indicators,
            "summary": summary,
            "model_name": self.algorithm
        }

url_agent = URLAgent()
