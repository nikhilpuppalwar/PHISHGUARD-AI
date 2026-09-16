import re
import json
from typing import Dict, Any, List, Optional, Union
from sqlalchemy.orm import Session

from app.models.user import UserProfile, ProfileConversation
from app.services.llm_gateway import llm_gateway

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
    "preferred_name"
}

ALLOWED_OPERATIONS = {"set", "add", "remove"}

# System prompt for LLM as specified in Section 13
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
Student -> education platforms, academic email, social media, online services.
Employee -> work email, organization type, remote work, business applications.
Developer -> GitHub, cloud services, APIs, developer platforms.
IT Professional -> infrastructure, cloud platforms, administrative privileges, security responsibilities.
Business Owner -> payments, business email, employees, financial services.
Do not assume information that the user has not provided.
Do not invent profile data.
Do not collect passwords, authentication codes, private keys, payment card numbers, or other highly sensitive credentials.
When profile information changes through conversation, return structured update operations.
Always keep the profile consistent.
If a user requests an update, determine exactly which profile fields should change.
If the request is ambiguous, ask a clarification question.
Return structured JSON according to the application's schema."""

class ConversationalProfilingService:
    """
    Production-grade Conversational AI User Profiling Service.
    Supports dynamic question generation, multi-type options (single, multi, text, yes_no, custom),
    profile completion calculation, and natural-language conversational profile editing.
    """

    def calculate_completion(self, profile: UserProfile) -> Dict[str, Any]:
        """
        Calculates profile completion percentage based on core useful security fields.
        """
        weights = {
            "role": 20,
            "common_services": 20,
            "online_activities": 15,
            "security_awareness": 15,
            "technical_experience": 10,
            "organization_or_industry": 10,
            "banking_or_email": 10,
        }

        completed_fields = []
        missing_fields = []
        score = 0

        # Check role
        if profile.role and profile.role not in ["Unspecified", ""]:
            score += weights["role"]
            completed_fields.append("role")
        else:
            missing_fields.append("role")

        # Check services
        if profile.common_services and len(profile.common_services) > 0:
            score += weights["common_services"]
            completed_fields.append("common_services")
        else:
            missing_fields.append("common_services")

        # Check online activities
        if profile.online_activities and len(profile.online_activities) > 0:
            score += weights["online_activities"]
            completed_fields.append("online_activities")
        else:
            missing_fields.append("online_activities")

        # Check security awareness
        if profile.security_awareness:
            score += weights["security_awareness"]
            completed_fields.append("security_awareness")
        else:
            missing_fields.append("security_awareness")

        # Check technical experience
        if profile.technical_experience:
            score += weights["technical_experience"]
            completed_fields.append("technical_experience")
        else:
            missing_fields.append("technical_experience")

        # Organization or Industry
        if profile.organization_type or profile.industry:
            score += weights["organization_or_industry"]
            completed_fields.append("organization/industry")
        else:
            missing_fields.append("organization/industry")

        # Banking / Work Email
        if profile.banking_usage or profile.work_email_usage or profile.online_shopping:
            score += weights["banking_or_email"]
            completed_fields.append("banking_or_email")
        else:
            missing_fields.append("banking_or_email")

        score = min(max(score, 10), 100)

        return {
            "completion_percentage": score,
            "completed_fields": completed_fields,
            "missing_fields": missing_fields,
            "message": f"Your security profile is {score}% complete."
        }

    def start_onboarding(self, user_id: str, db: Session) -> Dict[str, Any]:
        """
        Step 1: Start onboarding conversation. Always begins with the role question per specification.
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
            "question": "What best describes your role?",
            "question_type": "single_choice",
            "options": [
                "Student",
                "Employee",
                "Business Owner",
                "IT Professional",
                "Developer",
                "Teacher",
                "Other"
            ],
            "allow_custom_input": True,
            "profile_field": "role",
            "next_action": "await_answer",
            "current_step": 1,
            "total_steps": 4,
            "profile_completion": 20
        }

        intro_text = (
            "Welcome to PhishGuard AI! Let's personalize your threat protection and risk analysis. "
            "To calibrate detection for your environment, what best describes your role?"
        )

        # Record assistant message in conversation
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
        field: str,
        answer: Union[str, List[str], bool],
        custom_answer: Optional[str],
        db: Session
    ) -> Dict[str, Any]:
        """
        Step 2: Receives the user's answer, updates database, dynamically generates next question.
        """
        profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
        conv = db.query(ProfileConversation).filter(ProfileConversation.conversation_id == conversation_id).first()

        # 1. Update Profile based on field & answer
        norm_val = answer
        if answer == "Other" and custom_answer:
            norm_val = custom_answer.strip()
            # Store in custom_information
            cinfo = dict(profile.custom_information or {})
            cinfo[f"custom_{field}"] = custom_answer.strip()
            profile.custom_information = cinfo

        if field in ALLOWED_PROFILE_FIELDS:
            if field == "role":
                profile.role = norm_val
            elif field == "industry":
                profile.industry = norm_val
            elif field == "organization_type":
                profile.organization_type = norm_val
            elif field == "common_services":
                services = norm_val if isinstance(norm_val, list) else [norm_val]
                if "Other" in services and custom_answer:
                    services.remove("Other")
                    services.append(custom_answer.strip())
                profile.common_services = list(set(services))
            elif field == "online_activities":
                acts = norm_val if isinstance(norm_val, list) else [norm_val]
                if "Other" in acts and custom_answer:
                    acts.remove("Other")
                    acts.append(custom_answer.strip())
                profile.online_activities = list(set(acts))
                # infer banking or shopping if mentioned
                if any("bank" in str(a).lower() for a in acts):
                    profile.banking_usage = True
                if any("shop" in str(a).lower() for a in acts):
                    profile.online_shopping = True
            elif field == "security_awareness":
                profile.security_awareness = norm_val
            elif field == "technical_experience":
                profile.technical_experience = norm_val
            elif field == "banking_usage":
                profile.banking_usage = bool(norm_val)
            elif field == "online_shopping":
                profile.online_shopping = bool(norm_val)
            elif field == "work_email_usage":
                profile.work_email_usage = bool(norm_val)

        # Update profile completion score
        comp = self.calculate_completion(profile)
        profile.profile_completion = comp["completion_percentage"]
        db.commit()
        db.refresh(profile)

        # 2. Append user response to conversation history
        user_msg = {
            "role": "user",
            "field": field,
            "answer": answer,
            "custom_answer": custom_answer
        }
        curr_msgs = list(conv.messages or []) if conv else []
        curr_msgs.append(user_msg)

        # 3. Determine next question dynamically
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
            "feedback_note": f"Saved {field} successfully."
        }

    def _generate_next_question(
        self,
        profile: UserProfile,
        history: List[Dict[str, Any]],
        db: Session
    ) -> tuple[Optional[Dict[str, Any]], str, bool]:
        """
        Dynamically determines the next relevant question based on user role and missing dimensions.
        """
        answered_fields = set()
        for m in history:
            if m.get("role") == "user" and m.get("field"):
                answered_fields.add(m["field"])

        role = profile.role or "Student"
        step_num = len(answered_fields) + 1

        # Check if active LLM can generate the dynamic question
        active_cred = llm_gateway.get_active_credential(db)
        if active_cred and step_num <= 4:
            try:
                llm_prompt = (
                    f"Existing user profile: {json.dumps(self._profile_to_dict(profile))}.\n"
                    f"Answered fields so far: {list(answered_fields)}.\n"
                    f"Role: {role}. Current question count: {step_num - 1}.\n"
                    f"If we already have enough information (role, activities/services, security awareness), "
                    f"return JSON: {{ 'is_complete': true, 'assistant_message': 'Your security profile is complete!' }}.\n"
                    f"Otherwise, generate the single most relevant next question for a {role}.\n"
                    f"Return JSON strictly:\n"
                    f"{{\n"
                    f"  'is_complete': false,\n"
                    f"  'assistant_message': 'Brief acknowledgement and lead-in',\n"
                    f"  'question': 'Clear question string',\n"
                    f"  'question_type': 'single_choice' or 'multiple_choice' or 'yes_no',\n"
                    f"  'options': ['Option 1', 'Option 2', ..., 'Other'],\n"
                    f"  'allow_custom_input': true,\n"
                    f"  'profile_field': 'online_activities' or 'common_services' or 'security_awareness' or 'organization_type'\n"
                    f"}}"
                )
                llm_reply = llm_gateway.generate_chat(
                    db,
                    [{"role": "user", "content": llm_prompt}],
                    system_prompt=PROFILING_SYSTEM_PROMPT
                )
                if llm_reply:
                    match = re.search(r"\{.*\}", llm_reply, re.DOTALL)
                    if match:
                        data = json.loads(match.group(0))
                        if data.get("is_complete"):
                            return None, data.get("assistant_message", "All set! Your profile is ready."), True
                        if data.get("question") and data.get("profile_field"):
                            q_data = {
                                "question": data["question"],
                                "question_type": data.get("question_type", "single_choice"),
                                "options": data.get("options", ["Yes", "No", "Other"]),
                                "allow_custom_input": True,
                                "profile_field": data["profile_field"],
                                "next_action": "await_answer",
                                "current_step": step_num,
                                "total_steps": 4,
                                "profile_completion": profile.profile_completion
                            }
                            return q_data, data.get("assistant_message", data["question"]), False
            except Exception as e:
                print(f"LLM dynamic question generation fallback: {e}")

        # --- Deterministic Dynamic Fallback Tree Tailored by Role ---

        # 1. Activities / Online Use (if not answered)
        if "online_activities" not in answered_fields:
            if role == "Student":
                return {
                    "question": "What do you mainly use the internet and campus accounts for?",
                    "question_type": "multiple_choice",
                    "options": [
                        "Coursework & University Portals",
                        "Internship & Job Applications",
                        "Social Media",
                        "Online Banking & Transfers",
                        "Online Shopping",
                        "Entertainment & Gaming",
                        "Other"
                    ],
                    "allow_custom_input": True,
                    "profile_field": "online_activities",
                    "next_action": "await_answer",
                    "current_step": 2,
                    "total_steps": 4,
                    "profile_completion": 40
                }, "Great! Understanding your primary online habits helps detect tailored phishing attacks. What do you mainly use the internet for?", False

            elif role == "Developer":
                return {
                    "question": "Which development and infrastructure platforms do you interact with regularly?",
                    "question_type": "multiple_choice",
                    "options": [
                        "GitHub & Git Repositories",
                        "Cloud Providers (AWS / GCP / Azure)",
                        "Developer APIs & Webhooks",
                        "Package Registries (npm / PyPI / Docker)",
                        "CI/CD Pipelines",
                        "StackOverflow & Tech Forums",
                        "Other"
                    ],
                    "allow_custom_input": True,
                    "profile_field": "common_services",
                    "next_action": "await_answer",
                    "current_step": 2,
                    "total_steps": 4,
                    "profile_completion": 40
                }, "Understood! Developer accounts are prime targets for token harvesting and supply chain attacks. Which platforms do you rely on?", False

            elif role in ["Employee", "Business Owner", "IT Professional"]:
                return {
                    "question": "What business and corporate communication channels do you use most?",
                    "question_type": "multiple_choice",
                    "options": [
                        "Corporate Work Email (Outlook / Exchange)",
                        "Enterprise SSO & Identity Portals",
                        "Cloud Collaboration (Slack / Teams)",
                        "Invoicing & Vendor Banking Transfers",
                        "Customer CRM & HR Systems",
                        "Remote VPN & Cloud Desktops",
                        "Other"
                    ],
                    "allow_custom_input": True,
                    "profile_field": "common_services",
                    "next_action": "await_answer",
                    "current_step": 2,
                    "total_steps": 4,
                    "profile_completion": 40
                }, "Understood. Work accounts face targeted business email compromise (BEC) and fake invoice scams. Which communication channels do you use?", False

            else:
                return {
                    "question": "What are your primary digital activities day-to-day?",
                    "question_type": "multiple_choice",
                    "options": [
                        "Personal Email & Webmail",
                        "Online Banking & Payments",
                        "E-Commerce & Package Tracking",
                        "Social Networking",
                        "News & Media",
                        "Other"
                    ],
                    "allow_custom_input": True,
                    "profile_field": "online_activities",
                    "next_action": "await_answer",
                    "current_step": 2,
                    "total_steps": 4,
                    "profile_completion": 40
                }, "Got it. Let's see what services you interact with most. What are your primary digital activities?", False

        # 2. Common Services & Accounts (if not answered)
        if "common_services" not in answered_fields:
            return {
                "question": "Which account ecosystems and services do you commonly use?",
                "question_type": "multiple_choice",
                "options": [
                    "Google (Gmail, Drive, Docs)",
                    "Microsoft (Outlook, Office 365, Teams)",
                    "GitHub / GitLab",
                    "LinkedIn & Career Portals",
                    "Financial & Banking Portals",
                    "PayPal / Apple Pay",
                    "Social Media (Instagram, X, Facebook)",
                    "Other"
                ],
                "allow_custom_input": True,
                "profile_field": "common_services",
                "next_action": "await_answer",
                "current_step": 3,
                "total_steps": 4,
                "profile_completion": 65
            }, "Thanks! Identifying your commonly used accounts enables PhishGuard AI to flag lookalike domains and credential harvesters.", False

        # 3. Security Awareness Level
        if "security_awareness" not in answered_fields:
            return {
                "question": "How would you describe your experience identifying suspicious emails, spoofed headers, or malicious links?",
                "question_type": "single_choice",
                "options": [
                    "Beginner (I want plain-language warnings and step-by-step guidance)",
                    "Intermediate (I can spot obvious spam, but need help with lookalike domains)",
                    "Advanced (I inspect headers, DKIM/SPF, and URL parameters)",
                    "Security Professional (I want forensic deltas and technical IoCs)"
                ],
                "allow_custom_input": False,
                "profile_field": "security_awareness",
                "next_action": "await_answer",
                "current_step": 4,
                "total_steps": 4,
                "profile_completion": 85
            }, "Almost done! Let's calibrate how technical you'd like your threat explanations to be.", False

        # 4. Finished!
        final_message = (
            f"🎉 **Your personalized security profile is ready!**\n\n"
            f"• **Role:** {profile.role}\n"
            f"• **Awareness Tier:** {profile.security_awareness}\n"
            f"• **Monitored Services:** {', '.join(profile.common_services[:4]) if profile.common_services else 'General Web'}\n\n"
            f"PhishGuard AI will now automatically customize risk thresholds, alert tones, and defense action plans to your environment."
        )
        return None, final_message, True

    def process_conversational_edit(
        self,
        user_id: str,
        message: str,
        conversation_id: Optional[str],
        db: Session
    ) -> Dict[str, Any]:
        """
        Processes natural language instructions to update the profile (Section 10, 11, 12).
        Examples:
        - "My role changed to developer."
        - "Remove Instagram from my commonly used platforms."
        - "I don't use online banking."
        - "Add GitHub and AWS to the services I use."
        """
        profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
        if not profile:
            profile = UserProfile(user_id=user_id, role="Student")
            db.add(profile)
            db.commit()
            db.refresh(profile)

        # 1. Try LLM structured extraction if available
        active_cred = llm_gateway.get_active_credential(db)
        llm_response_data = None
        if active_cred:
            try:
                system_prompt = (
                    "You are the PhishGuard AI Profile Update Specialist. "
                    "Analyze the user's natural language profile update request. "
                    "Allowed fields: ['role', 'industry', 'organization_type', 'common_services', 'online_activities', "
                    "'security_awareness', 'technical_experience', 'banking_usage', 'online_shopping', 'work_email_usage', 'custom_information'].\n"
                    "Allowed operations: 'set', 'add', 'remove'.\n"
                    "If the user says 'remove X from services', use operation 'remove'.\n"
                    "If the user says 'add X and Y to services', use operation 'add'.\n"
                    "If ambiguous, set 'requires_confirmation': true and provide a confirmation question in 'confirmation_prompt'.\n"
                    "Return strictly JSON:\n"
                    "{\n"
                    "  'intent': 'profile_update' or 'clarification',\n"
                    "  'changes': [\n"
                    "    { 'field': 'fieldName', 'operation': 'set'|'add'|'remove', 'value': '...' }\n"
                    "  ],\n"
                    "  'requires_confirmation': boolean,\n"
                    "  'confirmation_prompt': '...', \n"
                    "  'response': 'Friendly confirmation message'\n"
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
                        llm_response_data = json.loads(match.group(0))
            except Exception as e:
                print(f"Conversational edit LLM error, falling back to rule parser: {e}")

        # 2. Fallback Rule-Based Natural Language Parser
        if not llm_response_data or not llm_response_data.get("changes"):
            llm_response_data = self._rule_based_nlp_update(message, profile)

        changes = llm_response_data.get("changes", [])
        requires_confirm = llm_response_data.get("requires_confirmation", False)

        # If confirmation is required, don't commit to DB yet; store as pending
        if requires_confirm:
            return {
                "conversation_id": conversation_id or "edit_session",
                "intent": "clarification",
                "assistant_message": llm_response_data.get("confirmation_prompt") or llm_response_data.get("response"),
                "changes": changes,
                "requires_confirmation": True,
                "confirmation_prompt": llm_response_data.get("confirmation_prompt"),
                "updated_profile": self._profile_to_dict(profile),
                "profile_completion": profile.profile_completion
            }

        # Apply changes with strict validation
        applied = self.apply_validated_changes(profile, changes, db)

        comp = self.calculate_completion(profile)
        profile.profile_completion = comp["completion_percentage"]
        db.commit()
        db.refresh(profile)

        resp_msg = llm_response_data.get("response")
        if not resp_msg:
            resp_msg = f"Profile successfully updated with {len(applied)} change(s)."

        return {
            "conversation_id": conversation_id or "edit_session",
            "intent": "profile_update",
            "assistant_message": resp_msg,
            "changes": applied,
            "requires_confirmation": False,
            "confirmation_prompt": None,
            "updated_profile": self._profile_to_dict(profile),
            "profile_completion": comp["completion_percentage"]
        }

    def apply_validated_changes(self, profile: UserProfile, changes: List[Dict[str, Any]], db: Session) -> List[Dict[str, Any]]:
        """
        Validates and applies changes strictly against schema whitelist (Section 22).
        """
        applied = []
        for ch in changes:
            f = ch.get("field")
            op = ch.get("operation", "set")
            val = ch.get("value")

            if f not in ALLOWED_PROFILE_FIELDS or op not in ALLOWED_OPERATIONS:
                continue

            if f in ["common_services", "online_activities", "common_communication_types"]:
                curr_list = list(getattr(profile, f) or [])
                items = val if isinstance(val, list) else [val]

                if op == "set":
                    setattr(profile, f, items)
                elif op == "add":
                    for it in items:
                        if it not in curr_list:
                            curr_list.append(it)
                    setattr(profile, f, curr_list)
                elif op == "remove":
                    for it in items:
                        curr_list = [x for x in curr_list if str(x).lower() != str(it).lower()]
                    setattr(profile, f, curr_list)
                applied.append(ch)

            elif f in ["banking_usage", "online_shopping", "work_email_usage"]:
                if isinstance(val, bool):
                    bool_val = val
                else:
                    bool_val = str(val).lower() in ["true", "yes", "enable", "1"]
                setattr(profile, f, bool_val)
                applied.append({"field": f, "operation": "set", "value": bool_val})

            elif f == "custom_information":
                cinfo = dict(profile.custom_information or {})
                if isinstance(val, dict):
                    cinfo.update(val)
                setattr(profile, f, cinfo)
                applied.append(ch)

            else:
                # String fields: role, industry, organization_type, security_awareness, etc.
                setattr(profile, f, str(val))
                applied.append({"field": f, "operation": "set", "value": str(val)})

        db.commit()
        return applied

    def _rule_based_nlp_update(self, text: str, profile: UserProfile) -> Dict[str, Any]:
        """
        Deterministic NLP rule parser for profile update instructions.
        """
        t = text.lower().strip()
        changes = []

        # Role updates
        for r in ["student", "software developer", "developer", "it professional", "employee", "business owner", "teacher", "security analyst"]:
            if f"role changed to {r}" in t or f"i'm now a {r}" in t or f"i am a {r}" in t or f"working as {r}" in t:
                changes.append({"field": "role", "operation": "set", "value": r.title()})
                break

        # Remove from services
        if "remove " in t and ("service" in t or "platform" in t or "from" in t):
            for s in ["instagram", "facebook", "twitter", "x", "github", "aws", "linkedin", "google", "microsoft", "slack"]:
                if f"remove {s}" in t:
                    changes.append({"field": "common_services", "operation": "remove", "value": s.capitalize()})

        # Add to services
        if "add " in t:
            for s in ["github", "aws", "gcp", "azure", "docker", "linkedin", "google", "slack", "teams", "instagram"]:
                if f"add {s}" in t or f"and {s}" in t:
                    changes.append({"field": "common_services", "operation": "add", "value": s.upper() if len(s) <= 4 else s.capitalize()})

        # Banking usage
        if "don't use banking" in t or "dont use banking" in t or "no banking" in t or "disable banking" in t:
            changes.append({"field": "banking_usage", "operation": "set", "value": False})
        elif "use banking" in t or "started using online banking" in t:
            changes.append({"field": "banking_usage", "operation": "set", "value": True})

        # Work email
        if "working remotely" in t or "use work email" in t:
            changes.append({"field": "work_email_usage", "operation": "set", "value": True})

        # Security awareness
        for tier in ["beginner", "intermediate", "advanced", "security professional"]:
            if f"awareness to {tier}" in t or f"experience to {tier}" in t:
                changes.append({"field": "security_awareness", "operation": "set", "value": tier.title()})
                break

        # Ambiguous check: "I don't really use banking" (Section 12)
        if "don't really use" in t or "not sure about" in t or "hardly use" in t:
            target_field = "banking_usage" if "banking" in t else ("online_shopping" if "shopping" in t else None)
            if target_field:
                changes = [{"field": target_field, "operation": "set", "value": False}]
                prompt_text = f"Would you like me to set your {target_field.replace('_', ' ')} to No?"
            else:
                prompt_text = "I noticed you mentioned this might not apply. Would you like me to update your profile settings accordingly?"
            return {
                "intent": "clarification",
                "changes": changes,
                "requires_confirmation": True,
                "confirmation_prompt": prompt_text,
                "response": prompt_text
            }


        return {
            "intent": "profile_update",
            "changes": changes,
            "requires_confirmation": False,
            "response": f"I've identified your request and updated your profile with {len(changes)} modification(s)."
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
