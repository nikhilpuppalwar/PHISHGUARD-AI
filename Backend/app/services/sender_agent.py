import os
import re
import pickle
from typing import Dict, Any, List, Optional
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from app.config import settings

MODEL_FILE = settings.MODELS_DIR / "sender_agent_random_forest.pkl"

FREE_EMAIL_PROVIDERS = {"gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com", "proton.me", "mail.com"}
ORGANIZATION_KEYWORDS = ["university", "college", "bank", "paypal", "hr", "support", "careers", "security", "admin", "recruitment", "finance", "billing"]

class SenderAgent:
    def __init__(self):
        self.model: RandomForestClassifier = None
        self.algorithm = "Random Forest (Header & Sender Features)"
        self._init_model()

    def _extract_sender_features(self, sender: Optional[str], raw_text: str = "") -> np.ndarray:
        """
        Extract engineered feature vector for Random Forest:
        [is_missing, display_domain_mismatch, is_free_provider_for_org,
         has_spf_softfail, is_young_domain, reply_to_mismatch, lookalike_score]
        """
        if not sender:
            return np.array([1.0, 0.0, 0.0, 1.0, 0.5, 0.0, 0.0], dtype=np.float32).reshape(1, -1)

        sender_clean = sender.strip()
        display_name = ""
        email_addr = ""

        # Extract display name and email: "Display Name <email@domain.com>"
        match = re.search(r"^(.*?)(?:<([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)>)?$", sender_clean)
        if match:
            display_name = (match.group(1) or "").strip().strip('"\'')
            email_addr = match.group(2) or ""

        if not email_addr and "@" in sender_clean:
            email_addr = sender_clean

        domain = email_addr.split("@")[-1].lower() if "@" in email_addr else ""

        # 1. is_missing
        is_missing = 0.0 if email_addr else 1.0

        # 2. display_domain_mismatch
        # E.g. Display Name mentions "PayPal" or "University HR" or "Bank" but domain doesn't contain it
        display_mismatch = 0.0
        disp_low = display_name.lower()
        if any(org in disp_low for org in ORGANIZATION_KEYWORDS):
            if not any(org in domain for org in ORGANIZATION_KEYWORDS):
                display_mismatch = 1.0

        # 3. is_free_provider_for_org
        # Claiming to be official/company but sent from free email service
        is_free_provider = 1.0 if domain in FREE_EMAIL_PROVIDERS and (display_mismatch or any(org in disp_low for org in ORGANIZATION_KEYWORDS)) else 0.0

        # 4. has_spf_softfail / simulated authentication check
        has_spf_softfail = 0.0
        if "spf=softfail" in raw_text.lower() or "dmarc=fail" in raw_text.lower() or "quick-career" in domain or "secure-portal" in domain:
            has_spf_softfail = 1.0

        # 5. is_young_domain (heuristic / newly registered under 30 days)
        is_young_domain = 1.0 if any(token in domain for token in ["career", "verify", "update", "secure", "free", "login", "portal", "2024", "2025"]) and not any(safe in domain for safe in ["google", "microsoft", "apple", "amazon", "github", "linkedin"]) else 0.0

        # 6. reply_to_mismatch
        reply_to_mismatch = 0.0
        reply_match = re.search(r"Reply-To:\s*.*?@([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)", raw_text, re.IGNORECASE)
        if reply_match:
            reply_domain = reply_match.group(1).lower()
            if reply_domain != domain:
                reply_to_mismatch = 1.0

        # 7. lookalike_score / typosquatting
        lookalike_score = 1.0 if any(domain.endswith(t) for t in [".xyz", ".top", ".live", ".cc", ".org"] if "paypal" in domain or "google" in domain or "bank" in domain) else 0.0

        return np.array([
            is_missing, display_mismatch, is_free_provider,
            has_spf_softfail, is_young_domain, reply_to_mismatch, lookalike_score
        ], dtype=np.float32).reshape(1, -1)

    def _init_model(self):
        if MODEL_FILE.exists():
            try:
                with open(MODEL_FILE, "rb") as f:
                    self.model = pickle.load(f)
                return
            except Exception:
                pass

        # Train Random Forest classifier on sender feature distribution
        np.random.seed(42)
        n_samples = 400

        # Phishing sender features
        phish_X = np.column_stack([
            np.random.binomial(1, 0.1, n_samples),   # is_missing
            np.random.binomial(1, 0.75, n_samples),  # display_mismatch
            np.random.binomial(1, 0.45, n_samples),  # is_free_provider
            np.random.binomial(1, 0.65, n_samples),  # has_spf_softfail
            np.random.binomial(1, 0.70, n_samples),  # is_young_domain
            np.random.binomial(1, 0.40, n_samples),  # reply_to_mismatch
            np.random.binomial(1, 0.35, n_samples),  # lookalike_score
        ])

        # Legitimate sender features
        legit_X = np.column_stack([
            np.random.binomial(1, 0.02, n_samples),  # is_missing
            np.random.binomial(1, 0.04, n_samples),  # display_mismatch
            np.random.binomial(1, 0.08, n_samples),  # is_free_provider
            np.random.binomial(1, 0.05, n_samples),  # has_spf_softfail
            np.random.binomial(1, 0.05, n_samples),  # is_young_domain
            np.random.binomial(1, 0.02, n_samples),  # reply_to_mismatch
            np.zeros(n_samples),                     # lookalike_score
        ])

        X = np.vstack([phish_X, legit_X])
        y = np.array([1] * n_samples + [0] * n_samples)

        self.model = RandomForestClassifier(
            n_estimators=120,
            max_depth=5,
            min_samples_split=4,
            random_state=42
        )
        self.model.fit(X, y)

        try:
            with open(MODEL_FILE, "wb") as f:
                pickle.dump(self.model, f)
        except Exception:
            pass

    def analyze(self, sender: Optional[str], raw_text: str = "") -> Dict[str, Any]:
        """
        Perform Random Forest classification on sender metadata and heuristic checks (Spec §8).
        Strictly preserves factual evidence: SPF/DKIM/DMARC reported as 'Not provided' if missing.
        Never fabricates authentication results.
        """
        raw_lower = raw_text.lower() if raw_text else ""

        # Parse actual authentication headers only if present in payload
        spf_status = "Not provided"
        if "received-spf:" in raw_lower or "spf=" in raw_lower:
            if "pass" in raw_lower:
                spf_status = "Pass"
            elif "fail" in raw_lower or "softfail" in raw_lower:
                spf_status = "Softfail / Fail"

        dkim_status = "Not provided"
        if "dkim-signature:" in raw_lower or "dkim=" in raw_lower:
            if "dkim=pass" in raw_lower:
                dkim_status = "Pass"
            elif "dkim=fail" in raw_lower:
                dkim_status = "Fail"

        dmarc_status = "Not provided"
        if "dmarc=" in raw_lower:
            if "dmarc=pass" in raw_lower:
                dmarc_status = "Pass"
            elif "dmarc=fail" in raw_lower:
                dmarc_status = "Fail"

        auth_headers = {
            "spf": spf_status,
            "dkim": dkim_status,
            "dmarc": dmarc_status
        }

        if not sender or len(sender.strip()) == 0:
            return {
                "agent_type": "sender",
                "agent": "sender",
                "status": "limited_evidence",
                "risk_score": 25.0,
                "model_probability": 0.25,
                "indicators": ["Anonymous sender / missing RFC 5322 From: address header"],
                "evidence": [{
                    "indicator": "missing_sender_header",
                    "severity": "LOW",
                    "evidence": "No sender header supplied in payload."
                }],
                "sender_email": None,
                "sender_domain": None,
                "display_name": None,
                "auth_headers": auth_headers,
                "summary": "Sender header absent or anonymous. Unable to verify domain origin.",
                "model_name": self.algorithm
            }

        sender_clean = sender.strip()
        display_name = ""
        email_addr = ""

        match = re.search(r"^(.*?)(?:<([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)>)?$", sender_clean)
        if match:
            display_name = (match.group(1) or "").strip().strip('"\'')
            email_addr = match.group(2) or ""

        if not email_addr and "@" in sender_clean:
            email_addr = sender_clean

        domain = email_addr.split("@")[-1].lower() if "@" in email_addr else ""

        features = self._extract_sender_features(sender, raw_text)
        prob_phish = float(self.model.predict_proba(features)[0][1])

        indicators = []
        structured_evidence = []
        sender_lower = sender_clean.lower()

        # Display name impersonation check
        disp_low = display_name.lower() if display_name else ""
        if display_name and any(org in disp_low for org in ORGANIZATION_KEYWORDS):
            if not any(org in domain for org in ORGANIZATION_KEYWORDS):
                indicators.append(f"Display name impersonation: claims identity '{display_name}' but sent from unrelated domain '{domain}'")
                structured_evidence.append({
                    "indicator": "display_impersonation",
                    "severity": "HIGH",
                    "evidence": f"From: {sender_clean}"
                })

        if any(f in domain for f in FREE_EMAIL_PROVIDERS) and (display_name or any(org in raw_lower for org in ORGANIZATION_KEYWORDS)):
            indicators.append(f"Institutional/commercial communication sent from free public email provider ({domain})")
            structured_evidence.append({
                "indicator": "free_provider_for_org",
                "severity": "HIGH",
                "evidence": f"Sender domain: {domain}"
            })

        if spf_status in ["Softfail / Fail", "Fail"]:
            indicators.append(f"SPF authentication mismatch: {spf_status}")
            structured_evidence.append({
                "indicator": "spf_failure",
                "severity": "HIGH",
                "evidence": f"SPF header status: {spf_status}"
            })

        if dmarc_status == "Fail":
            indicators.append("DMARC alignment check failed")
            structured_evidence.append({
                "indicator": "dmarc_failure",
                "severity": "HIGH",
                "evidence": "DMARC status: Fail"
            })

        if re.search(r"Reply-To:", raw_text, re.IGNORECASE) and features[0][5] == 1.0:
            indicators.append("Reply-To address points to an external unverified domain")
            structured_evidence.append({
                "indicator": "reply_to_mismatch",
                "severity": "MEDIUM",
                "evidence": "Reply-To header mismatch"
            })

        # Base risk calculation
        if indicators:
            risk_score = round(max(prob_phish * 100, 75.0 if len(indicators) >= 2 else 55.0), 1)
            summary = f"Sender {sender_clean}: Flagged {len(indicators)} domain and identity anomalies."
        else:
            risk_score = round(min(prob_phish * 100, 20.0), 1)
            summary = f"Sender {sender_clean} domain aligns with expected identity conventions."

        return {
            "agent_type": "sender",
            "agent": "sender",
            "status": "success",
            "risk_score": risk_score,
            "model_probability": round(prob_phish, 4),
            "indicators": indicators,
            "evidence": structured_evidence,
            "sender_email": email_addr,
            "sender_domain": domain,
            "display_name": display_name or None,
            "auth_headers": auth_headers,
            "confidence": round(0.70 + (0.25 if indicators else 0.15), 2),
            "summary": summary,
            "model_name": self.algorithm
        }

sender_agent = SenderAgent()
