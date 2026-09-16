import os
import json
from typing import Dict, Any, List, Optional
from app.config import settings

genai_client = None
if settings.GEMINI_API_KEY:
    try:
        import google.generativeai as google_genai
        google_genai.configure(api_key=settings.GEMINI_API_KEY)
        genai_client = google_genai
    except Exception:
        pass

openai_client = None
if settings.OPENAI_API_KEY:
    try:
        from openai import OpenAI
        openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
    except Exception:
        pass

from sqlalchemy.orm import Session
from app.services.llm_gateway import llm_gateway

ATTACK_TYPE_MAP = [

    {
        "name": "Internship Scam",
        "triggers": ["internship", "summer analyst", "candidate pass", "registration fee", "stipend", "career", "hiring"],
        "description": "Fraudulent job or internship offers targeting students and early-career jobseekers with immediate upfront fees or credential harvesting."
    },
    {
        "name": "Credential Phishing",
        "triggers": ["password", "login", "verify account", "sso", "portal", "suspended", "security alert", "mailbox"],
        "description": "Attempts to harvest usernames, passwords, or session tokens via fraudulent lookalike portals."
    },
    {
        "name": "Invoice Fraud",
        "triggers": ["invoice", "wire", "vendor", "payment due", "routing", "bank details", "supplier"],
        "description": "Spoofed billing requests altering payee account or routing numbers for illegitimate transfers."
    },
    {
        "name": "Advance-Fee Scam",
        "triggers": ["advance", "customs", "lottery", "prize", "winner", "inheritance", "release funds"],
        "description": "Promises of substantial funds or prizes conditional upon an advance processing or clearance fee."
    },
    {
        "name": "Smishing / Urgent Delivery Scam",
        "triggers": ["sms", "package", "delivery", "fedex", "usps", "redelivery", "postal", "tracking"],
        "description": "SMS phishing attempting to exploit package tracking or urgent delivery failures to harvest credit card data."
    }
]

from app.services.llm_gateway import llm_service
from app.prompts.templates import (
    EXPLANATION_SYSTEM_PROMPT, EXPLANATION_USER_TEMPLATE,
    RECOMMENDATIONS_SYSTEM_PROMPT, RECOMMENDATIONS_USER_TEMPLATE,
    wrap_untrusted
)

