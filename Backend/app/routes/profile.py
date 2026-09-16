from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserProfile, ProfileConversation
from app.schemas.profile import (
    UserProfileBase, UserProfileUpdate, UserProfileOut, UserProfileFieldPatch,
    OnboardingStartResponse, OnboardingAnswerRequest, OnboardingAnswerResponse,
    ConversationalEditRequest, ConversationalEditResponse, ConfirmChangesRequest,
    ProfileCompletionOut, ConversationalTurnRequest, ConversationalTurnResponse
)
from app.routes.auth import get_current_user
from app.services.profiling_service import profiling_service, ALLOWED_PROFILE_FIELDS

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
    Section 9: Manual Profile Editing. Updates structured user profile.
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.user_id).first()
    if not profile:
        profile = UserProfile(user_id=current_user.user_id)
        db.add(profile)

    update_dict = profile_in.dict(exclude_unset=True)
    for field, val in update_dict.items():
        if field in ALLOWED_PROFILE_FIELDS and val is not None:
            setattr(profile, field, val)

    # If common_services was updated, sync communication types for legacy compatibility
    if profile_in.common_services is not None:
        profile.common_communication_types = profile_in.common_services

    comp = profiling_service.calculate_completion(profile)
    profile.profile_completion = comp["completion_percentage"]
    profile.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(profile)
    return profile

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

    setattr(profile, field, patch_in.value)
    comp = profiling_service.calculate_completion(profile)
    profile.profile_completion = comp["completion_percentage"]
    profile.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(profile)
    return profile

@router.get("/completion", response_model=ProfileCompletionOut)
def get_profile_completion(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Section 15: Calculates profile completion percentage and highlights missing fields.
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

# --- Dynamic Conversational Onboarding Endpoints ---

@router.post("/onboarding/start", response_model=OnboardingStartResponse)
def start_onboarding(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Section 1 & 2: Starts the dynamic conversational onboarding process.
    Asks the initial question ("What best describes your role?").
    """
    res = profiling_service.start_onboarding(current_user.user_id, db)
    return OnboardingStartResponse(**res)

@router.post("/onboarding/answer", response_model=OnboardingAnswerResponse)
def answer_onboarding(
    req: OnboardingAnswerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Section 3, 4, 5, 6: Accepts answer, dynamically determines next question,
    handles 'Other' custom text inputs, and saves to database.
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
        db=db
    )
    return OnboardingAnswerResponse(**res)

# --- Conversational Profile Editing ("Edit Profile with AI") ---

@router.post("/conversation", response_model=ConversationalEditResponse)
def conversational_edit_profile(
    req: ConversationalEditRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Section 10, 11, 12, 14: Natural language profile modification using LLM.
    Converts phrases like "I changed my role to Software Developer" or "Remove Instagram"
    into validated, structured DB updates.
    """
    res = profiling_service.process_conversational_edit(
        user_id=current_user.user_id,
        message=req.message,
        conversation_id=req.conversation_id,
        db=db
    )
    return ConversationalEditResponse(**res)

@router.post("/conversation/confirm")
def confirm_conversational_changes(
    req: ConfirmChangesRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Section 12: Confirms changes that required explicit user verification before updating DB.
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    if not req.confirmed or not req.changes:
        return {
            "status": "cancelled",
            "message": "Changes were not applied.",
            "profile": profiling_service._profile_to_dict(profile)
        }

    applied = profiling_service.apply_validated_changes(profile, [c.dict() for c in req.changes], db)
    comp = profiling_service.calculate_completion(profile)
    profile.profile_completion = comp["completion_percentage"]
    db.commit()
    db.refresh(profile)

    return {
        "status": "confirmed",
        "message": f"Successfully applied {len(applied)} change(s) to your security profile.",
        "profile": profiling_service._profile_to_dict(profile),
        "profile_completion": profile.profile_completion
    }

# --- Legacy Compatibility Endpoint ---

@router.post("/conversational-turn", response_model=ConversationalTurnResponse)
def conversational_turn_legacy(
    req: ConversationalTurnRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Backward compatibility wrapper for legacy chat calls."""
    res = profiling_service.process_conversational_edit(
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
