import re
import json
from typing import Dict, Any, List, Optional, Union
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.user import UserProfile, ProfileConversation, ProfileHistory
from app.services.llm_gateway import llm_gateway
from app.services.user_profile_rag import user_profile_rag

# Allowed profile fields for security whitelisting (Prevents prompt injection / arbitrary DB modification)
ALLOWED_PROFILE_FIELDS = {
    "role",
    "industry",
    "organization_type",
    "common_services",
    "online_activities",
    "common_communication_types",
    "security_awareness",
    "technical_experience",
    "banking_usage",
    "online_shopping",
    "work_email_usage",
    "preferred_explanation_style",
    "custom_information",
    "preferred_name",
    "profile_preferences",
    "risk_preferences"
}

ALLOWED_OPERATIONS = {"set", "add", "remove"}

PROFILING_SYSTEM_PROMPT = """You are the PhishGuard AI Conversational Profile Assistant.
Your job is to build and maintain a personalized cybersecurity profile for the user.
You must collect only information that can meaningfully improve personalized phishing detection, risk analysis, security recommendations, or explanations.
Start by asking about the user's role.
After every answer, analyze the existing profile and determine whether another question is necessary.
Questions must be dynamically selected based on the user's previous answers.
Never ask a question that has already been answered.
Never ask unnecessary questions.
Prefer selectable options when the possible answers are predictable.
Include an "Other" option when appropriate.
If the user selects "Other", allow a custom response.
Use the user's previous answers to determine relevant follow-up questions.
Different user roles should produce different questions.
For example:
Student -> education platforms, academic email, internship messages, online services.
Employee -> work email, enterprise portals, remote tools, corporate communications.
Developer -> GitHub, cloud platforms (AWS/GCP), APIs, developer platforms.
IT Professional -> infrastructure, cloud platforms, administrative privileges.
Business Owner -> payments, business email, vendors, financial services.
Do not assume information that the user has not provided.
Do not invent profile data.
Do not collect passwords, authentication codes, private keys, payment card numbers, or other sensitive credentials.
When profile information changes through conversation, return structured update operations.
Always keep the profile consistent.
If a user requests an update, determine exactly which profile fields should change.
If the request is ambiguous, ask a clarification question.
Return structured JSON according to the application's schema."""


