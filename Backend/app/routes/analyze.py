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
    AnalysisResponse, SimilarIncidentDetail, ThreatIntelStatusResponse, ThreatIntelCheckRequest
)
from app.routes.auth import get_current_user
from app.services.preprocessor import preprocess_single_input
from app.services.orchestrator import orchestrator
from app.services.url_threat_intelligence import url_threat_intelligence_coordinator
from app.database_mongo import mongo_db

router = APIRouter(prefix="", tags=["Analysis Engine"])

@router.get("/threat-intel/status", response_model=ThreatIntelStatusResponse)
def get_threat_intel_status():
    """
    Returns operational availability status of external intelligence providers (Spec §20).
    """
    return url_threat_intelligence_coordinator.get_provider_status()

@router.post("/threat-intel/check")
def check_single_url_threat_intel(
    req: ThreatIntelCheckRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Direct external URL intelligence check endpoint with MongoDB caching (Spec §19).
    """
    return url_threat_intelligence_coordinator.fetch_url_threat_intelligence(
        raw_url=req.url,
        user_id=current_user.user_id
    )

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

    # Retrieve full incident document from MongoDB if available
    mongo_incident = mongo_db.get_incident_metadata(submission_id)

    # Retrieve external threat intel if available from MongoDB
    ext_intel = None
    if submission.extracted_urls and len(submission.extracted_urls) > 0:
        first_url = submission.extracted_urls[0]
        norm_u = url_threat_intelligence_coordinator.normalize_url(first_url)
        u_hash = url_threat_intelligence_coordinator.hash_url(norm_u)
        cached_doc = mongo_db.get_cached_threat_check(u_hash, max_age_hours=720)
        if cached_doc:
            ext_intel = {
                "cached": True,
                "checked_at": cached_doc.get("checked_at", ""),
                "google_safe_browsing": cached_doc.get("google_safe_browsing", {}),
                "virustotal": cached_doc.get("virustotal", {}),
                "combined_reputation": cached_doc.get("combined_reputation", "UNKNOWN")
            }
    if not ext_intel and mongo_incident:
        ext_intel = mongo_incident.get("external_intelligence")

    original_text = mongo_incident.get("original_content", submission.raw_text) if mongo_incident else submission.raw_text

    return AnalysisResponse(
        submission_id=submission.submission_id,
        submitted_at=submission.submitted_at,
        original_content=original_text,
        channel=submission.channel,
        sender=submission.sender,
        subject=submission.subject,
        extracted_urls=submission.extracted_urls or [],
        overall_score=risk.overall_score if risk else 0.0,
        base_score=(mongo_incident.get("risk", {}).get("base_score", risk.overall_score) if mongo_incident else (risk.overall_score if risk else 0.0)),
        personalized_score=(mongo_incident.get("risk", {}).get("personalized_score", risk.overall_score) if mongo_incident else (risk.overall_score if risk else 0.0)),
        profile_relevance=(mongo_incident.get("risk", {}).get("profile_relevance", "MODERATE") if mongo_incident else "MODERATE"),
        severity=risk.severity if risk else "Low Risk",
        confidence=risk.confidence if risk else 0.8,
        attack_type=attack_type_name,
        attack_type_id=final.attack_type_id if final else None,
        attack_type_description=attack_type_desc,
        attack_classification=mongo_incident.get("attack_classification") if mongo_incident else None,
        agent_contributions=expl.agent_contribution if expl else {"url": 40.0, "text": 35.0, "sender": 15.0, "rag": 10.0},
        agent_details=agent_details,
        explainability_details=mongo_incident.get("explainability") if mongo_incident else None,
        major_indicators=expl.detected_indicators if expl else [],
        similar_incident=similar_inc,
        what_changed=mongo_incident.get("rag_results", {}).get("what_changed") if (mongo_incident and mongo_incident.get("rag_results")) else None,
        explanation=final.explanation_text if final else (expl.human_readable_text if expl else ""),
        action_plan=final.action_plan if final else [],
        personalized_recommendations=((mongo_incident.get("genai", {}).get("personalized_recommendations") or mongo_incident.get("generated_report", {}).get("personalized_recommendations")) if mongo_incident else []),
        genai_output=(mongo_incident.get("genai") if mongo_incident else None),
        personalization_context=mongo_incident.get("personalization") if mongo_incident else None,
        why_this_matters=mongo_incident.get("generated_report", {}).get("why_this_matters") if mongo_incident else None,
        before_you_act=mongo_incident.get("generated_report", {}).get("before_you_act") if mongo_incident else None,
        user_role_context=profile.role if profile else "Student",
        user_feedback_state=feed.verdict if feed else None,
        evidence_coverage=mongo_incident.get("evidence_coverage") if mongo_incident else None,
        agent_trace=mongo_incident.get("agent_trace") if mongo_incident else None,
        external_threat_intel=ext_intel,
        url_evidence=mongo_incident.get("agent_results", {}).get("url", {}).get("evidence_object") if mongo_incident else None,
        text_evidence=mongo_incident.get("agent_results", {}).get("text", {}).get("evidence_object") if mongo_incident else None,
        sender_evidence=mongo_incident.get("agent_results", {}).get("sender", {}).get("evidence_object") if mongo_incident else None
    )
