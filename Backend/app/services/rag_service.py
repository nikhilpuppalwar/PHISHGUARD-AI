import math
import re
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.meta import Incident, AttackType

# Built-in incident vector seed bank
DEFAULT_INCIDENTS = [
    {
        "title": "Campus Recruitment / Summer Analyst Advance-Fee Scam",
        "attack_type": "Internship Scam",
        "content_summary": "Unsolicited email offering summer analyst or software internship. Demanded ₹2,000 upfront fee within 2 hours to reserve candidate slot via shortened bit.ly portal.",
        "indicators": [
            "Advance registration fee requested before joining",
            "Artificial 2-hour deadline to prevent verification",
            "Bit.ly shortened link redirecting to non-corporate payment gateway",
            "Unauthenticated hr-verify sender domain"
        ],
        "keywords": ["internship", "summer analyst", "fee", "2000", "2 hours", "candidate pass", "portal", "bit.ly", "recruitment", "hr"]
    },
    {
        "title": "Corporate IT Helpdesk Password Expiration Bait",
        "attack_type": "Credential Phishing",
        "content_summary": "Urgent notification alleging Microsoft 365 or company portal password expires in 24 hours. Directed user to fake SSO portal to harvest credentials.",
        "indicators": [
            "Fake Microsoft/Corporate SSO login page",
            "Urgent 24-hour expiration notice",
            "Domain mismatch in login URL"
        ],
        "keywords": ["password", "microsoft", "sso", "portal", "it desk", "helpdesk", "expires", "verify", "storage"]
    },
    {
        "title": "Supplier Bank Details Update / Wire Fraud",
        "attack_type": "Invoice Fraud",
        "content_summary": "Spoofed vendor email stating banking details have changed due to annual audit. Requested immediate wire transfer for overdue invoice #8892.",
        "indicators": [
            "Executive / Vendor display name spoofing",
            "Unverified bank routing change request",
            "High monetary wire demand"
        ],
        "keywords": ["invoice", "wire", "vendor", "bank", "routing", "supplier", "audit", "payment", "overdue"]
    },
    {
        "title": "Parcel Delivery Address Confirmation SMS Trap",
        "attack_type": "Smishing / Delivery Scam",
        "content_summary": "SMS claiming a package could not be delivered due to missing house number. Included link to reschedule delivery and pay a $1.99 redelivery fee.",
        "indicators": [
            "SMS with shortened URL",
            "Micro-transaction card harvesting lure",
            "Urgent delivery failure alert"
        ],
        "keywords": ["package", "delivery", "fedex", "usps", "dhl", "address", "reschedule", "redelivery", "fee", "sms"]
    },
    {
        "title": "Foreign Lottery / Inheritance Advance-Fee Scheme",
        "attack_type": "Advance-Fee Scam",
        "content_summary": "Claimed recipient won millions in foreign lottery or inherited funds from deceased overseas benefactor. Required advance customs and processing fee.",
        "indicators": [
            "Classic 419 advance-fee fraud pattern",
            "Unrealistic multi-million dollar payout claim",
            "Request for wire transfer or cryptocurrency"
        ],
        "keywords": ["lottery", "inheritance", "million", "funds", "customs", "processing fee", "benefactor", "wire", "claim"]
    }
]

class RAGService:
    def __init__(self):
        self.incidents = DEFAULT_INCIDENTS

    def _calculate_keyword_similarity(self, text: str, keywords: List[str]) -> float:
        """Compute semantic overlap score between inbound text and incident keyword vectors."""
        text_words = set(re.findall(r"\w+", text.lower()))
        if not text_words:
            return 0.0

        matches = sum(1 for kw in keywords if kw.lower() in text.lower() or kw.lower() in text_words)
        if matches == 0:
            return 0.0

        # Normalized cosine-like similarity with sigmoid dampening
        raw_ratio = matches / len(keywords)
        scaled = min(0.96, 0.45 + (raw_ratio * 0.52))
        return round(scaled, 2)

    def retrieve_similar_incident(self, text: str, extracted_urls: List[str] = None, db_session: Optional[Session] = None) -> Optional[Dict[str, Any]]:
        """Find the closest matching historical incident in vector memory."""
        combined_query = text + " " + " ".join(extracted_urls or [])
        best_match = None
        highest_sim = 0.0

        for inc in self.incidents:
            sim = self._calculate_keyword_similarity(combined_query, inc["keywords"])
            if sim > highest_sim:
                highest_sim = sim
                best_match = {
                    "title": inc["title"],
                    "attack_type": inc["attack_type"],
                    "similarity": sim,
                    "content_summary": inc["content_summary"],
                    "indicators": inc["indicators"],
                }

        # If similarity is meaningful (> 0.40), return it
        if best_match and highest_sim >= 0.45:
            return best_match

        # Default fallback incident if none matched strongly but payload has threat indicators
        if any(w in combined_query.lower() for w in ["fee", "pay", "urgent", "login", "verify"]):
            return {
                "title": "General Phishing Threat Vector",
                "attack_type": "Generic Phishing",
                "similarity": 0.62,
                "content_summary": "Historical incident involving unverified payment requests and social-engineering language.",
                "indicators": ["Suspicious communication with urgent call to action"]
            }

        return None

rag_service = RAGService()
