from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserProfile
from app.models.submission import Submission, AgentResult, CombinedEvidence
from app.models.assessment import RiskAssessment, Explanation, FinalResult
from app.models.meta import AttackType, Feedback
from app.schemas.analysis import (
    UnifiedAnalyzeRequest, AutoExtractPreviewRequest, AutoExtractPreviewResponse,
    AnalysisResponse, SimilarIncidentDetail
)
from app.routes.auth import get_current_user
from app.services.preprocessor import preprocess_single_input
from app.services.orchestrator import orchestrator

router = APIRouter(prefix="", tags=["Analysis Engine"])

@router.post("/analyze/preview-extract", response_model=AutoExtractPreviewResponse)
def preview_extract(req: AutoExtractPreviewRequest):
    """
    Real-time preview endpoint:
    Automatically parses the single unified text input and returns detected channel,
    cleaned text, extracted URLs, sender, subject, and heuristic flags.
    """
    prep = preprocess_single_input(req.raw_input)
    return AutoExtractPreviewResponse(
        detected_channel=prep["channel"],
        cleaned_text=prep["cleaned_text"],
        extracted_urls=prep["extracted_urls"],
        extracted_sender=prep["sender"],
        extracted_subject=prep["subject"],
        extracted_keywords=prep["keywords"]
    )

@router.post("/analyze", response_model=AnalysisResponse)
def run_analysis(
    req: UnifiedAnalyzeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Unified Multi-Agent Threat Pipeline:
    Dispatches Text Agent (TF-IDF + LR), URL Agent (PhiUSIIL XGBoost),
    and Sender Agent (Random Forest) in parallel, retrieves RAG context,
    computes Bayesian risk score, SHAP deltas, and personalized guidance.
    """
    if not req.raw_input or len(req.raw_input.strip()) == 0:
        raise HTTPException(status_code=400, detail="Input text cannot be empty")

    result = orchestrator.execute_pipeline(
        db=db,
        user=current_user,
        raw_input=req.raw_input,
        channel_override=req.channel_override,
        sender_override=req.sender_override,
        subject_override=req.subject_override
    )
    return result

@router.get("/analysis/{submission_id}", response_model=AnalysisResponse)
def get_analysis_by_id(
    submission_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    submission = db.query(Submission).filter(
        Submission.submission_id == submission_id,
        Submission.user_id == current_user.user_id
    ).first()

    if not submission:
        raise HTTPException(status_code=404, detail="Analysis result not found")

    risk = submission.risk_assessment
    expl = submission.explanation
    final = submission.final_result
    feed = db.query(Feedback).filter(Feedback.submission_id == submission_id).first()

    # Reconstruct agent details
    agent_details = {}
    for ar in submission.agent_results:
        agent_details[ar.agent_type] = {
            "agent_type": ar.agent_type,
            "risk_score": ar.risk_score,
            "model_probability": ar.model_probability,
            "delta": round((expl.agent_contribution.get(ar.agent_type, 25.0) / 100.0) * (risk.overall_score / 100.0), 2) if expl else 0.0,
            "indicators": ar.indicators,
            "summary": f"Analyzed {ar.agent_type} evidence signals.",
            "model_name": "XGBoost" if ar.agent_type == "url" else ("Random Forest" if ar.agent_type == "sender" else "TF-IDF + Logistic Regression")
        }

    # Similar incident from RAG context
    similar_inc = None
    if expl and expl.rag_evidence and len(expl.rag_evidence) > 0:
        first_rag = expl.rag_evidence[0]
        if first_rag:
            similar_inc = SimilarIncidentDetail(
                title=first_rag.get("title", "Similar Threat Vector"),
                similarity=first_rag.get("similarity", 0.85),
                content_summary=first_rag.get("content_summary", ""),
                attack_type=first_rag.get("attack_type", "Phishing"),
                indicators=first_rag.get("indicators", [])
            )

    attack_type_name = final.attack_type.name if (final and final.attack_type) else "Generic Phishing"
    attack_type_desc = final.attack_type.description if (final and final.attack_type) else None

    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.user_id).first()

    return AnalysisResponse(
        submission_id=submission.submission_id,
        submitted_at=submission.submitted_at,
        channel=submission.channel,
        sender=submission.sender,
        extracted_urls=submission.extracted_urls or [],
        overall_score=risk.overall_score if risk else 0.0,
        severity=risk.severity if risk else "Low Risk",
        confidence=risk.confidence if risk else 0.8,
        attack_type=attack_type_name,
        attack_type_id=final.attack_type_id if final else None,
        attack_type_description=attack_type_desc,
        agent_contributions=expl.agent_contribution if expl else {"url": 40.0, "text": 35.0, "sender": 15.0, "rag": 10.0},
        agent_details=agent_details,
        major_indicators=expl.detected_indicators if expl else [],
        similar_incident=similar_inc,
        explanation=final.explanation_text if final else (expl.human_readable_text if expl else ""),
        action_plan=final.action_plan if final else [],
        user_role_context=profile.role if profile else "Student",
        user_feedback_state=feed.verdict if feed else None
    )