class ConversationalProfilingService:
    """
    Production-grade Conversational AI User Profiling Service (Spec §8, §9, §10, §11, §13, §14, §15, §18).
    Supports dynamic question generation, multi-type options (single, multi, text, yes_no, scale),
    dimension-based profile completeness calculation, ProfileHistory logging, and User Profile RAG sync.
    """

    def calculate_completion(self, profile: UserProfile) -> Dict[str, Any]:
        """
        Calculates profile completion percentage based on core useful security fields.
        """
        details = self.get_completeness_details(profile)
        return {
            "completion_percentage": details["completion_percentage"],
            "completed_fields": [d["field"] for d in details["dimensions"] if d["status"] == "completed"],
            "missing_fields": [d["field"] for d in details["dimensions"] if d["status"] == "missing"],
            "message": f"Your security profile is {details['completion_percentage']}% complete."
        }

    def get_completeness_details(self, profile: UserProfile) -> Dict[str, Any]:
        """
        Spec §15: Meaningful completeness based on useful security dimensions rather than question count.
        Tracks: Identity, Role, Communication, Activities, Services, Security Awareness, Explanation Preference, Threat Context.
        """
        dimensions = []

        # 1. Identity
        has_identity = bool(profile.preferred_name or profile.organization_type or profile.industry)
        dimensions.append({
            "dimension": "Identity",
            "status": "completed" if has_identity else "missing",
            "description": "User name, organization, or operational context",
            "field": "preferred_name",
            "value": profile.preferred_name or profile.organization_type
        })

        # 2. Role
        has_role = bool(profile.role and profile.role not in ["Unspecified", ""])
        dimensions.append({
            "dimension": "Role",
            "status": "completed" if has_role else "missing",
            "description": "Primary role / occupation (calibrates targeted lure detection)",
            "field": "role",
            "value": profile.role if has_role else None
        })

        # 3. Communication
        has_comm = bool(
            (profile.common_communication_types and len(profile.common_communication_types) > 0)
            or profile.work_email_usage
        )
        dimensions.append({
            "dimension": "Communication",
            "status": "completed" if has_comm else "missing",
            "description": "Common email/messaging channels and work email usage",
            "field": "common_communication_types",
            "value": profile.common_communication_types if profile.common_communication_types else None
        })

        # 4. Activities
        has_activities = bool(
            (profile.online_activities and len(profile.online_activities) > 0)
            or profile.banking_usage or profile.online_shopping
        )
        dimensions.append({
            "dimension": "Activities",
            "status": "completed" if has_activities else "missing",
            "description": "Daily digital habits, shopping, and financial transactions",
            "field": "online_activities",
            "value": profile.online_activities if profile.online_activities else None
        })

        # 5. Services Ecosystem
        has_services = bool(profile.common_services and len(profile.common_services) > 0)
        dimensions.append({
            "dimension": "Services",
            "status": "completed" if has_services else "missing",
            "description": "Monitored account ecosystems (Google, Microsoft, GitHub, AWS)",
            "field": "common_services",
            "value": profile.common_services if has_services else None
        })

        # 6. Security Awareness
        has_awareness = bool(profile.security_awareness and profile.security_awareness not in ["Unspecified", ""])
        dimensions.append({
            "dimension": "Security Awareness",
            "status": "completed" if has_awareness else "missing",
            "description": "Detection confidence tier and technical experience",
            "field": "security_awareness",
            "value": profile.security_awareness if has_awareness else None
        })

        # 7. Explanation Preference
        has_pref = bool(profile.preferred_explanation_style and profile.preferred_explanation_style not in ["Unspecified", ""])
        dimensions.append({
            "dimension": "Explanation Preference",
            "status": "completed" if has_pref else "missing",
            "description": "Plain-language vs forensic technical security guidance",
            "field": "preferred_explanation_style",
            "value": profile.preferred_explanation_style if has_pref else None
        })

        # 8. Threat Context
        has_threat_context = bool(
            (profile.custom_information and len(profile.custom_information) > 0)
            or (profile.risk_preferences and len(profile.risk_preferences) > 0)
            or profile.banking_usage
        )
        dimensions.append({
            "dimension": "Threat Context",
            "status": "completed" if has_threat_context else "missing",
            "description": "Specific exposure themes, custom notes, or high-risk flags",
            "field": "custom_information",
            "value": profile.custom_information if has_threat_context else None
        })

        completed_dims = [d["dimension"] for d in dimensions if d["status"] == "completed"]
        missing_dims = [d["dimension"] for d in dimensions if d["status"] == "missing"]

        # 8 dimensions total, each worth 12.5% (approx 100% total)
        total_dim_count = len(dimensions)
        score = int(round((len(completed_dims) / total_dim_count) * 100))
        score = min(max(score, 10), 100)

        # Recommendation for next missing item
        rec = None
        next_field = None
        if missing_dims:
            first_missing = missing_dims[0]
            missing_obj = next((d for d in dimensions if d["dimension"] == first_missing), None)
            if missing_obj:
                next_field = missing_obj["field"]
                rec = f"Configure your {first_missing} ({missing_obj['description']}) to enhance personalized risk calibration."

        return {
            "completion_percentage": score,
            "dimensions": dimensions,
            "completed_dimensions": completed_dims,
            "missing_dimensions": missing_dims,
            "recommendation": rec,
            "next_question_field": next_field
        }

    def record_profile_history(
        self,
        user_id: str,
        change_type: str,
        description: str,
        field_name: Optional[str] = None,
        old_val: Optional[Any] = None,
        new_val: Optional[Any] = None,
        title: Optional[str] = None,
        source: str = "ai_assistant",
        db: Optional[Session] = None
    ) -> Optional[ProfileHistory]:
        """
        Spec §18: Lightweight meaningful history.
        Does not record trivial UI clicks/scrolls.
        """
        if not db:
            return None

        entry = ProfileHistory(
            user_id=user_id,
            change_type=change_type,
            field_name=field_name,
            old_value=old_val if isinstance(old_val, (dict, list, str, int, bool)) else str(old_val),
            new_value=new_val if isinstance(new_val, (dict, list, str, int, bool)) else str(new_val),
            title=title or change_type.replace("_", " ").title(),
            description=description,
            source=source,
            created_at=datetime.utcnow()
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry

    def start_onboarding(self, user_id: str, db: Session) -> Dict[str, Any]:
        """
        Spec §5, §6, §26: Starts dynamic conversational onboarding.
        Always begins with Role question as baseline anchor.
        """
        profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
        if not profile:
            profile = UserProfile(user_id=user_id, role="Unspecified")
            db.add(profile)
            db.commit()
            db.refresh(profile)

        # Create or fetch active onboarding conversation
        conv = db.query(ProfileConversation).filter(
            ProfileConversation.user_id == user_id,
            ProfileConversation.conversation_type == "onboarding",
            ProfileConversation.is_active == True
        ).order_by(ProfileConversation.created_at.desc()).first()

        if not conv:
            conv = ProfileConversation(
                user_id=user_id,
                conversation_type="onboarding",
                messages=[]
            )
            db.add(conv)
            db.commit()
            db.refresh(conv)

        first_question = {
            "question": "What best describes your current role or profession?",
            "question_type": "single_choice",
            "options": [
                "Student",
                "Software Developer",
                "Employee",
                "Business Owner",
                "IT Professional",
                "Teacher / Academic",
                "Other"
            ],
            "allow_custom_input": True,
            "profile_field": "role",
            "next_action": "await_answer",
            "placeholder": "e.g. High school teacher, Medical researcher...",
            "current_step": 1,
            "total_steps": 5,
            "profile_completion": profile.profile_completion or 20
        }

        intro_text = (
            "Welcome to PhishGuard AI! Let's calibrate your personalized threat detection and risk memory. "
            "To start, what best describes your current role or profession?"
        )

        conv.messages = [
            {
                "role": "assistant",
                "content": intro_text,
                "question": first_question
            }
        ]
        db.commit()

        comp = self.calculate_completion(profile)
        return {
            "conversation_id": conv.conversation_id,
            "assistant_message": intro_text,
            "question": first_question,
            "extracted_profile": self._profile_to_dict(profile),
            "profile_completion": comp["completion_percentage"]
        }

    def process_onboarding_answer(
        self,
        user_id: str,
        conversation_id: str,
        field: Optional[str],
        answer: Optional[Union[str, List[str], bool, int]],
        custom_answer: Optional[str],
        db: Session,
        message: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Spec §8, §9, §26: Process conversational answer (either structured or natural language),
        converts via LLM/schema into validated DB updates, syncs User Profile RAG, and generates next question.
        """
        profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
        if not profile:
            profile = UserProfile(user_id=user_id)
            db.add(profile)
            db.commit()
            db.refresh(profile)

        conv = db.query(ProfileConversation).filter(ProfileConversation.conversation_id == conversation_id).first()

        # Handle natural language freeform response if field/answer not explicitly given
        if message and (not field or not answer):
            extracted = self._extract_profile_from_freeform_text(message, profile, db)
            if extracted:
                changes = []
                for k, v in extracted.items():
                    changes.append({"field": k, "operation": "set" if not isinstance(v, list) else "add", "value": v})
                self.apply_validated_changes(profile, changes, db, source="onboarding")
                field = list(extracted.keys())[0] if extracted else "custom_information"
                answer = message

        elif field and field in ALLOWED_PROFILE_FIELDS:
            norm_val = answer
            if answer == "Other" and custom_answer:
                norm_val = custom_answer.strip()
                cinfo = dict(profile.custom_information or {})
                cinfo[f"custom_{field}"] = custom_answer.strip()
                profile.custom_information = cinfo

            changes = []
            if field in ["common_services", "online_activities", "common_communication_types"]:
                items = norm_val if isinstance(norm_val, list) else [norm_val]
                if "Other" in items and custom_answer:
                    items = [x for x in items if x != "Other"] + [custom_answer.strip()]
                changes.append({"field": field, "operation": "set", "value": items})
            else:
                changes.append({"field": field, "operation": "set", "value": norm_val})

            self.apply_validated_changes(profile, changes, db, source="onboarding")

        # Sync RAG memory
        user_profile_rag.sync_user_profile_memory(user_id, profile, db)

        # Update profile completion score
        comp = self.calculate_completion(profile)
        profile.profile_completion = comp["completion_percentage"]
        db.commit()
        db.refresh(profile)

        # Record message in conversation history
        user_msg = {
            "role": "user",
            "field": field,
            "answer": answer,
            "custom_answer": custom_answer,
            "message": message
        }
        curr_msgs = list(conv.messages or []) if conv else []
        curr_msgs.append(user_msg)

        # Determine next question dynamically
        next_q, ack_message, is_complete = self._generate_next_question(profile, curr_msgs, db)

        if next_q:
            curr_msgs.append({
                "role": "assistant",
                "content": ack_message,
                "question": next_q
            })
        else:
            curr_msgs.append({
                "role": "assistant",
                "content": ack_message,
                "is_complete": True
            })
            if conv:
                conv.is_active = False

        if conv:
            conv.messages = curr_msgs
            db.commit()

        return {
            "conversation_id": conversation_id,
            "assistant_message": ack_message,
            "is_complete": is_complete,
            "next_question": next_q,
            "extracted_profile": self._profile_to_dict(profile),
            "profile_completion": comp["completion_percentage"],
            "feedback_note": f"Saved {field} successfully." if field else "Profile updated successfully."
        }

    def _extract_profile_from_freeform_text(self, text: str, profile: UserProfile, db: Session) -> Dict[str, Any]:
        """
        Spec §9: Pass natural language answer through LLM extraction into structured profile data.
        Never save arbitrary raw LLM output directly; validate against schema.
        """
        active_cred = llm_gateway.get_active_credential(db)
        if active_cred:
            try:
                system_prompt = (
                    "Extract structured user cybersecurity profile data from the user's natural language input.\n"
                    "Allowed keys only: ['role', 'common_services', 'online_activities', 'common_communication_types', 'security_awareness', 'preferred_explanation_style', 'custom_information'].\n"
                    "Do NOT extract passwords, tokens, API keys, or financial numbers.\n"
                    "Return strictly JSON mapping field to value."
                )
                llm_reply = llm_gateway.generate_chat(
                    db,
                    [{"role": "user", "content": text}],
                    system_prompt=system_prompt
                )
                if llm_reply:
                    match = re.search(r"\{.*\}", llm_reply, re.DOTALL)
                    if match:
                        raw_data = json.loads(match.group(0))
                        clean_data = {}
                        for k, v in raw_data.items():
                            if k in ALLOWED_PROFILE_FIELDS and v is not None:
                                clean_data[k] = v
                        if clean_data:
                            return clean_data
            except Exception as e:
                print(f"[ProfileExtraction] LLM extraction fallback: {e}")

        # Fallback keyword extraction
        t = text.lower()
        res = {}
        for r in ["student", "software developer", "developer", "employee", "business owner", "it professional", "teacher"]:
            if r in t:
                res["role"] = r.title()
                break

        found_services = []
        for s in ["google", "github", "aws", "microsoft", "linkedin", "instagram", "slack"]:
            if s in t:
                found_services.append(s.upper() if len(s) <= 3 else s.capitalize())
        if found_services:
            res["common_services"] = found_services

        if "internship" in t or "college" in t or "academic" in t:
            res["common_communication_types"] = ["Internship Inquiries", "University Emails"]

        return res

    def _generate_next_question(
        self,
        profile: UserProfile,
        history: List[Dict[str, Any]],
        db: Session
    ) -> tuple[Optional[Dict[str, Any]], str, bool]:
        """
        Spec §5, §7, §8, §27: Dynamic question planner.
        Chooses the next useful question based on role and missing dimensions.
        Supports question types: single_choice, multiple_choice, yes_no, scale, free_text.
        Stops when sufficient context exists (Rule 3).
        """
        answered_fields = set()
        for m in history:
            if m.get("role") == "user" and m.get("field"):
                answered_fields.add(m["field"])

        role = profile.role or "Student"
        step_num = len(answered_fields) + 1

        # Check completeness details
        comp = self.get_completeness_details(profile)
        # If we have role, services/activities, and awareness, or completion >= 75%, we can finish
        if comp["completion_percentage"] >= 75 and step_num >= 4:
            final_message = (
                f"🎉 **Your personalized security profile is ready!**\n\n"
                f"• **Role:** {profile.role}\n"
                f"• **Awareness Tier:** {profile.security_awareness}\n"
                f"• **Monitored Ecosystems:** {', '.join(profile.common_services[:4]) if profile.common_services else 'General Web'}\n"
                f"• **Explanation Style:** {profile.preferred_explanation_style}\n\n"
                f"PhishGuard AI will now personalize threat explanations, highlight ecosystem lookalikes, "
                f"and tailor action plans to your specific operational context."
            )
            return None, final_message, True

        # --- Dynamic Question Tree Tailored by Role ---

        # 1. Activities & Communications
        if "online_activities" not in answered_fields and "common_communication_types" not in answered_fields:
            if role == "Student":
                return {
                    "question": "What kind of messages and campus communications do you receive most often?",
                    "question_type": "multiple_choice",
                    "options": [
                        "Internship & Job Offers",
                        "University Coursework & Notices",
                        "Campus Club / Societies",
                        "Student Loan & Financial Aid",
                        "Social Media Direct Messages",
                        "Other"
                    ],
                    "allow_custom_input": True,
                    "profile_field": "common_communication_types",
                    "next_action": "await_answer",
                    "current_step": step_num,
                    "total_steps": 5,
                    "profile_completion": 40
                }, "Great! Understanding your primary message types helps detect fake internship lures and scholarship scams. What do you receive most often?", False

            elif role in ["Developer", "Software Developer"]:
                return {
                    "question": "Which developer platforms, cloud providers, and repositories do you interact with?",
                    "question_type": "multiple_choice",
                    "options": [
                        "GitHub / GitLab",
                        "Amazon Web Services (AWS)",
                        "Google Cloud Platform (GCP)",
                        "Microsoft Azure",
                        "Docker / Kubernetes",
                        "API Keys / Webhook Integrations",
                        "Other"
                    ],
                    "allow_custom_input": True,
                    "profile_field": "common_services",
                    "next_action": "await_answer",
                    "current_step": step_num,
                    "total_steps": 5,
                    "profile_completion": 45
                }, "Understood! Developer credentials and access tokens are prime targets for supply chain attacks. Which platforms do you rely on?", False

            elif role in ["Employee", "Business Owner", "IT Professional"]:
                return {
                    "question": "Do you handle vendor invoices, payroll, or business wire communications?",
                    "question_type": "yes_no",
                    "options": ["Yes", "No"],
                    "allow_custom_input": False,
                    "profile_field": "banking_usage",
                    "next_action": "await_answer",
                    "current_step": step_num,
                    "total_steps": 5,
                    "profile_completion": 45
                }, "Understood. Work environments face targeted Business Email Compromise (BEC) and fake invoices. Do you handle financial or vendor communications?", False

            else:
                return {
                    "question": "What are your primary digital activities day-to-day?",
                    "question_type": "multiple_choice",
                    "options": [
                        "Personal & Work Email",
                        "Online Banking & Transfers",
                        "E-Commerce & Package Tracking",
                        "Social Networking",
                        "Streaming & Gaming",
                        "Other"
                    ],
                    "allow_custom_input": True,
                    "profile_field": "online_activities",
                    "next_action": "await_answer",
                    "current_step": step_num,
                    "total_steps": 5,
                    "profile_completion": 40
                }, "Got it! Let's see what online services you interact with most. What are your primary daily activities?", False

        # 2. Services Ecosystem (if not answered)
        if "common_services" not in answered_fields:
            return {
                "question": "Which account ecosystems and services do you commonly use and monitor?",
                "question_type": "multiple_choice",
                "options": [
                    "Google (Gmail, Drive, Docs)",
                    "Microsoft (Outlook, Office 365, Teams)",
                    "GitHub / GitLab",
                    "LinkedIn & Career Portals",
                    "Online Banking & UPI / PayPal",
                    "Amazon & Shopping Portals",
                    "Social Media (Instagram, X, Facebook)",
                    "Other"
                ],
                "allow_custom_input": True,
                "profile_field": "common_services",
                "next_action": "await_answer",
                "current_step": step_num,
                "total_steps": 5,
                "profile_completion": 60
            }, "Thanks! Identifying your commonly used accounts enables PhishGuard AI to flag lookalike domains and credential harvesters.", False

        # 3. Security Awareness / Confidence (Scale 1-5 or tier)
        if "security_awareness" not in answered_fields:
            return {
                "question": "How confident are you at identifying subtle phishing indicators, spoofed headers, and lookalike domains?",
                "question_type": "scale",
                "options": [
                    "1 — Beginner (I need plain-language guidance)",
                    "2 — Basic",
                    "3 — Intermediate (I spot obvious spam)",
                    "4 — Advanced",
                    "5 — Expert (I inspect headers, SPF/DKIM, and IoCs)"
                ],
                "allow_custom_input": False,
                "profile_field": "security_awareness",
                "next_action": "await_answer",
                "current_step": step_num,
                "total_steps": 5,
                "profile_completion": 75
            }, "Let's calibrate your security awareness to match your experience level.", False

        # 4. Explanation Preference
        if "preferred_explanation_style" not in answered_fields:
            return {
                "question": "How would you like security explanations and action plans to be presented?",
                "question_type": "single_choice",
                "options": [
                    "Simple (Concise summary, non-technical plain English, actionable guidance)",
                    "Detailed (Full breakdown with evidence, risk indicators, and defensive steps)",
                    "Technical (Forensic indicators of compromise, header anomalies, threat actor techniques)"
                ],
                "allow_custom_input": False,
                "profile_field": "preferred_explanation_style",
                "next_action": "await_answer",
                "current_step": step_num,
                "total_steps": 5,
                "profile_completion": 90
            }, "Almost finished! How would you prefer threat explanations and action recommendations to look?", False

        # 5. Finished!
        final_message = (
            f"🎉 **Your personalized security profile is ready!**\n\n"
            f"• **Role:** {profile.role}\n"
            f"• **Awareness Tier:** {profile.security_awareness}\n"
            f"• **Monitored Services:** {', '.join(profile.common_services[:4]) if profile.common_services else 'General Web'}\n"
            f"• **Explanation Preference:** {profile.preferred_explanation_style}\n\n"
            f"PhishGuard AI will now personalize threat explanations, highlight lookalike domains, "
            f"and tailor defense plans to your specific environment."
        )
        return None, final_message, True

    def process_profile_assistant(
        self,
        user_id: str,
        message: str,
        conversation_id: Optional[str],
        db: Session
    ) -> Dict[str, Any]:
        """
        Spec §13, §14, §21, §22, §26: Conversational Profile Assistant ("Edit Profile with AI").
        Converts natural-language instructions into structured changes.
        Provides preview diff & confirmation prompt for ambiguous or multi-item updates.
        Synchronizes DB + User Profile RAG + ProfileHistory + UI state.
        """
        profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
        if not profile:
            profile = UserProfile(user_id=user_id, role="Student")
            db.add(profile)
            db.commit()
            db.refresh(profile)

        # 1. Try LLM structured extraction if LLM configured
        active_cred = llm_gateway.get_active_credential(db)
        parsed_result = None

        if active_cred:
            try:
                system_prompt = (
                    "You are the PhishGuard AI Profile Update Specialist.\n"
                    "Analyze the user's natural language profile modification request.\n"
                    f"Current profile: {json.dumps(self._profile_to_dict(profile))}\n"
                    "Allowed fields: ['role', 'industry', 'organization_type', 'common_services', 'online_activities', "
                    "'common_communication_types', 'security_awareness', 'technical_experience', 'banking_usage', 'online_shopping', 'work_email_usage', 'preferred_explanation_style', 'custom_information'].\n"
                    "Allowed operations: 'set', 'add', 'remove'.\n"
                    "If user says 'remove X from services', use operation 'remove'.\n"
                    "If user says 'add X to services', use operation 'add'.\n"
                    "If the instruction is ambiguous (e.g. 'I don't use that anymore' without specifying what 'that' is), "
                    "set 'intent': 'clarification', 'requires_confirmation': false, 'assistant_message': 'Which service or activity would you like to remove?'\n"
                    "If multiple fields change or significant changes occur, set 'requires_confirmation': true and provide 'confirmation_prompt'.\n"
                    "Return strictly JSON:\n"
                    "{\n"
                    "  'intent': 'update_profile' | 'clarification',\n"
                    "  'assistant_message': 'Friendly description of the proposed update',\n"
                    "  'changes': [\n"
                    "    { 'field': '...', 'operation': 'set'|'add'|'remove', 'value': ... }\n"
                    "  ],\n"
                    "  'requires_confirmation': boolean,\n"
                    "  'confirmation_prompt': 'Proposed change: Role: Student → Software Developer. Confirm?'\n"
                    "}"
                )
                llm_reply = llm_gateway.generate_chat(
                    db,
                    [{"role": "user", "content": message}],
                    system_prompt=system_prompt
                )
                if llm_reply:
                    match = re.search(r"\{.*\}", llm_reply, re.DOTALL)
                    if match:
                        parsed_result = json.loads(match.group(0))
            except Exception as e:
                print(f"[ProfileAssistant] LLM assistant error, falling back to rule engine: {e}")

        # 2. Deterministic Rule Parser Fallback
        if not parsed_result or not parsed_result.get("changes"):
            parsed_result = self._rule_based_nlp_update(message, profile)

        changes = parsed_result.get("changes", [])
        intent = parsed_result.get("intent", "update_profile")
        requires_confirm = parsed_result.get("requires_confirmation", False)

        # Generate preview diff (Spec §13, §14)
        preview_diff = {}
        for ch in changes:
            f = ch.get("field")
            op = ch.get("operation", "set")
            val = ch.get("value")
            curr_val = getattr(profile, f, None)

            if op == "add":
                preview_diff[f] = {"added": val if isinstance(val, list) else [val]}
            elif op == "remove":
                preview_diff[f] = {"removed": val if isinstance(val, list) else [val]}
            else:
                preview_diff[f] = {"old": curr_val, "new": val}

        # If confirmation is required, return proposed changes with diff preview
        if requires_confirm and changes:
            conf_prompt = parsed_result.get("confirmation_prompt")
            if not conf_prompt:
                diff_summary = []
                for f, d in preview_diff.items():
                    if "old" in d and "new" in d:
                        diff_summary.append(f"{f.replace('_', ' ').title()}: {d['old']} → {d['new']}")
                    elif "added" in d:
                        diff_summary.append(f"Add to {f.replace('_', ' ').title()}: {', '.join(d['added'])}")
                    elif "removed" in d:
                        diff_summary.append(f"Remove from {f.replace('_', ' ').title()}: {', '.join(d['removed'])}")
                conf_prompt = f"I can update your profile.\n\nProposed change:\n" + "\n".join(diff_summary)

            return {
                "conversation_id": conversation_id or "assistant_session",
                "intent": "update_profile",
                "assistant_message": conf_prompt,
                "proposed_changes": changes,
                "changes": changes,
                "requires_confirmation": True,
                "confirmation_prompt": conf_prompt,
                "preview_diff": preview_diff,
                "updated_profile": self._profile_to_dict(profile),
                "profile_completion": profile.profile_completion or 20,
                "history_entry": None
            }

        # If clarification requested (Spec §22)
        if intent == "clarification":
            return {
                "conversation_id": conversation_id or "assistant_session",
                "intent": "clarification",
                "assistant_message": parsed_result.get("assistant_message", "Could you please specify which profile setting or service you would like to update?"),
                "proposed_changes": [],
                "changes": [],
                "requires_confirmation": False,
                "confirmation_prompt": None,
                "preview_diff": None,
                "updated_profile": self._profile_to_dict(profile),
                "profile_completion": profile.profile_completion or 20,
                "history_entry": None
            }

        # Unambiguous change: Apply immediately (Spec §13)
        applied = self.apply_validated_changes(profile, changes, db, source="ai_assistant")
        user_profile_rag.sync_user_profile_memory(user_id, profile, db)

        comp = self.calculate_completion(profile)
        profile.profile_completion = comp["completion_percentage"]
        db.commit()
        db.refresh(profile)

        # Get latest recorded history description
        latest_hist = db.query(ProfileHistory).filter(ProfileHistory.user_id == user_id).order_by(ProfileHistory.created_at.desc()).first()
        hist_desc = latest_hist.description if latest_hist else None

        resp_msg = parsed_result.get("assistant_message")
        if not resp_msg or resp_msg.startswith("I can update"):
            resp_msg = f"✓ Profile updated successfully ({len(applied)} change applied)."

        return {
            "conversation_id": conversation_id or "assistant_session",
            "intent": "update_profile",
            "assistant_message": resp_msg,
            "proposed_changes": applied,
            "changes": applied,
            "requires_confirmation": False,
            "confirmation_prompt": None,
            "preview_diff": preview_diff,
            "updated_profile": self._profile_to_dict(profile),
            "profile_completion": comp["completion_percentage"],
            "history_entry": hist_desc
        }

    def process_conversational_edit(
        self,
        user_id: str,
        message: str,
        conversation_id: Optional[str],
        db: Session
    ) -> Dict[str, Any]:
        """Wrapper for legacy /conversation endpoint."""
        return self.process_profile_assistant(user_id, message, conversation_id, db)

    def apply_validated_changes(
        self,
        profile: UserProfile,
        changes: List[Dict[str, Any]],
        db: Session,
        source: str = "ai_assistant"
    ) -> List[Dict[str, Any]]:
        """
        Spec §18, §22, §23: Validates and applies changes strictly against schema whitelist.
        Records meaningful ProfileHistory entries and triggers User Profile RAG sync.
        """
        applied = []
        for ch in changes:
            f = ch.get("field")
            op = ch.get("operation", "set")
            val = ch.get("value")

            if f not in ALLOWED_PROFILE_FIELDS or op not in ALLOWED_OPERATIONS:
                continue

            old_val = getattr(profile, f, None)

            if f in ["common_services", "online_activities", "common_communication_types"]:
                curr_list = list(old_val or [])
                items = val if isinstance(val, list) else [val]
                items_clean = [str(x).strip() for x in items if x]

                if op == "set":
                    setattr(profile, f, items_clean)
                    if set(curr_list) != set(items_clean):
                        self.record_profile_history(
                            user_id=profile.user_id,
                            change_type=f"{f}_updated",
                            description=f"{f.replace('_', ' ').title()} updated: {', '.join(items_clean)}",
                            field_name=f,
                            old_val=curr_list,
                            new_val=items_clean,
                            source=source,
                            db=db
                        )
                elif op == "add":
                    added = []
                    for it in items_clean:
                        if it not in curr_list:
                            curr_list.append(it)
                            added.append(it)
                    setattr(profile, f, curr_list)
                    if added:
                        self.record_profile_history(
                            user_id=profile.user_id,
                            change_type=f"{f}_added",
                            description=f"Added to {f.replace('_', ' ').title()}: {', '.join(added)}",
                            field_name=f,
                            old_val=old_val,
                            new_val=curr_list,
                            source=source,
                            db=db
                        )
                elif op == "remove":
                    removed = []
                    for it in items_clean:
                        before_len = len(curr_list)
                        curr_list = [x for x in curr_list if str(x).lower() != str(it).lower()]
                        if len(curr_list) < before_len:
                            removed.append(it)
                    setattr(profile, f, curr_list)
                    if removed:
                        self.record_profile_history(
                            user_id=profile.user_id,
                            change_type=f"{f}_removed",
                            description=f"Removed from {f.replace('_', ' ').title()}: {', '.join(removed)}",
                            field_name=f,
                            old_val=old_val,
                            new_val=curr_list,
                            source=source,
                            db=db
                        )
                applied.append(ch)

            elif f in ["banking_usage", "online_shopping", "work_email_usage"]:
                if isinstance(val, bool):
                    bool_val = val
                else:
                    bool_val = str(val).lower() in ["true", "yes", "enable", "1", "active"]
                if old_val != bool_val:
                    setattr(profile, f, bool_val)
                    self.record_profile_history(
                        user_id=profile.user_id,
                        change_type="risk_flag_change",
                        description=f"{f.replace('_', ' ').title()}: {'Active' if bool_val else 'Inactive'}",
                        field_name=f,
                        old_val=old_val,
                        new_val=bool_val,
                        source=source,
                        db=db
                    )
                applied.append({"field": f, "operation": "set", "value": bool_val})

            elif f == "custom_information":
                cinfo = dict(profile.custom_information or {})
                if isinstance(val, dict):
                    cinfo.update(val)
                elif isinstance(val, str):
                    cinfo["user_notes"] = val
                setattr(profile, f, cinfo)
                self.record_profile_history(
                    user_id=profile.user_id,
                    change_type="custom_context_updated",
                    description="Updated custom security context notes",
                    field_name=f,
                    old_val=old_val,
                    new_val=cinfo,
                    source=source,
                    db=db
                )
                applied.append(ch)

            else:
                str_val = str(val).strip()
                if old_val != str_val:
                    setattr(profile, f, str_val)
                    # Spec §18 formatted descriptions
                    if f == "role":
                        desc = f"Role changed: {old_val or 'Unspecified'} → {str_val}"
                        c_type = "role_change"
                    elif f == "preferred_explanation_style":
                        desc = f"Explanation preference: {old_val or 'Simple'} → {str_val}"
                        c_type = "preference_change"
                    elif f == "security_awareness":
                        desc = f"Security awareness: {old_val or 'Beginner'} → {str_val}"
                        c_type = "awareness_change"
                    else:
                        desc = f"{f.replace('_', ' ').title()} changed: {old_val} → {str_val}"
                        c_type = "profile_update"

                    self.record_profile_history(
                        user_id=profile.user_id,
                        change_type=c_type,
                        description=desc,
                        field_name=f,
                        old_val=old_val,
                        new_val=str_val,
                        source=source,
                        db=db
                    )
                applied.append({"field": f, "operation": "set", "value": str_val})

        db.commit()

        # Synchronize User Profile RAG
        user_profile_rag.sync_user_profile_memory(profile.user_id, profile, db)
        return applied

    def _rule_based_nlp_update(self, text: str, profile: UserProfile) -> Dict[str, Any]:
        """
        Spec §21, §22: Deterministic NLP rule parser for profile update instructions.
        Handles role changes, services add/remove, banking toggles, explanation styles, and ambiguity.
        """
        t = text.lower().strip()
        changes = []

        # 1. Ambiguity check: Spec §22
        # If user says "I don't use that anymore" or "remove that" without specifying what "that" is
        if re.search(r"\b(don't use that|dont use that|remove that|stop that|delete that)\b", t):
            return {
                "intent": "clarification",
                "changes": [],
                "requires_confirmation": False,
                "assistant_message": "Which service or activity would you like to remove?"
            }

        # 2. Role updates (Spec §21 Ex 1)
        role_map = {
            "software developer": "Software Developer",
            "developer": "Software Developer",
            "student": "Student",
            "it professional": "IT Professional",
            "employee": "Employee",
            "business owner": "Business Owner",
            "teacher": "Teacher",
            "security analyst": "Security Analyst"
        }
        for kw, r_title in role_map.items():
            if (f"role to {kw}" in t or f"role changed to {kw}" in t or
                f"i changed my role to {kw}" in t or f"i'm now a {kw}" in t or
                f"i am now a {kw}" in t or f"working as a {kw}" in t or f"working as {kw}" in t):
                changes.append({"field": "role", "operation": "set", "value": r_title})
                break

        # 3. Services add / remove (Spec §21 Ex 4)
        service_targets = ["aws", "github", "gitlab", "google", "microsoft", "instagram", "facebook", "twitter", "x", "linkedin", "slack", "teams", "paypal", "docker"]
        
        # Remove from services
        if "remove " in t or "delete " in t:
            for s in service_targets:
                if f"remove {s}" in t or f"delete {s}" in t:
                    changes.append({"field": "common_services", "operation": "remove", "value": s.upper() if len(s) <= 4 else s.capitalize()})

        # Add to services
        if "add " in t:
            for s in service_targets:
                if f"add {s}" in t or (len(changes) > 0 and f"and {s}" in t):
                    changes.append({"field": "common_services", "operation": "add", "value": s.upper() if len(s) <= 4 else s.capitalize()})

        # 4. Banking usage (Spec §21 Ex 3)
        if any(p in t for p in ["don't use online banking", "dont use online banking", "don't use banking", "dont use banking", "no longer use banking", "no banking"]):
            changes.append({"field": "banking_usage", "operation": "set", "value": False})
        elif any(p in t for p in ["started using online banking", "i use online banking", "enable banking", "use banking"]):
            changes.append({"field": "banking_usage", "operation": "set", "value": True})

        # 5. Explanation preference
        if "explanation" in t or "explanations" in t or "style" in t:
            if "technical" in t:
                changes.append({"field": "preferred_explanation_style", "operation": "set", "value": "Technical"})
            elif "simple" in t:
                changes.append({"field": "preferred_explanation_style", "operation": "set", "value": "Simple"})
            elif "detailed" in t:
                changes.append({"field": "preferred_explanation_style", "operation": "set", "value": "Detailed"})

        # 6. Security awareness
        for tier in ["beginner", "intermediate", "advanced", "expert"]:
            if f"awareness to {tier}" in t or f"confidence to {tier}" in t or f"level to {tier}" in t:
                changes.append({"field": "security_awareness", "operation": "set", "value": tier.title()})
                break

        # 7. Check if multi-item or role change requires confirmation preview (Spec §13, §14)
        requires_confirm = len(changes) > 1 or any(c["field"] == "role" for c in changes)

        return {
            "intent": "update_profile",
            "changes": changes,
            "requires_confirmation": requires_confirm,
            "assistant_message": f"Identified {len(changes)} profile modification(s)." if changes else "Could you please specify what you'd like to update in your profile?"
        }

    def _profile_to_dict(self, p: UserProfile) -> Dict[str, Any]:
        return {
            "preferred_name": p.preferred_name or "User",
            "role": p.role or "Student",
            "industry": p.industry,
            "organization_type": p.organization_type,
            "common_services": p.common_services or [],
            "online_activities": p.online_activities or [],
            "common_communication_types": p.common_communication_types or [],
            "security_awareness": p.security_awareness or "Beginner",
            "technical_experience": p.technical_experience or "Intermediate",
            "banking_usage": bool(p.banking_usage),
            "online_shopping": bool(p.online_shopping),
            "work_email_usage": bool(p.work_email_usage),
            "preferred_explanation_style": p.preferred_explanation_style or "Simple",
            "custom_information": p.custom_information or {},
            "profile_completion": p.profile_completion or 20
        }


profiling_service = ConversationalProfilingService()
