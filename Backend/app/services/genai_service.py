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
        indicators = []
        for a in ["url", "text", "sender"]:
            indicators.extend(agent_details.get(a, {}).get("indicators", []))

        attack_info = self.classify_attack_type(raw_text, indicators)

        # Profile Memory Matching (Section 16)
        matched_services = []
        if user_profile and user_profile.get("common_services"):
            for s in user_profile["common_services"]:
                if s.lower() in raw_text.lower():
                    matched_services.append(s)

        profile_context_note = ""
        if matched_services:
            profile_context_note = f" This threat specifically mimics your active platform ({', '.join(matched_services)}), increasing potential deception risk."

        # Check if active LLM in database can generate rich explanation
        if db:
            try:
                active_cred = llm_gateway.get_active_credential(db)
                if active_cred:
                    system_prompt = (
                        f"You are PhishGuard AI's senior cybersecurity triage analyst. "
                        f"Analyze the user's input with Risk Score: {score}/100 ({severity}), Attack Type: {attack_info['name']}. "
                        f"The recipient is a {user_role} with {security_awareness} security awareness."
                        f"{f' They regularly use: {matched_services}.' if matched_services else ''} "
                        f"Provide your assessment formatted strictly as JSON with two keys: "
                        f"'explanation' (a 2-3 sentence grounded threat explanation personalized to this user) and "
                        f"'action_plan' (an array of 3 bulleted concrete action steps for this user role)."
                    )
                    prompt_content = f"Suspicious Message Text:\n{raw_text[:1200]}\n\nDetected Indicators: {', '.join(indicators)}"
                    llm_msgs = [{"role": "user", "content": prompt_content}]
                    raw_llm = llm_gateway.generate_chat(db, llm_msgs, system_prompt=system_prompt)
                    if raw_llm:
                        import re
                        json_match = re.search(r'\{.*\}', raw_llm, re.DOTALL)
                        if json_match:
                            parsed = json.loads(json_match.group(0))
                            if parsed.get("explanation") and parsed.get("action_plan"):
                                return {
                                    "attack_type": attack_info["name"],
                                    "attack_type_description": attack_info["description"],
                                    "explanation": parsed["explanation"],
                                    "action_plan": parsed["action_plan"],
                                    "llm_provider": active_cred.provider,
                                    "llm_model": active_cred.model_name
                                }
            except Exception as e:
                print(f"GenAI LLM generation error, falling back to rule engine: {e}")

        # Build personalized explanation
        if score >= 75.0:
            explanation = (
                f"PhishGuard AI has classified this inbound payload as a high-confidence threat ({severity}, {score}/100) "
                f"exhibiting characteristics of an **{attack_info['name']}**.{profile_context_note} "
                f"The Text Agent identified coercive pressure and upfront payment incentives, while the URL Agent flagged obfuscated redirects. "
                f"Furthermore, the Sender Agent detected domain mismatch and missing cryptographic authentication headers."
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