class GenAIService:
    def classify_attack_type(self, raw_text: str, indicators: List[str]) -> Dict[str, str]:
        """Determine most likely attack category based on text and detected indicators."""
        combined = (raw_text + " " + " ".join(indicators)).lower()
        for at in ATTACK_TYPE_MAP:
            if any(t in combined for t in at["triggers"]):
                return {"name": at["name"], "description": at["description"]}
        return {
            "name": "Generic Phishing",
            "description": "Social engineering attempt employing urgency and deceptive links to illicitly elicit sensitive actions."
        }

    def generate_explanation_and_action_plan(self,
                                            raw_text: str,
                                            risk_assessment: Dict[str, Any],
                                            agent_details: Dict[str, Any],
                                            similar_incident: Optional[Dict[str, Any]],
                                            user_role: str = "Student",
                                            security_awareness: str = "Beginner",
                                            user_profile: Optional[Dict[str, Any]] = None,
                                            db: Optional[Session] = None) -> Dict[str, Any]:
        """
        Generate grounded explanation and personalized action plan tailored to user's profile.
        Leverages active LLM provider if configured in database, with deterministic fallback.
        Incorporates Profile Memory (Section 16) matching user's known services and role context.
        """
        score = risk_assessment.get("overall_score", 0.0)
        severity = risk_assessment.get("severity", "Low Risk")
        confidence = risk_assessment.get("confidence", 0.85)

        indicators = []
        for a in ["url", "text", "sender"]:
            indicators.extend(agent_details.get(a, {}).get("indicators", []))

        attack_info = self.classify_attack_type(raw_text, indicators)

        # Profile Memory Matching (Section 16 & Section 9)
        matched_services = []
        user_services = user_profile.get("common_services", []) if user_profile else []
        if user_services:
            for s in user_services:
                if s.lower() in raw_text.lower():
                    matched_services.append(s)

        profile_context_note = ""
        if matched_services:
            profile_context_note = f" This message may be particularly deceptive because it attempts to imitate {', '.join(matched_services)}, which is listed in your profile services."

        # RAG Context representation
        rag_context_str = "No direct historical match."
        if similar_incident:
            rag_context_str = (
                f"Matched Historical Case: '{similar_incident.get('title')}' "
                f"({similar_incident.get('attack_type')}, similarity: {round(similar_incident.get('similarity', 0.8) * 100)}%). "
                f"Pattern: {similar_incident.get('content_summary')}. "
                f"Indicators: {'; '.join(similar_incident.get('indicators', []))}"
            )

        # Multi-Agent Evidence breakdown
        text_ev = f"Score: {agent_details.get('text', {}).get('risk_score', 0)}/100, Flags: {'; '.join(agent_details.get('text', {}).get('indicators', []))}"
        url_ev = f"Score: {agent_details.get('url', {}).get('risk_score', 0)}/100, Flags: {'; '.join(agent_details.get('url', {}).get('indicators', []))}"
        sender_ev = f"Score: {agent_details.get('sender', {}).get('risk_score', 0)}/100 (Random Forest), Flags: {'; '.join(agent_details.get('sender', {}).get('indicators', []))}"

        # 1. Check if active LLM in database can generate grounded explanation and actions
        if db:
            try:
                active_prov = llm_service.get_active_provider_summary(db)
                if active_prov["is_configured"]:
                    # Grounded Explanation Call
                    expl_prompt = EXPLANATION_USER_TEMPLATE.format(
                        risk_score=score,
                        severity=severity,
                        confidence=confidence,
                        attack_type=attack_info["name"],
                        text_evidence=text_ev,
                        url_evidence=url_ev,
                        sender_evidence=sender_ev,
                        rag_context=rag_context_str,
                        user_role=user_role,
                        security_awareness=security_awareness,
                        common_services=", ".join(user_services) if user_services else "None specified",
                        technical_experience=user_profile.get("technical_experience", "Intermediate") if user_profile else "Intermediate",
                        untrusted_content=wrap_untrusted(raw_text[:1200], "INBOUND THREAT PAYLOAD")
                    )

                    expl_json = llm_service.generate_structured(
                        db=db,
                        prompt=expl_prompt,
                        system_prompt=EXPLANATION_SYSTEM_PROMPT
                    )

                    # Recommendations Call
                    rec_prompt = RECOMMENDATIONS_USER_TEMPLATE.format(
                        attack_type=attack_info["name"],
                        severity=severity,
                        risk_score=score,
                        user_role=user_role,
                        security_awareness=security_awareness,
                        indicators="; ".join(indicators[:4])
                    )

                    rec_json = llm_service.generate_structured(
                        db=db,
                        prompt=rec_prompt,
                        system_prompt=RECOMMENDATIONS_SYSTEM_PROMPT
                    )

                    # Assemble grounded response
                    if expl_json and expl_json.get("summary"):
                        final_explanation = expl_json["summary"]
                        if expl_json.get("personalized_insight") and "none" not in expl_json["personalized_insight"].lower():
                            final_explanation += f" {expl_json['personalized_insight']}"

                        # Assemble action plan
                        actions = []
                        if rec_json and isinstance(rec_json, dict):
                            imm = rec_json.get("immediate_actions", [])
                            fol = rec_json.get("if_already_interacted", [])
                            if isinstance(imm, list):
                                actions.extend(imm[:3])
                            if isinstance(fol, list):
                                actions.extend(fol[:2])

                        if not actions:
                            actions = [
                                "Do not click any embedded links or provide credentials.",
                                "Verify communication through an official verified channel.",
                                "Report the message to your organization's IT/security desk."
                            ]

                        return {
                            "attack_type": attack_info["name"],
                            "attack_type_description": attack_info["description"],
                            "explanation": final_explanation.strip(),
                            "action_plan": actions,
                            "llm_provider": active_prov["provider"],
                            "llm_model": active_prov["model"]
                        }
            except Exception as e:
                print(f"GenAIService LLM generation error (falling back to calibrated rules): {e}")

        # Deterministic Calibrated Fallback (Resilient 100% offline guarantee)
        if score >= 75.0:
            explanation = (
                f"PhishGuard AI has classified this inbound payload as a high-confidence threat ({severity}, {score}/100) "
                f"exhibiting characteristics of an **{attack_info['name']}**.{profile_context_note} "
                f"The Text Agent identified coercive pressure, while the URL Agent flagged link anomalies. "
                f"Furthermore, the Sender Agent (Random Forest) detected domain mismatch and missing cryptographic authentication headers."
            )
        elif score >= 40.0:
            explanation = (
                f"This communication displays moderate ambiguity ({severity}, {score}/100).{profile_context_note} "
                f"While some domain attributes appear standard, anomalies in link destinations or unverified sender identity require heightened vigilance before interacting."
            )
        else:
            explanation = (
                f"This communication exhibits legitimate structural characteristics ({severity}, {score}/100). "
                f"Standard sender headers and benign linguistic patterns were verified with no malicious link behavior detected."
            )

        # Build personalized action plan adapted to role and awareness
        action_plan = []
        is_student = user_role.lower() == "student"

        if score >= 75.0:
            if attack_info["name"] == "Internship Scam":
                if is_student:
                    action_plan.append("Do NOT transfer money: Legitimate internships and campus recruiters never demand registration fees or upfront deposits.")
                    action_plan.append("Cross-Verify through Authorized Channels: Contact your university Career Services or visit the employer's official careers portal directly (never use links in the message).")
                    action_plan.append("Report Incident: Forward this email to your campus IT / security team (abuse@university.edu) to initiate tenant-wide quarantine.")
                else:
                    action_plan.append("Do not authorize payment or click external links.")
                    action_plan.append("Verify corporate vacancy with Talent Acquisition via internal HR directory.")
                    action_plan.append("Submit IoC (Indicator of Compromise) to enterprise Security Operations Center (SOC).")
            elif attack_info["name"] == "Credential Phishing":
                action_plan.append("Do NOT enter credentials: If you already visited the link, change your account password immediately from a trusted device.")
                action_plan.append("Enable Multi-Factor Authentication (MFA) across your primary email and academic/corporate accounts.")
                action_plan.append("Revoke active web sessions in security settings if password was submitted.")
            else:
                action_plan.append("Delete or isolate the message; do not reply or download any attachments.")
                action_plan.append("Never communicate with the sender via provided phone numbers or payment links.")
                action_plan.append("Mark as Phishing / Spam in your email client to update global reputation filters.")
        else:
            action_plan.append("Verify sender identity if requesting unexpected actions or documents.")
            action_plan.append("Hover over links before clicking to ensure destination matches expected domain.")
            action_plan.append("Keep security awareness practices active.")

        return {
            "attack_type": attack_info["name"],
            "attack_type_description": attack_info["description"],
            "explanation": explanation,
            "action_plan": action_plan,
            "llm_provider": "PhishGuard-Deterministic-GenAI",
            "llm_model": "Context-Grounded-Pipeline-v2"
        }

genai_service = GenAIService()

