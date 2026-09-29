import asyncio
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session

from app.models.user import User, UserProfile
from app.models.submission import Submission, AgentResult, CombinedEvidence
from app.models.assessment import RiskAssessment, Explanation, FinalResult
from app.models.meta import AttackType
from app.database_mongo import mongo_db

from app.services.preprocessor import preprocess_single_input
from app.services.text_agent import text_agent
from app.services.url_agent import url_agent
from app.services.sender_agent import sender_agent
from app.services.rag_service import rag_service
from app.services.user_profile_rag import user_profile_rag
from app.services.risk_engine import risk_engine
from app.services.explainability import explainability_engine
from app.services.genai_service import genai_service
from app.services.llm_gateway import llm_service
from app.prompts.templates import ORCHESTRATOR_SYSTEM_PROMPT, ORCHESTRATOR_USER_TEMPLATE, wrap_untrusted

executor = ThreadPoolExecutor(max_workers=4)

ALLOWED_AGENTS = {"text_agent", "url_agent", "sender_agent"}

class AIOrchestrator:
    def route_agents(self,
                     db: Session,
                     cleaned_text: str,
                     urls: List[str],
                     sender: Optional[str],
                     channel: str,
                     subject: Optional[str]) -> List[str]:
        """
        LLM-assisted Agent Dispatch:
        Analyzes the payload and determines which agents are required.
        Strictly validated against allow-list: ['text_agent', 'url_agent', 'sender_agent'].
        Falls back safely to heuristic routing if LLM is unavailable.
        """
        try:
            prompt = ORCHESTRATOR_USER_TEMPLATE.format(
                channel=channel,
                urls=", ".join(urls) if urls else "None",
                sender=sender or "None",
                subject=subject or "None",
                untrusted_content=wrap_untrusted(cleaned_text[:1000], "INBOUND PAYLOAD")
            )
            llm_res = llm_service.generate_structured(
                db=db,
                prompt=prompt,
                system_prompt=ORCHESTRATOR_SYSTEM_PROMPT
            )
            if llm_res and isinstance(llm_res, dict):
                raw_agents = llm_res.get("agents", [])
                if isinstance(raw_agents, list):
                    validated = [a for a in raw_agents if a in ALLOWED_AGENTS]
                    if validated:
                        # Safety check: if URLs exist, always ensure url_agent is active
                        if urls and "url_agent" not in validated:
                            validated.append("url_agent")
                        # Safety check: if sender exists, always ensure sender_agent is active
                        if sender and "sender_agent" not in validated:
                            validated.append("sender_agent")
                        if "text_agent" not in validated:
                            validated.insert(0, "text_agent")
                        return validated
        except Exception as e:
            print(f"AI Orchestrator LLM routing warning (falling back to rule routing): {e}")

        # Heuristic Fallback Routing
        selected = ["text_agent"]
        if urls and len(urls) > 0:
            selected.append("url_agent")
        if sender or channel == "email":
            selected.append("sender_agent")
        return selected

    def execute_pipeline(self,
                         db: Session,
                         user: User,
                         raw_input: str,
                         channel_override: Optional[str] = None,
                         sender_override: Optional[str] = None,
                         subject_override: Optional[str] = None) -> Dict[str, Any]:
        """
        End-to-End Multi-Agent Threat Pipeline:
        1. Preprocess & auto-extract signals from unified single input.
        2. LLM Dynamic Agent Routing (restricted to allow-list).
        3. Execute Text Agent (LLM + ML), URL Agent (XGBoost), and Sender Agent (Random Forest).
        4. RAG incident vector retrieval.
        5. Bayesian Risk Fusion.
        6. Explainability Attribution.
        7. Personalized GenAI Guidance.
        8. Persist to Database.
        """
        # 1. Preprocessing
        prep = preprocess_single_input(
            raw_input=raw_input,
            channel_override=channel_override,
            sender_override=sender_override,
            subject_override=subject_override
        )

        cleaned_text = prep["cleaned_text"]
        urls = prep["extracted_urls"]
        sender = prep["sender"]
        channel = prep["channel"]
        subject = prep["subject"]

        # 2. Dynamic LLM Agent Routing
        selected_agents = self.route_agents(
            db=db,
            cleaned_text=cleaned_text,
            urls=urls,
            sender=sender,
            channel=channel,
            subject=subject
        )

        # 3. Parallel Agent Execution
        futures = {}
        if "text_agent" in selected_agents:
            futures["text"] = executor.submit(text_agent.analyze, cleaned_text, db)
        if "url_agent" in selected_agents:
            futures["url"] = executor.submit(url_agent.analyze, urls, user.user_id if user else None)
        if "sender_agent" in selected_agents:
            # Preserves Random Forest Classifier
            futures["sender"] = executor.submit(sender_agent.analyze, sender, raw_input)

        # Resolve or fill default inactive states
        res_text = futures["text"].result() if "text" in futures else {
            "agent_type": "text", "risk_score": 0.0, "model_probability": 0.0,
            "indicators": [], "signals": [], "summary": "Text Agent bypassed.", "model_name": text_agent.algorithm
        }
        res_url = futures["url"].result() if "url" in futures else {
            "agent_type": "url", "risk_score": 0.0, "model_probability": 0.0,
            "indicators": [], "summary": "URL Agent bypassed (no embedded links detected).", "model_name": url_agent.algorithm,
            "evidence_object": None, "external_threat_intel": None, "structural_analysis": None
        }
        res_sender = futures["sender"].result() if "sender" in futures else {
            "agent_type": "sender", "risk_score": 0.0, "model_probability": 0.0,
            "indicators": [], "summary": "Sender Agent bypassed (no sender header present).", "model_name": sender_agent.algorithm
        }

        # 3. Phishing / Incident RAG Retrieval
        res_rag = rag_service.retrieve_similar_incident(cleaned_text, urls, db)

        # 4. User Profile RAG Retrieval & Context (Spec §19, §20, §30, §32)
        # Separate User Profile RAG from Incident RAG: retrieves relevant profile context for this specific threat input
        profile_context = user_profile_rag.retrieve_relevant_user_context(
            user_id=user.user_id,
            query_text=cleaned_text,
            urls=urls,
            sender=sender,
            db=db
        )
        user_role = profile_context["role"]
        user_awareness = profile_context["security_awareness"]
        user_profile = db.query(UserProfile).filter(UserProfile.user_id == user.user_id).first()
        user_prof_dict = {
            "role": user_role,
            "common_services": user_profile.common_services if user_profile else [],
            "online_activities": user_profile.online_activities if user_profile else [],
            "security_awareness": user_awareness,
            "technical_experience": user_profile.technical_experience if user_profile else "Intermediate",
            "preferred_explanation_style": profile_context.get("explanation_style", "Simple"),
            "relevant_snippets": profile_context.get("relevant_snippets", []),
            "matched_services": profile_context.get("matched_services", []),
            "formatted_context": profile_context.get("formatted_for_prompt", "")
        } if user_profile else None

        # 5. Bayesian Risk AI Fusion (passes user_profile for calibrated relevance)
        risk_summary = risk_engine.compute_risk(res_text, res_url, res_sender, res_rag, user_profile=user_prof_dict)

        # 6. Explainable AI SHAP Attribution
        xai_summary = explainability_engine.compute_contributions(
            risk_summary["overall_score"],
            res_text,
            res_url,
            res_sender,
            res_rag
        )

        # 7. Personalized GenAI Guidance (Spec §19, §20, §30, §32)
        genai_out = genai_service.generate_explanation_and_action_plan(
            raw_text=raw_input,
            risk_assessment=risk_summary,
            agent_details=xai_summary["agent_details"],
            similar_incident=res_rag,
            user_role=user_role,
            security_awareness=user_awareness,
            user_profile=user_prof_dict,
            db=db
        )

        # 8. Evidence Coverage Matrix (6 Dimensions - Spec §14)
        evidence_coverage = {
            "text_analysis": {
                "dimension": "Text Content Analysis (TF-IDF + Logistic Regression)",
                "status": "Evaluated",
                "detail": f"Model probability: {round(res_text.get('model_probability', 0)*100, 1)}% ({res_text.get('confidence', 'HIGH')} confidence)",
                "active": True
            },
            "url_analysis": {
                "dimension": "URL Structural & Feature Analysis (XGBoost ML)",
                "status": "Evaluated" if urls else "Not Applicable (No URLs)",
                "detail": f"{len(urls)} link(s) extracted and evaluated" if urls else "No embedded links detected in submission",
                "active": bool(urls)
            },
            "sender_authentication": {
                "dimension": "Sender & Header Authentication",
                "status": "Evaluated" if sender else "Headers Absent",
                "detail": f"Evaluated for {sender}" if sender else "No RFC headers provided in raw text",
                "active": bool(sender)
            },
            "external_threat_intel": {
                "dimension": "External Threat Intelligence (GSB & VirusTotal)",
                "status": "Evaluated" if (urls and res_url.get("external_threat_intel")) else "Not Applicable",
                "detail": "Live API lookup performed against global threat feeds" if (urls and res_url.get("external_threat_intel")) else "No external URLs to verify against threat databases",
                "active": bool(urls and res_url.get("external_threat_intel"))
            },
            "incident_memory_rag": {
                "dimension": "Incident Memory RAG (Historical Vector Similarity)",
                "status": "Match Found" if (res_rag and res_rag.get("has_match")) else "No Match",
                "detail": f"Found similar incident '{res_rag.get('title')}' ({round(res_rag.get('similarity', 0)*100)}% match)" if (res_rag and res_rag.get("has_match")) else "No historical incident exceeded the 0.55 similarity threshold",
                "active": True
            },
            "user_profile_context": {
                "dimension": "Personalized Profile Context",
                "status": "Active" if user_prof_dict else "Default Profile",
                "detail": f"Role: {user_role}, Awareness: {user_awareness}" if user_prof_dict else "Standard baseline user profile applied",
                "active": True
            }
        }

        # 9. Pipeline Execution Trace (11 stages - Spec §13 & §18)
        now_iso = datetime.utcnow().isoformat()
        agent_trace = [
            {
                "stage": 1,
                "name": "Input Ingestion & Extraction",
                "agent": "Orchestrator Preprocessor",
                "status": "COMPLETED",
                "summary": f"Detected {channel.upper()} channel with {len(urls)} embedded URL(s) and sender '{sender or 'Anonymous'}'.",
                "timestamp": now_iso
            },
            {
                "stage": 2,
                "name": "Text Agent NLP & ML Inference",
                "agent": "Text Agent (TF-IDF + Logistic Regression)",
                "status": "COMPLETED",
                "summary": f"Inference probability {round(res_text.get('model_probability', 0)*100, 1)}% ({res_text.get('confidence', 'HIGH')} confidence); {len(res_text.get('indicators', []))} lexical indicators detected.",
                "timestamp": now_iso
            },
            {
                "stage": 3,
                "name": "URL Agent Extraction & XGBoost Analysis",
                "agent": "URL Agent (PhiUSIIL XGBoost 14f)",
                "status": "COMPLETED" if urls else "BYPASSED",
                "summary": f"Analyzed {len(urls)} link(s); probability {round(res_url.get('model_probability', 0)*100, 1)}%." if urls else "No embedded hyperlinks found; structural URL analysis bypassed.",
                "timestamp": now_iso
            },
            {
                "stage": 4,
                "name": "External Threat Intelligence",
                "agent": "Threat Intelligence Coordinator (GSB + VirusTotal)",
                "status": "COMPLETED" if (urls and res_url.get("external_threat_intel")) else "SKIPPED",
                "summary": f"Evaluated against Google Safe Browsing and VirusTotal databases." if (urls and res_url.get("external_threat_intel")) else "No external URLs present to query global threat feeds.",
                "timestamp": now_iso
            },
            {
                "stage": 5,
                "name": "Sender Agent Authentication & Spoof Check",
                "agent": "Sender Agent (Random Forest / Header Verification)",
                "status": "COMPLETED" if sender else "INCOMPLETE_HEADERS",
                "summary": f"Analyzed sender '{sender}'. Missing SPF/DKIM/DMARC headers recorded as 'Not provided'." if sender else "Sender headers not present in submission.",
                "timestamp": now_iso
            },
            {
                "stage": 6,
                "name": "Incident Memory RAG Retrieval",
                "agent": "Incident RAG Service (ChromaDB)",
                "status": "MATCH_FOUND" if (res_rag and res_rag.get("has_match")) else "NO_MATCH",
                "summary": f"Retrieved incident '{res_rag.get('title')}' with {round(res_rag.get('similarity', 0)*100, 1)}% vector similarity." if (res_rag and res_rag.get("has_match")) else "No past incidents exceeded the 0.55 similarity threshold.",
                "timestamp": now_iso
            },
            {
                "stage": 7,
                "name": "User Profile Context Matching",
                "agent": "User Profile RAG & Personalization Engine",
                "status": "COMPLETED",
                "summary": f"Retrieved authenticated profile: Role '{user_role}', Awareness '{user_awareness}'.",
                "timestamp": now_iso
            },
            {
                "stage": 8,
                "name": "Bayesian Evidence Fusion",
                "agent": "Bayesian Risk Fusion Engine",
                "status": "COMPLETED",
                "summary": f"Synthesized multi-agent evidence: Base Score {risk_summary.get('base_score', risk_summary['overall_score'])}, Severity {risk_summary['severity']}.",
                "timestamp": now_iso
            },
            {
                "stage": 9,
                "name": "Evidence-Aware Attack Classification",
                "agent": "Attack Classification Engine",
                "status": "COMPLETED",
                "summary": f"Classified as '{genai_out['attack_type']}' strictly matching evidence and risk thresholds.",
                "timestamp": now_iso
            },
            {
                "stage": 10,
                "name": "Explainable AI (XAI) Attribution",
                "agent": "Explainable AI Engine (SHAP-inspired)",
                "status": "COMPLETED",
                "summary": f"Derived relative agent contributions: Text {xai_summary['contributions'].get('text', 0)}%, URL {xai_summary['contributions'].get('url', 0)}%, Sender {xai_summary['contributions'].get('sender', 0)}%, RAG {xai_summary['contributions'].get('rag', 0)}%.",
                "timestamp": now_iso
            },
            {
                "stage": 11,
                "name": "Generative AI Explanation & Dynamic Action Plan",
                "agent": "Personalized GenAI Service",
                "status": "COMPLETED",
                "summary": f"Generated forensic rationale, contextual threat guidance, and {len(genai_out.get('action_plan', []))} personalized action steps.",
                "timestamp": now_iso
            }
        ]

        # 10. Database Persistence
        # A. Create Submission
        submission = Submission(
            user_id=user.user_id,
            channel=channel,
            raw_text=raw_input,
            sender=sender,
            subject=subject,
            extracted_urls=urls,
            submitted_at=datetime.utcnow()
        )
        db.add(submission)
        db.flush()

        # B. Create Agent Results
        ar_text = AgentResult(
            submission_id=submission.submission_id,
            agent_type="text",
            risk_score=res_text["risk_score"],
            indicators=res_text["indicators"],
            model_probability=res_text["model_probability"],
            model_id="mod_tfidf_lr_v2"
        )
        ar_url = AgentResult(
            submission_id=submission.submission_id,
            agent_type="url",
            risk_score=res_url["risk_score"],
            indicators=res_url["indicators"],
            model_probability=res_url["model_probability"],
            model_id="mod_xgboost_phiusiil_v2"
        )
        ar_sender = AgentResult(
            submission_id=submission.submission_id,
            agent_type="sender",
            risk_score=res_sender["risk_score"],
            indicators=res_sender["indicators"],
            model_probability=res_sender["model_probability"],
            model_id="mod_random_forest_sender_v2"
        )
        db.add_all([ar_text, ar_url, ar_sender])
        db.flush()

        # C. Create Combined Evidence
        comb_evidence = CombinedEvidence(
            submission_id=submission.submission_id,
            text_result_id=ar_text.result_id,
            url_result_id=ar_url.result_id,
            sender_result_id=ar_sender.result_id,
            rag_context=[res_rag] if (res_rag and res_rag.get("has_match")) else []
        )
        db.add(comb_evidence)

        # D. Create Risk Assessment
        risk_assess = RiskAssessment(
            submission_id=submission.submission_id,
            overall_score=risk_summary["overall_score"],
            severity=risk_summary["severity"],
            confidence=risk_summary["confidence"],
            risk_factors=risk_summary["risk_factors"]
        )
        db.add(risk_assess)
        db.flush()

        # E. Create Explanation
        expl = Explanation(
            submission_id=submission.submission_id,
            agent_contribution=xai_summary["contributions"],
            detected_indicators=xai_summary["all_indicators"],
            rag_evidence=[res_rag] if (res_rag and res_rag.get("has_match")) else [],
            risk_factors=risk_summary["risk_factors"],
            human_readable_text=genai_out["explanation"]
        )
        db.add(expl)
        db.flush()

        # F. Find/Link Attack Type
        attack_type_obj = db.query(AttackType).filter(AttackType.name == genai_out["attack_type"]).first()
        attack_type_id = attack_type_obj.attack_type_id if attack_type_obj else None

        # G. Create Final Result
        final_res = FinalResult(
            submission_id=submission.submission_id,
            risk_id=risk_assess.risk_id,
            explanation_id=expl.explanation_id,
            attack_type_id=attack_type_id,
            explanation_text=genai_out["explanation"],
            action_plan=genai_out["action_plan"],
            llm_provider=genai_out["llm_provider"],
            llm_model=genai_out["llm_model"]
        )
        db.add(final_res)
        db.commit()
        db.refresh(submission)

        # MongoDB Persistence (Spec §16: Persist complete incident document into collection 'incidents')
        incident_mongo_doc = {
            "submission_id": submission.submission_id,
            "user_id": str(user.user_id) if user else "anonymous",
            "original_content": raw_input,
            "channel": channel,
            "sender": sender,
            "subject": subject,
            "extracted_urls": urls,
            "agent_results": {
                "text": res_text,
                "url": res_url,
                "sender": res_sender
            },
            "rag_results": res_rag,
            "external_intelligence": res_url.get("external_threat_intel"),
            "risk": {
                "base_score": risk_summary.get("base_score", risk_summary["overall_score"]),
                "personalized_score": risk_summary.get("personalized_score", risk_summary["overall_score"]),
                "severity": risk_summary["severity"],
                "confidence": risk_summary["confidence"],
                "risk_factors": risk_summary["risk_factors"],
                "profile_relevance": risk_summary.get("profile_relevance", "MODERATE")
            },
            "attack_classification": genai_out.get("attack_classification"),
            "explainability": genai_out.get("explainability_details"),
            "personalization": genai_out.get("personalization_context"),
            "genai": {
                "explanation": genai_out.get("explainability_details"),
                "action_plan": genai_out.get("action_plan", []),
                "personalized_recommendations": genai_out.get("personalized_recommendations", [])
            },
            "generated_report": {
                "explanation": genai_out["explanation"],
                "action_plan": genai_out["action_plan"],
                "personalized_recommendations": genai_out.get("personalized_recommendations", []),
                "why_this_matters": genai_out.get("why_this_matters"),
                "before_you_act": genai_out.get("before_you_act")
            },
            "evidence_coverage": evidence_coverage,
            "agent_trace": agent_trace,
            "user_feedback": None,
            "created_at": submission.submitted_at.isoformat() if hasattr(submission.submitted_at, "isoformat") else str(submission.submitted_at)
        }
        mongo_db.record_incident_metadata(incident_mongo_doc)

        # Spec §4: Update/Persist complete document in MongoDB url_threat_checks collection
        if res_url.get("evidence_object"):
            ev = res_url["evidence_object"]
            mongo_doc = {
                "user_id": str(user.user_id) if user else "anonymous",
                "url_hash": ev.get("url_hash", ""),
                "normalized_url": ev.get("normalized_url", ""),
                "checked_at": ev.get("external_intelligence", {}).get("checked_at", datetime.utcnow().isoformat()),
                "internal_analysis": {
                    "xgboost_score": ev.get("ml_analysis", {}).get("phishing_probability", 0.0),
                    "structural_features": ev.get("structural_analysis", {})
                },
                "google_safe_browsing": ev.get("external_intelligence", {}).get("google_safe_browsing", {}),
                "virustotal": ev.get("external_intelligence", {}).get("virustotal", {}),
                "agent_reasoning": ev.get("llm_analysis", {}).get("reasoning", ""),
                "risk_result": {
                    "score": risk_summary["overall_score"],
                    "level": risk_summary["severity"]
                }
            }
            mongo_db.save_threat_check(mongo_doc)

        # Format complete API response (Spec §18)
        return {
            "submission_id": submission.submission_id,
            "submitted_at": submission.submitted_at,
            "original_content": raw_input,
            "channel": channel,
            "sender": sender,
            "subject": subject,
            "extracted_urls": urls,
            "overall_score": risk_summary["overall_score"],
            "base_score": risk_summary.get("base_score", risk_summary["overall_score"]),
            "personalized_score": risk_summary.get("personalized_score", risk_summary["overall_score"]),
            "profile_relevance": risk_summary.get("profile_relevance", "MODERATE"),
            "severity": risk_summary["severity"],
            "confidence": risk_summary["confidence"],
            "attack_type": genai_out["attack_type"],
            "attack_type_id": attack_type_id,
            "attack_type_description": genai_out["attack_type_description"],
            "attack_classification": genai_out.get("attack_classification"),
            "agent_contributions": xai_summary["contributions"],
            "agent_details": xai_summary["agent_details"],
            "major_indicators": xai_summary["all_indicators"],
            "similar_incident": res_rag if (res_rag and res_rag.get("has_match")) else None,
            "what_changed": res_rag.get("what_changed") if res_rag else None,
            "explanation": genai_out["explanation"],
            "explainability_details": genai_out.get("explainability_details"),
            "action_plan": genai_out["action_plan"],
            "personalized_recommendations": genai_out.get("personalized_recommendations", []),
            "genai_output": {
                "explanation": genai_out.get("explainability_details"),
                "action_plan": genai_out.get("action_plan", []),
                "personalized_recommendations": genai_out.get("personalized_recommendations", []),
                "why_this_matters": genai_out.get("why_this_matters")
            },
            "personalization_context": genai_out.get("personalization_context"),
            "why_this_matters": genai_out.get("why_this_matters"),
            "before_you_act": genai_out.get("before_you_act"),
            "evidence_coverage": evidence_coverage,
            "agent_trace": agent_trace,
            "user_role_context": user_role,
            "user_feedback_state": None,
            "external_threat_intel": res_url.get("external_threat_intel"),
            "url_evidence": res_url.get("evidence_object"),
            "text_evidence": res_text.get("evidence_object"),
            "sender_evidence": res_sender.get("evidence_object")
        }

orchestrator = AIOrchestrator()
