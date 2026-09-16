import os
import re
import pickle
from pathlib import Path
from typing import Dict, Any, List, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from app.config import settings

MODEL_FILE = settings.MODELS_DIR / "text_agent_tfidf_lr.pkl"

# Lexical trigger patterns
URGENCY_PATTERNS = [
    r"\b(within\s+\d+\s*(?:hours?|mins?|days?)|immediately|urgent|action\s+required|final\s+notice|suspended|deadline|failure\s+to\s+process|expires|risk\s+of\s+cancellation)\b"
]
PAYMENT_PATTERNS = [
    r"\b(fee|payment|pay\b|deposit|₹\s*\d+|\$\s*\d+|transfer|wire|crypto|bitcoin|gift\s*card|advance\s*fee|registration\s*fee|processing\s*fee)\b"
]
CREDENTIAL_PATTERNS = [
    r"\b(password|credential|login|verify\s+your\s+account|update\s+billing|security\s+alert|candidate\s+pass|portal\s+link|claim\s+now)\b"
]
SOCIAL_ENGINEERING_PATTERNS = [
    r"\b(congratulations|selected|exclusive|special\s+offer|lottery|winner|inheritance|compensation|funds|guaranteed)\b"
]

from sqlalchemy.orm import Session
from app.services.llm_gateway import llm_service
from app.prompts.templates import TEXT_ANALYSIS_SYSTEM_PROMPT, TEXT_ANALYSIS_USER_TEMPLATE, wrap_untrusted

