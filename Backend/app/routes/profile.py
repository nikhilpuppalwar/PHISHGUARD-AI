from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserProfile, ProfileConversation, ProfileHistory
from app.schemas.profile import (
    UserProfileBase, UserProfileUpdate, UserProfileOut, UserProfileFieldPatch,
    OnboardingStartResponse, OnboardingAnswerRequest, OnboardingAnswerResponse,
    ConversationalEditRequest, ConversationalEditResponse, ConfirmChangesRequest,
    ProfileCompletionOut, ProfileCompletenessDetailOut, ProfileHistoryOut,
    ProfileAssistantRequest, ProfileAssistantResponse, ProfileAssistantConfirmRequest,
    ConversationalTurnRequest, ConversationalTurnResponse
)
from app.routes.auth import get_current_user
from app.services.profiling_service import profiling_service, ALLOWED_PROFILE_FIELDS
from app.services.user_profile_rag import user_profile_rag

router = APIRouter(prefix="/profile", tags=["User Profile & Conversational AI"])

@router.get("", response_model=UserProfileOut)
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Fetch the authenticated user's complete profile with all digital behavior,
    security tier, and custom information.
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.user_id).first()
    if not profile:
        profile = UserProfile(
            user_id=current_user.user_id,
            preferred_name=current_user.email.split("@")[0].capitalize(),
            role="Student",
            common_services=["Google"],
            online_activities=["Education"],
            common_communication_types=["University Email"],
            security_awareness="Beginner",
            technical_experience="Intermediate",
            banking_usage=False,
            online_shopping=False,
            work_email_usage=False,
            preferred_explanation_style="Simple",
            profile_completion=30
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
        # Seed initial RAG memory
        user_profile_rag.sync_user_profile_memory(current_user.user_id, profile, db)
    
    # Recalculate completion score
    comp = profiling_service.calculate_completion(profile)
    if profile.profile_completion != comp["completion_percentage"]:
        profile.profile_completion = comp["completion_percentage"]
        db.commit()
        db.refresh(profile)
        
    return profile

@router.put("", response_model=UserProfileOut)
def update_profile(
    profile_in: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Manual profile update. Validates fields, updates DB, records history, and syncs RAG.
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.user_id).first()
    if not profile:
        profile = UserProfile(user_id=current_user.user_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    update_dict = profile_in.dict(exclude_unset=True)
    changes = []
    for field, val in update_dict.items():
        if field in ALLOWED_PROFILE_FIELDS and val is not None:
            changes.append({"field": field, "operation": "set", "value": val})

    profiling_service.apply_validated_changes(profile, changes, db, source="manual_edit")

    comp = profiling_service.calculate_completion(profile)
    profile.profile_completion = comp["completion_percentage"]
    profile.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(profile)

    user_profile_rag.sync_user_profile_memory(current_user.user_id, profile, db)
    return profile

@router.patch("", response_model=UserProfileOut)
def patch_profile(
    profile_in: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Partial profile update per Spec Section 26.
    """
    return update_profile(profile_in=profile_in, current_user=current_user, db=db)

@router.patch("/{field}", response_model=UserProfileOut)
def patch_profile_field(
    field: str,
    patch_in: UserProfileFieldPatch,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Individual field edit endpoint for granular [Edit] buttons on the Profile page.
    """
    if field not in ALLOWED_PROFILE_FIELDS:
        raise HTTPException(status_code=400, detail=f"Field '{field}' is not an editable profile field")

    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.user_id).first()
    if not profile:
        profile = UserProfile(user_id=current_user.user_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    changes = [{"field": field, "operation": "set", "value": patch_in.value}]
    profiling_service.apply_validated_changes(profile, changes, db, source="manual_edit")

    comp = profiling_service.calculate_completion(profile)
    profile.profile_completion = comp["completion_percentage"]
    profile.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(profile)

    user_profile_rag.sync_user_profile_memory(current_user.user_id, profile, db)
    return profile

@router.get("/completeness", response_model=ProfileCompletenessDetailOut)
def get_profile_completeness_breakdown(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Spec Section 15: Dimension-based profile completeness.
    Tracks Identity, Role, Communication, Activities, Services, Security Awareness, Explanation Preference, Threat Context.
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.user_id).first()
    if not profile:
        profile = UserProfile(user_id=current_user.user_id, role="Unspecified")
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return profiling_service.get_completeness_details(profile)

@router.get("/completion", response_model=ProfileCompletionOut)
def get_profile_completion(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Legacy completeness endpoint compatibility.
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.user_id).first()
    if not profile:
        return ProfileCompletionOut(
            completion_percentage=0,
            completed_fields=[],
            missing_fields=["role", "common_services", "online_activities", "security_awareness"],
            message="Your security profile is 0% complete."
        )

    res = profiling_service.calculate_completion(profile)
    return ProfileCompletionOut(
        completion_percentage=res["completion_percentage"],
        completed_fields=res["completed_fields"],
        missing_fields=res["missing_fields"],
        message=res["message"]
    )

@router.get("/history", response_model=List[ProfileHistoryOut])
def get_profile_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Spec Section 18 & 26: Returns lightweight meaningful profile change history.
    """
    entries = db.query(ProfileHistory).filter(
        ProfileHistory.user_id == current_user.user_id
    ).order_by(ProfileHistory.created_at.desc()).limit(50).all()

    return entries

# --- Dynamic Conversational Onboarding Endpoints ---

@router.post("/onboarding/start", response_model=OnboardingStartResponse)
def start_onboarding(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Spec Section 5, 26: Starts the dynamic conversational onboarding process.
    """
    res = profiling_service.start_onboarding(current_user.user_id, db)
    return OnboardingStartResponse(**res)

@router.post("/onboarding/message", response_model=OnboardingAnswerResponse)
@router.post("/onboarding/answer", response_model=OnboardingAnswerResponse)
def answer_onboarding(
    req: OnboardingAnswerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Spec Section 8, 9, 26: Accepts answer or conversational message,
    dynamically determines next question, and persists validated structured profile.
    """
    conv_id = req.conversation_id
    if not conv_id:
        conv = db.query(ProfileConversation).filter(
            ProfileConversation.user_id == current_user.user_id,
            ProfileConversation.conversation_type == "onboarding"
        ).order_by(ProfileConversation.created_at.desc()).first()
        conv_id = conv.conversation_id if conv else "default_onboarding"

    res = profiling_service.process_onboarding_answer(
        user_id=current_user.user_id,
        conversation_id=conv_id,
        field=req.field,
        answer=req.answer,
        custom_answer=req.custom_answer,
        message=req.message,
        db=db
    )
    return OnboardingAnswerResponse(**res)

# --- Conversational Profile Assistant ("Edit Profile with AI") ---

@router.post("/assistant", response_model=ProfileAssistantResponse)
@router.post("/conversation", response_model=ProfileAssistantResponse)
def conversational_edit_profile(
    req: ProfileAssistantRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Spec Section 13, 14, 21, 22, 26: Natural language profile assistant.
    Understands commands like "I changed my role to Software Developer", "Add AWS and GitHub to my services",
    "Remove Instagram", "I don't use online banking".
    Provides preview diff and confirmation for multi-item or ambiguous updates.
    """
    res = profiling_service.process_profile_assistant(
        user_id=current_user.user_id,
        message=req.message,
        conversation_id=req.conversation_id,
        db=db
    )
    return ProfileAssistantResponse(**res)

@router.post("/assistant/confirm")
@router.post("/conversation/confirm")
def confirm_conversational_changes(
    req: ProfileAssistantConfirmRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Spec Section 13, 23: Confirms and applies pending proposed changes from assistant preview.
    Synchronizes DB + User Profile RAG + ProfileHistory + UI state.
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    if not req.confirmed or not req.changes:
        return {
            "status": "cancelled",
            "message": "Changes were cancelled.",
            "profile": profiling_service._profile_to_dict(profile),
            "profile_completion": profile.profile_completion
        }

    applied = profiling_service.apply_validated_changes(
        profile,
        [c.dict() for c in req.changes],
        db,
        source="ai_assistant"
    )

    comp = profiling_service.calculate_completion(profile)
    profile.profile_completion = comp["completion_percentage"]
    profile.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(profile)

    # Sync User Profile RAG
    user_profile_rag.sync_user_profile_memory(current_user.user_id, profile, db)

    latest_hist = db.query(ProfileHistory).filter(ProfileHistory.user_id == current_user.user_id).order_by(ProfileHistory.created_at.desc()).first()

    return {
        "status": "confirmed",
        "message": f"Successfully applied {len(applied)} change(s) to your security profile.",
        "profile": profiling_service._profile_to_dict(profile),
        "profile_completion": profile.profile_completion,
        "history_entry": latest_hist.description if latest_hist else None
    }

# --- Legacy Compatibility Endpoint ---

@router.post("/conversational-turn", response_model=ConversationalTurnResponse)
def conversational_turn_legacy(
    req: ConversationalTurnRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Backward compatibility wrapper for legacy chat calls."""
    res = profiling_service.process_profile_assistant(
        user_id=current_user.user_id,
        message=req.message,
        conversation_id=None,
        db=db
    )
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.user_id).first()
    return ConversationalTurnResponse(
        assistant_message=res["assistant_message"],
        is_complete=False,
        step=2,
        total_steps=4,
        extracted_profile=profiling_service._profile_to_dict(profile) if profile else None,
        quick_suggestions=["Update Role", "Add Services", "Change Security Tier"]
    )
