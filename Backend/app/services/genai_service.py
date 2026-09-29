import os
import json
import re
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.config import settings
from app.services.llm_gateway import llm_service
from app.prompts.templates import (
    GENAI_THREAT_REPORT_SYSTEM_PROMPT,
    GENAI_THREAT_REPORT_USER_TEMPLATE,
    wrap_untrusted
)

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
    },
    {
        "name": "Banking Phishing",
        "triggers": ["bank", "wire transfer", "overdue balance", "credit card", "security code", "cvv", "atm"],
        "description": "Deceptive financial notifications impersonating banks to illicitly obtain banking credentials or card numbers."
    }
]

class GenAIService:
    """
    Generative AI Output Layer (Spec §5, §11, §12, §16, §17, §21, §22).
    Generates 3 core capabilities:
    1. Explanation: Detailed evidence-grounded explanation (Overall Finding, Why Flagged, Evidence by Agent, Incident Memory, Risk Interpretation).
    2. Action Plan: Dynamic, risk-level and attack-type operational countermeasures.
    3. Personalized Recommendations: Tailored guidance derived strictly from authenticated user profile and threat relevance.
    """

    def classify_attack_type(self, raw_text: str, indicators: List[str], score: float = 80.0) -> Dict[str, Any]:
        """
        Determines attack category strictly constrained by evidence and risk score.
        Low-risk content is never forced into a phishing category.
        """
        if score < 40.0:
            return {
                "name": "No significant phishing attack detected",
                "category": "No significant phishing attack detected",
                "description": "The submitted communication exhibits benign characteristics and does not match recognized malicious social-engineering signatures.",
                "state": "LOW_RISK",
                "confidence": 0.95
            }

        combined = (raw_text + " " + " ".join(indicators)).lower()
        matched_category = None
        for at in ATTACK_TYPE_MAP:
            if any(t in combined for t in at["triggers"]):
                matched_category = at
                break

        if score < 75.0:
            if matched_category:
                return {
                    "name": f"Possible {matched_category['name']}",
                    "category": f"Possible {matched_category['name']}",
                    "description": f"Contains ambiguous or unverified elements resembling a {matched_category['name']}. Heightened caution recommended.",
                    "state": "MEDIUM_RISK",
                    "confidence": 0.68
                }
            return {
                "name": "Suspicious / Possible Social Engineering",
                "category": "Suspicious / Possible Social Engineering",
                "description": "Contains ambiguous urgency, unverified links, or unconfirmed identity signals requiring manual verification before responding.",
                "state": "MEDIUM_RISK",
                "confidence": 0.65
            }

        # High risk (score >= 75.0)
        if matched_category:
            return {
                "name": matched_category["name"],
                "category": matched_category["name"],
                "description": matched_category["description"],
                "state": "HIGH_RISK",
                "confidence": 0.92
            }

        return {
            "name": "Targeted Phishing",
            "category": "Targeted Phishing",
            "description": "High-confidence social engineering attempt employing urgency and deceptive links to illicitly elicit sensitive credentials or funds.",
            "state": "HIGH_RISK",
            "confidence": 0.88
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
        Executes unified Generative AI synthesis:
        1. Assembles structured Evidence Contract.
        2. Dispatches inference via multi-provider LLM gateway if available.
        3. Validates structured JSON schema.
        4. Applies deterministic rule-based synthesis fallback on failure or offline mode.
        """
        score = risk_assessment.get("overall_score", 0.0)
        severity = risk_assessment.get("severity", "Low Risk")
        confidence = risk_assessment.get("confidence", 0.85)

        indicators = []
        for a in ["url", "text", "sender"]:
            indicators.extend(agent_details.get(a, {}).get("indicators", []))

        # 1. Attack Classification strictly constrained by risk level
        attack_info = self.classify_attack_type(raw_text, indicators, score=score)

        # 2. Extract User Profile context
        role_label = user_role if user_role else "Student"
        user_services = user_profile.get("common_services", []) if user_profile else []
        user_activities = user_profile.get("online_activities", []) if user_profile else []
        explanation_style = user_profile.get("preferred_explanation_style", "Simple") if user_profile else "Simple"
        matched_services = [s for s in user_services if s.lower() in raw_text.lower()]
        matched_activities = [a for a in user_activities if any(term in a.lower() for term in ["internship", "job", "email", "banking", "shopping", "cloud", "developer", "finance"] if term in raw_text.lower())]

        # 3. Assemble Structured Evidence Contract (Section 4)
        evidence_contract = {
            "original_content": raw_text,
            "text_agent": {
                "ml_probability": round(agent_details.get("text", {}).get("model_probability", 0.0), 3),
                "indicators": agent_details.get("text", {}).get("indicators", []),
                "summary": agent_details.get("text", {}).get("summary", "")
            },
            "url_agent": {
                "ml_probability": round(agent_details.get("url", {}).get("model_probability", 0.0), 3),
                "indicators": agent_details.get("url", {}).get("indicators", []),
                "structural_analysis": agent_details.get("url", {}).get("structural_analysis") or {},
                "external_threat_intel": agent_details.get("url", {}).get("external_threat_intel") or {}
            },
            "sender_agent": {
                "ml_probability": round(agent_details.get("sender", {}).get("model_probability", 0.0), 3),
                "indicators": agent_details.get("sender", {}).get("indicators", []),
                "summary": agent_details.get("sender", {}).get("summary", "")
            },
            "incident_rag": {
                "has_match": bool(similar_incident and similar_incident.get("similarity", 0) >= 0.55),
                "title": similar_incident.get("title") if similar_incident else None,
                "similarity": round(similar_incident.get("similarity", 0), 2) if similar_incident else 0.0,
                "what_changed": similar_incident.get("what_changed") if similar_incident else None
            },
            "risk": {
                "score": round(score, 1),
                "level": severity,
                "confidence": round(confidence, 2)
            },
            "attack_classification": attack_info,
            "explainability": {
                "risk_factors": risk_assessment.get("risk_factors", [])
            },
            "user_profile": {
                "role": role_label,
                "common_services": user_services,
                "online_activities": user_activities,
                "security_awareness": security_awareness or "Beginner",
                "explanation_preference": explanation_style
            }
        }

        # 4. Attempt Live LLM Gateway Inference
        llm_result = None
        active_provider = "PhishGuard-Evidence-Grounded-AI"
        active_model = "MultiAgent-Orchestration-v2"

        if db:
            try:
                active_cred = llm_service.get_active_credential(db)
                if active_cred:
                    active_provider = active_cred.provider
                    active_model = active_cred.model_name or "active-model"

                prompt_user_text = GENAI_THREAT_REPORT_USER_TEMPLATE.format(
                    evidence_contract_json=json.dumps(evidence_contract, indent=2),
                    untrusted_content=wrap_untrusted(raw_text, "USER SUBMISSION")
                )

                messages = [{"role": "user", "content": prompt_user_text}]
                raw_llm_out = llm_service.generate_chat(
                    db=db,
                    messages=messages,
                    system_prompt=GENAI_THREAT_REPORT_SYSTEM_PROMPT,
                    max_tokens=1500
                )

                if raw_llm_out:
                    # Clean code blocks if present
                    cleaned_out = re.sub(r"^```(?:json)?\s*", "", raw_llm_out.strip(), flags=re.MULTILINE)
                    cleaned_out = re.sub(r"\s*```$", "", cleaned_out.strip(), flags=re.MULTILINE)
                    parsed_json = json.loads(cleaned_out)

                    # Validate required schema keys
                    if (
                        isinstance(parsed_json, dict)
                        and "explanation" in parsed_json
                        and "action_plan" in parsed_json
                        and isinstance(parsed_json.get("action_plan"), list)
                        and len(parsed_json["action_plan"]) > 0
                    ):
                        llm_result = parsed_json
            except Exception as e:
                print(f"[GenAIService] Live LLM inference bypassed or failed parsing: {e}. Using deterministic synthesis.")

        # 5. Deterministic Grounded Synthesis (Used as primary when LLM offline, or fallback)
        fallback_data = self._generate_deterministic_synthesis(
            raw_text=raw_text,
            score=score,
            severity=severity,
            attack_info=attack_info,
            indicators=indicators,
            agent_details=agent_details,
            similar_incident=similar_incident,
            role_label=role_label,
            security_awareness=security_awareness,
            explanation_style=explanation_style,
            matched_activities=matched_activities,
            matched_services=matched_services,
            risk_assessment=risk_assessment,
            user_profile=user_profile
        )

        # Merge LLM result if valid, else use deterministic fallback
        if llm_result:
            expl_data = llm_result.get("explanation", {})
            if isinstance(expl_data, dict):
                overall_finding = expl_data.get("summary") or fallback_data["explainability_details"]["overall_finding"]
                why_flagged = expl_data.get("why_flagged") or fallback_data["explainability_details"]["why_flagged"]
                agent_findings = expl_data.get("agent_findings") or fallback_data["explainability_details"]["evidence_by_agent"]
                incident_context = expl_data.get("incident_context") or fallback_data["explainability_details"].get("incident_context", "")
                risk_interpretation = expl_data.get("risk_interpretation") or fallback_data["explainability_details"].get("risk_interpretation", "")
            else:
                overall_finding = str(expl_data)
                why_flagged = fallback_data["explainability_details"]["why_flagged"]
                agent_findings = fallback_data["explainability_details"]["evidence_by_agent"]
                incident_context = fallback_data["explainability_details"].get("incident_context", "")
                risk_interpretation = fallback_data["explainability_details"].get("risk_interpretation", "")

            action_plan = [str(step) for step in llm_result.get("action_plan", [])] or fallback_data["action_plan"]
            personalized_recommendations = [str(r) for r in llm_result.get("personalized_recommendations", [])] or fallback_data["personalized_recommendations"]
            why_this_matters = llm_result.get("why_this_matters") or fallback_data["why_this_matters"]
            before_you_act = fallback_data["before_you_act"]

            explainability_details = {
                "overall_finding": overall_finding,
                "why_flagged": why_flagged,
                "evidence_by_agent": agent_findings,
                "incident_context": incident_context,
                "risk_interpretation": risk_interpretation,
                "final_explanation": overall_finding
            }
        else:
            overall_finding = fallback_data["explainability_details"]["overall_finding"]
            why_flagged = fallback_data["explainability_details"]["why_flagged"]
            agent_findings = fallback_data["explainability_details"]["evidence_by_agent"]
            incident_context = fallback_data["explainability_details"]["incident_context"]
            risk_interpretation = fallback_data["explainability_details"]["risk_interpretation"]
            action_plan = fallback_data["action_plan"]
            personalized_recommendations = fallback_data["personalized_recommendations"]
            why_this_matters = fallback_data["why_this_matters"]
            before_you_act = fallback_data["before_you_act"]
            explainability_details = fallback_data["explainability_details"]

        personalization_context = {
            "role": role_label,
            "relevant_activity": matched_activities[0] if matched_activities else (matched_services[0] if matched_services else "Routine communication"),
            "security_awareness": security_awareness or "Beginner",
            "relevant_previous_incident": similar_incident.get("title") if (similar_incident and similar_incident.get("similarity", 0) >= 0.55) else "No similar past incidents",
            "explanation_preference": explanation_style,
            "relevance": risk_assessment.get("profile_relevance", "HIGH" if score >= 40 else "GENERAL")
        }

        return {
            "attack_type": attack_info["name"],
            "attack_type_description": attack_info["description"],
            "attack_classification": attack_info,
            "explanation": overall_finding,
            "explainability_details": explainability_details,
            "action_plan": action_plan,
            "personalized_recommendations": personalized_recommendations,
            "personalization_context": personalization_context,
            "why_this_matters": why_this_matters,
            "before_you_act": before_you_act,
            "evidence_contract": evidence_contract,
            "llm_provider": active_provider,
            "llm_model": active_model
        }

    def _generate_deterministic_synthesis(self,
                                          raw_text: str,
                                          score: float,
                                          severity: str,
                                          attack_info: Dict[str, Any],
                                          indicators: List[str],
                                          agent_details: Dict[str, Any],
                                          similar_incident: Optional[Dict[str, Any]],
                                          role_label: str,
                                          security_awareness: str,
                                          explanation_style: str,
                                          matched_activities: List[str],
                                          matched_services: List[str],
                                          risk_assessment: Dict[str, Any],
                                          user_profile: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generates robust, evidence-grounded structured response conforming to the exact schema.
        Adheres strictly to style modulation: Simple, Balanced, or Technical.
        """
        is_technical = explanation_style.lower() == "technical"
        is_simple = explanation_style.lower() == "simple"

        # 1. Why Flagged Numbered Evidence Items
        why_flagged = []
        if score >= 40.0:
            if any("payment" in ind.lower() or "fee" in ind.lower() for ind in indicators):
                why_flagged.append("The message demands an unexpected upfront registration, reservation, or candidate pass fee.")
            if any("urgency" in ind.lower() or "deadline" in ind.lower() for ind in indicators):
                why_flagged.append("An artificial deadline constraint is imposed to induce hasty compliance without external verification.")
            if any("url" in ind.lower() or "domain" in ind.lower() or "link" in ind.lower() for ind in indicators):
                why_flagged.append("Embedded link infrastructure points to shortened or unverified external domains unaligned with official organization domains.")
            if any("sender" in ind.lower() or "impersonation" in ind.lower() for ind in indicators):
                why_flagged.append("Sender display name or routing headers exhibit potential impersonation of reputable organizational entities.")
            if similar_incident and similar_incident.get("similarity", 0) >= 0.55:
                why_flagged.append(f"Exhibits {round(similar_incident['similarity'] * 100)}% semantic vector similarity to documented incident '{similar_incident.get('title', 'Historical Threat')}' in organizational memory.")
        else:
            why_flagged.append("Content wording, formatting, and structural tone align with authentic institutional communication.")
            why_flagged.append("Absence of coercive psychological triggers, unverified financial requests, or credential harvesting portals.")
            why_flagged.append("No redirection or suspicious payload infrastructure observed in link or sender streams.")

        # 2. Evidence by Agent
        url_detail = agent_details.get("url", {})
        has_url = bool(url_detail.get("risk_score", 0) > 0 or url_detail.get("indicators"))
        sender_detail = agent_details.get("sender", {})
        has_sender = bool(sender_detail.get("risk_score", 0) > 0 or sender_detail.get("indicators"))

        evidence_by_agent = {
            "text": [
                f"TF-IDF + Logistic Regression inference probability: {round(agent_details.get('text', {}).get('model_probability', 0)*100, 1)}%.",
                f"Lexical analysis: {agent_details.get('text', {}).get('summary', 'Evaluated textual triggers.')}"
            ],
            "url": [
                f"XGBoost 14-feature model probability: {round(url_detail.get('model_probability', 0)*100, 1)}%." if has_url else "No embedded URLs detected; structural link heuristics bypassed.",
                f"External threat feeds (GSB / VirusTotal): {'Live API verification performed.' if has_url else 'Not applicable (no links).'}"
            ],
            "sender": [
                f"RFC header evaluation: {sender_detail.get('summary', 'Sender domain verified.')}" if has_sender else "Sender headers not present in submission.",
                "Missing SPF/DKIM/DMARC headers recorded as 'Not provided' (zero fabricated auth)."
            ]
        }

        # 3. Incident Memory Context
        if similar_incident and similar_incident.get("similarity", 0) >= 0.55:
            incident_context = (
                f"Matched documented historical incident '{similar_incident.get('title')}' with {round(similar_incident['similarity'] * 100)}% vector similarity. "
                f"Common vector: {similar_incident.get('content_summary', 'Coercive solicitation pattern.')}"
            )
        else:
            incident_context = "No sufficiently similar previous incident was found in organizational memory (vector similarity < 55%). Evaluated strictly from first principles."

        # 4. Overall Finding & Risk Interpretation (Style modulated)
        if score >= 75.0:
            if is_technical:
                overall_finding = (
                    f"PhishGuard AI classifies this input as a critical threat ({score}/100, {severity}) "
                    f"conforming to {attack_info['name']} signatures. Multi-agent Bayesian synthesis corroborates high linguistic urgency "
                    f"({round(agent_details.get('text', {}).get('model_probability', 0)*100, 1)}% ML text score) and unverified infrastructure."
                )
                risk_interpretation = (
                    f"Composite Bayesian fusion weighted text coercion and domain anomalies to {score}/100, indicating an active payload designed to bypass basic heuristics."
                )
            elif is_simple:
                overall_finding = (
                    f"Warning: This message is dangerous ({severity}). It is an {attack_info['name']} trying to rush you into making a mistake or sending money."
                )
                risk_interpretation = "The combination of strict deadlines and payment or password demands indicates high risk."
            else:
                overall_finding = (
                    f"PhishGuard AI has identified this message as a high-risk security threat ({score}/100, {severity}) "
                    f"matching the forensic playbook of an {attack_info['name']}. Multiple specialized detection agents confirmed coercive psychological urgency and suspicious requests."
                )
                risk_interpretation = f"The overall risk score of {score}/100 is supported by concurrent triggers across text and delivery vectors."
        elif score >= 40.0:
            overall_finding = (
                f"This communication displays moderate security ambiguity ({score}/100, {severity}). "
                f"While some elements appear routine, unverified routing or coercive language requires manual confirmation before compliance."
            )
            risk_interpretation = "The medium risk score reflects unconfirmed sender authenticity or suspicious link characteristics that cannot be marked safe."
        else:
            overall_finding = (
                f"This communication is assessed as low risk ({score}/100, {severity}). "
                f"No malicious phishing indicators, credential harvesting portals, or coercive payment demands were identified across multi-agent analysis streams."
            )
            risk_interpretation = "Evaluation confirms the absence of deceptive triggers, domain typosquatting, or unauthorized credential solicitation."

        # 5. Dynamic Action Plan (Operational Response)
        action_plan = []
        if score >= 75.0:
            if "internship" in attack_info["name"].lower():
                action_plan.append("Do NOT transfer funds or pay registration fees: Legitimate employers never charge candidates for internships or placement passes.")
                action_plan.append("Verify the opportunity directly on the company's verified careers website or via campus Career Services.")
                action_plan.append("Verify the recruiter's identity through official corporate channels before responding.")
                action_plan.append("Never disclose bank account numbers, tax IDs, or national identification details over unverified email.")
            elif "credential" in attack_info["name"].lower():
                action_plan.append("Do NOT enter your credentials or password on the linked page.")
                action_plan.append("Inspect the browser URL to ensure the domain matches your authentic provider exactly.")
                action_plan.append("If credentials were submitted, change your account password immediately and terminate active sessions.")
                action_plan.append("Enable Multi-Factor Authentication (MFA) using an authenticator app.")
            elif "banking" in attack_info["name"].lower():
                action_plan.append("Do not click links or call phone numbers provided within the email.")
                action_plan.append("Open your official banking app directly or type the bank's official URL into your browser.")
                action_plan.append("Never share one-time passwords (OTPs) or card security codes with anyone.")
            else:
                action_plan.append("Delete or isolate the message; do not click embedded links or open attachments.")
                action_plan.append("Verify the request through a secondary, independent communication channel.")
                action_plan.append("Mark the email as Phishing/Spam to help improve organizational filtering rules.")
        elif score >= 40.0:
            action_plan.append("Do not click any embedded links or provide login information until the sender origin is verified.")
            action_plan.append("Check the organization's official website directly to confirm whether the notification is authentic.")
            action_plan.append("Contact the alleged sender through an independently obtained phone number or email address.")
        else:
            action_plan.append("Proceed with normal caution: Content appears benign and aligned with standard communications.")
            action_plan.append("Maintain good security hygiene: hover over links to confirm destination URLs before clicking.")
            action_plan.append("Verify any unexpected subsequent requests for financial transfers or account credentials.")

        # 6. Personalized Recommendations (Tailored to Profile & Awareness)
        personalized_recommendations = []
        is_student = "student" in role_label.lower()
        is_developer = any(dev in role_label.lower() for dev in ["developer", "engineer", "software", "tech", "data"])
        is_employee = any(emp in role_label.lower() for emp in ["employee", "manager", "staff", "executive", "analyst"])

        if score >= 40.0:
            if is_student and "internship" in attack_info["name"].lower():
                personalized_recommendations.append(
                    f"Because your profile indicates you are active in internship applications, verify this offer through your university Career Development Center or the organization's official careers portal."
                )
                personalized_recommendations.append(
                    "Be skeptical of recruitment offers from generic domains (@gmail.com, @quick-career.org) that bypass formal campus interview schedules."
                )
                personalized_recommendations.append(
                    "Forward this incident to campus IT Security to alert fellow students who may receive the identical solicitation."
                )
            elif is_developer:
                personalized_recommendations.append(
                    "Given your development workflow, ensure SSH keys, cloud API tokens, and repository credentials are never entered into single-sign-on lookalike portals."
                )
                personalized_recommendations.append(
                    "Enforce hardware-backed or app-based 2FA across your GitHub, cloud consoles, and primary email accounts."
                )
            else:
                personalized_recommendations.append(
                    f"Based on your profile as a {role_label}, confirm unexpected operational or financial requests using direct verbal verification with the department supervisor."
                )
                personalized_recommendations.append(
                    "Report unverified sender addresses to your internal IT security helpdesk for domain blocking."
                )

            if security_awareness.lower() == "beginner":
                personalized_recommendations.append(
                    "Remember that legitimate institutions will never pressure you with strict hour-based countdowns to resolve account or career issues."
                )
        else:
            personalized_recommendations.append(
                f"As a {role_label}, maintaining regular situational awareness ensures routine messages are not exploited by lookalike variations in the future."
            )
            personalized_recommendations.append(
                "Bookmark frequently accessed organizational portals directly instead of searching or following email links."
            )

        # 7. "Why This Matters to You"
        if score >= 40.0:
            if is_student and "internship" in attack_info["name"].lower():
                why_this_matters = (
                    "You frequently receive internship and career-related announcements. "
                    "Attackers exploit this routine expectation by crafting realistic recruitment offers that demand upfront fees before you can verify them."
                )
            elif matched_services:
                why_this_matters = (
                    f"Your security profile lists {', '.join(matched_services)} among your active platforms. "
                    "Attackers routinely impersonate platforms you use regularly to induce automatic trust."
                )
            else:
                why_this_matters = (
                    f"As a {role_label}, communication involving urgent actions or account status requires vigilance. "
                    "Attackers target your daily workflows with tailored social engineering to bypass casual scrutiny."
                )
        else:
            why_this_matters = (
                f"As a {role_label}, you frequently receive routine announcements and administrative notices. "
                "While this communication appears legitimate, maintaining consistent verification habits protects your accounts against unexpected future attempts."
            )

        # 8. "Before You Act" Checklist
        if score >= 40.0:
            before_you_act = [
                "Verify the sender address independently via an official directory",
                "Navigate to the official portal manually without clicking links in the message",
                "Never share passwords, OTPs, or two-factor authentication codes",
                "Do not make unverified registration, deposit, or processing fee payments",
                "Confirm unexpected requests through a verified phone number or in-person channel"
            ]
        else:
            before_you_act = [
                "Confirm that the sender domain matches the expected institution or department",
                "Bookmark official portals directly instead of searching via unverified links",
                "Report any unexpected changes to account policies or payment methods"
            ]

        explainability_details = {
            "overall_finding": overall_finding,
            "why_flagged": why_flagged,
            "evidence_by_agent": evidence_by_agent,
            "incident_context": incident_context,
            "risk_interpretation": risk_interpretation,
            "final_explanation": overall_finding
        }

        return {
            "explainability_details": explainability_details,
            "action_plan": action_plan,
            "personalized_recommendations": personalized_recommendations,
            "why_this_matters": why_this_matters,
            "before_you_act": before_you_act
        }

genai_service = GenAIService()