class TextAgent:
    def __init__(self):
        self.vectorizer: TfidfVectorizer = None
        self.model: LogisticRegression = None
        self.algorithm = "TF-IDF + Logistic Regression"
        self._init_model()

    def _init_model(self):
        if MODEL_FILE.exists():
            try:
                with open(MODEL_FILE, "rb") as f:
                    saved = pickle.load(f)
                    self.vectorizer = saved["vectorizer"]
                    self.model = saved["model"]
                return
            except Exception:
                pass
        
        # Initialize default calibrated weights with representative cybersecurity phishing & legitimate data
        sample_phish = [
            "Congratulations! You have been selected for the Summer Analyst internship program. Pay ₹2,000 within 2 hours using the portal link to reserve your slot. Failure to process releases allocation.",
            "Urgent: Your bank account has been locked due to suspicious activity. Verify credentials immediately at http://secure-portal.net or access will be suspended.",
            "Dear User, your mailbox storage is exceeded. Update billing and password at our IT desk within 24 hours.",
            "Your PayPal account was accessed from an unknown device. Click the link to secure your account and avoid permanent closure.",
            "Job offer: Earn $500 daily working from home. Submit processing fee and candidate registration form immediately.",
            "Alert: Unauthorized wire transaction of $4,500 pending. Call or verify password now.",
            "Congratulations winner! You won $1,000,000 lottery award. Send advance processing fee to claim prize."
        ] * 40

        sample_legit = [
            "Hi Alex, attached is the revised project report for our weekly sync. Let me know if you have feedback before tomorrow's meeting.",
            "Reminder: Team standup will be at 10:00 AM on Google Meet. See agenda in calendar invite.",
            "Your weekly GitHub digest: 5 commits pushed to main branch. All CI workflows passed successfully.",
            "Professor Smith's Office Hours: Wednesdays 2 PM to 4 PM in Room 302. Bring your assignment drafts.",
            "Invoice #4029 from Acme Corp: This is an automated receipt for your monthly cloud subscription. No action required.",
            "University Library notice: The book you requested is ready for pickup at the front desk.",
            "Welcome to the department newsletter. Read this month's updates on student research and faculty publications."
        ] * 40

        texts = sample_phish + sample_legit
        labels = [1] * len(sample_phish) + [0] * len(sample_legit)

        self.vectorizer = TfidfVectorizer(max_features=2500, ngram_range=(1, 2), stop_words="english")
        X = self.vectorizer.fit_transform(texts)
        self.model = LogisticRegression(C=1.5, max_iter=200)
        self.model.fit(X, labels)

        try:
            with open(MODEL_FILE, "wb") as f:
                pickle.dump({"vectorizer": self.vectorizer, "model": self.model}, f)
        except Exception:
            pass

    def analyze(self, text: str, db: Optional[Session] = None) -> Dict[str, Any]:
        """
        Analyze suspicious text using a hybrid pipeline:
        1. NLP Machine Learning (TF-IDF + Logistic Regression)
        2. Lexical indicator pattern extraction
        3. Real LLM Semantic & Social Engineering Analysis (via active gateway provider)
        """
        if not text or len(text.strip()) == 0:
            return {
                "agent_type": "text",
                "risk_score": 0.0,
                "model_probability": 0.0,
                "indicators": [],
                "signals": [],
                "summary": "No textual content provided.",
                "model_name": self.algorithm
            }

        cleaned = text.strip()
        X_vec = self.vectorizer.transform([cleaned])
        prob_phish = float(self.model.predict_proba(X_vec)[0][1])

        indicators = []
        lowered = cleaned.lower()

        # Regex heuristic extractions
        if any(re.search(p, lowered, re.IGNORECASE) for p in URGENCY_PATTERNS):
            indicators.append("High synthetic urgency / artificial deadline constraint")
        if any(re.search(p, lowered, re.IGNORECASE) for p in PAYMENT_PATTERNS):
            indicators.append("Unprompted upfront payment or advance-fee demand")
        if any(re.search(p, lowered, re.IGNORECASE) for p in CREDENTIAL_PATTERNS):
            indicators.append("Credential harvesting language or login portal redirection")
        if any(re.search(p, lowered, re.IGNORECASE) for p in SOCIAL_ENGINEERING_PATTERNS):
            indicators.append("Coercive psychological manipulation (unsolicited prize/offer)")

        # 3. Real LLM Semantic Analysis if DB session is available
        llm_signals = []
        llm_confidence = None
        llm_classification = None
        llm_attack_type = None
        used_llm = False

        if db:
            try:
                prompt = TEXT_ANALYSIS_USER_TEMPLATE.format(
                    untrusted_text=wrap_untrusted(cleaned[:2500], "INBOUND EMAIL OR MESSAGE TEXT")
                )
                llm_res = llm_service.generate_structured(
                    db=db,
                    prompt=prompt,
                    system_prompt=TEXT_ANALYSIS_SYSTEM_PROMPT
                )
                if llm_res and isinstance(llm_res, dict):
                    # Schema Validation (Section 4 & Section 19)
                    llm_cls = str(llm_res.get("classification", "")).lower()
                    if llm_cls in ["phishing", "suspicious", "legitimate"]:
                        llm_classification = llm_cls
                    
                    conf = llm_res.get("confidence")
                    if isinstance(conf, (int, float)) and 0.0 <= float(conf) <= 1.0:
                        llm_confidence = float(conf)
                    
                    llm_attack_type = llm_res.get("attack_type")
                    raw_signals = llm_res.get("signals")
                    if isinstance(raw_signals, list):
                        for sig in raw_signals:
                            if isinstance(sig, dict) and sig.get("description"):
                                sig_type = str(sig.get("type", "indicator")).replace("_", " ").title()
                                sig_desc = str(sig["description"]).strip()
                                llm_signals.append({
                                    "type": sig.get("type", "indicator"),
                                    "severity": sig.get("severity", "medium"),
                                    "description": sig_desc
                                })
                                # Merge into indicators list without exact duplicate strings
                                candidate = f"{sig_type}: {sig_desc}"
                                if not any(sig_desc.lower() in ind.lower() for ind in indicators):
                                    indicators.append(candidate)
                        used_llm = True
            except Exception as e:
                print(f"TextAgent LLM inference error (falling back to ML/heuristics): {e}")

        # Compute combined risk score
        if used_llm and llm_confidence is not None:
            # Calibrate LLM confidence with Logistic Regression probability
            if llm_classification == "phishing":
                eff_prob = max(prob_phish, llm_confidence)
            elif llm_classification == "legitimate":
                eff_prob = min(prob_phish, 1.0 - llm_confidence)
            else:
                eff_prob = (llm_confidence * 0.6) + (prob_phish * 0.4)
            
            heuristic_boost = min(0.30, len(indicators) * 0.08)
            combined_score = min(1.0, max(0.0, (eff_prob * 0.75) + heuristic_boost))
            active_model = f"LLM ({llm_service.get_active_provider_summary(db)['provider'].title()}) + {self.algorithm}"
        else:
            heuristic_boost = len(indicators) * 0.12
            combined_score = min(1.0, max(0.0, (prob_phish * 0.70) + heuristic_boost))
            active_model = self.algorithm

        risk_score = round(combined_score * 100, 1)

        summary_parts = []
        if indicators:
            summary_parts.append(f"Detected {len(indicators)} deceptive semantic patterns: {'; '.join(indicators[:2])}.")
        else:
            summary_parts.append("Natural text flow with standard phrasing.")

        return {
            "agent_type": "text",
            "risk_score": risk_score,
            "model_probability": round(prob_phish, 4),
            "indicators": indicators,
            "signals": llm_signals,
            "classification": llm_classification or ("phishing" if risk_score >= 70 else "legitimate"),
            "llm_confidence": llm_confidence,
            "attack_type": llm_attack_type,
            "summary": " ".join(summary_parts),
            "model_name": active_model
        }

text_agent = TextAgent()

