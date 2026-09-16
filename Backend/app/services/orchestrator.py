import asyncio
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.user import User, UserProfile
from app.models.submission import Submission, AgentResult, CombinedEvidence
from app.models.assessment import RiskAssessment, Explanation, FinalResult
from app.models.meta import AttackType

from app.services.preprocessor import preprocess_single_input
from app.services.text_agent import text_agent
from app.services.url_agent import url_agent
from app.services.sender_agent import sender_agent
from app.services.rag_service import rag_service
from app.services.risk_engine import risk_engine
from app.services.explainability import explainability_engine
from app.services.genai_service import genai_service

executor = ThreadPoolExecutor(max_workers=4)

class AIOrchestrator:
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
        2. Execute Text, URL, and Sender agents in parallel.
        3. RAG incident vector retrieval.
        4. Bayesian Risk Fusion.
        5. Explainability Attribution.
        6. Personalized GenAI Guidance.
        7. Persist to Database.
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

        # 2. Parallel Agent Execution
        # Run text, url, and sender in parallel threads
        f_text = executor.submit(text_agent.analyze, cleaned_text)
        f_url = executor.submit(url_agent.analyze, urls)
        f_sender = executor.submit(sender_agent.analyze, sender, raw_input)

        res_text = f_text.result()
        res_url = f_url.result()
        res_sender = f_sender.result()

        # 3. Phishing / Incident RAG Retrieval
        res_rag = rag_service.retrieve_similar_incident(cleaned_text, urls, db)

        # 4. Bayesian Risk AI Fusion
        risk_summary = risk_engine.compute_risk(res_text, res_url, res_sender, res_rag)

        # 5. Explainable AI SHAP Attribution
        xai_summary = explainability_engine.compute_contributions(
            risk_summary["overall_score"],
            res_text,
            res_url,
            res_sender,
            res_rag
        )

        # 6. User Context & Personalized GenAI Guidance (Profile Memory Integration)
        user_profile = db.query(UserProfile).filter(UserProfile.user_id == user.user_id).first()
        user_role = user_profile.role if user_profile else "Student"
        user_awareness = user_profile.security_awareness if user_profile else "Beginner"
        user_prof_dict = {
            "role": user_role,
            "common_services": user_profile.common_services if user_profile else [],
            "online_activities": user_profile.online_activities if user_profile else [],
            "security_awareness": user_awareness,
            "technical_experience": user_profile.technical_experience if user_profile else "Intermediate"
        } if user_profile else None

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



        # 7. Database Persistence
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
            rag_context=[res_rag] if res_rag else []
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
            rag_evidence=[res_rag] if res_rag else [],
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

        # Format complete API response
        return {
            "submission_id": submission.submission_id,
            "submitted_at": submission.submitted_at,
            "channel": channel,
            "sender": sender,
            "extracted_urls": urls,
            "overall_score": risk_summary["overall_score"],
            "severity": risk_summary["severity"],
            "confidence": risk_summary["confidence"],
            "attack_type": genai_out["attack_type"],
            "attack_type_id": attack_type_id,
            "attack_type_description": genai_out["attack_type_description"],
            "agent_contributions": xai_summary["contributions"],
            "agent_details": xai_summary["agent_details"],
            "major_indicators": xai_summary["all_indicators"],
            "similar_incident": res_rag,
            "explanation": genai_out["explanation"],
            "action_plan": genai_out["action_plan"],
            "user_role_context": user_role,
            "user_feedback_state": None
        }

orchestrator = AIOrchestrator()
