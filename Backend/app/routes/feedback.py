from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.submission import Submission
from app.models.meta import Feedback, Incident
from app.schemas.feedback import FeedbackCreate, FeedbackOut
from app.routes.auth import get_current_user

router = APIRouter(prefix="/feedback", tags=["Feedback"])

@router.post("", response_model=FeedbackOut)
def submit_feedback(
    fb_in: FeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    submission = db.query(Submission).filter(
        Submission.submission_id == fb_in.submission_id,
        Submission.user_id == current_user.user_id
    ).first()

    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    existing = db.query(Feedback).filter(Feedback.submission_id == fb_in.submission_id).first()
    if existing:
        existing.verdict = fb_in.verdict
        existing.additional_context = fb_in.additional_context
        existing.created_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        target = existing
    else:
        new_feedback = Feedback(
            submission_id=fb_in.submission_id,
            user_id=current_user.user_id,
            verdict=fb_in.verdict,
            additional_context=fb_in.additional_context,
            created_at=datetime.utcnow()
        )
        db.add(new_feedback)
        db.commit()
        db.refresh(new_feedback)
        target = new_feedback

    # If confirmed_phishing, index into Incident knowledge store
    if fb_in.verdict == "confirmed_phishing":
        final = submission.final_result
        at_id = final.attack_type_id if final else None
        db.add(Incident(
            source="user_confirmed",
            attack_type_id=at_id,
            title=f"User Confirmed Phishing: {submission.sender or 'Unknown Sender'}",
            content_summary=submission.raw_text[:250],
            indicators=submission.explanation.detected_indicators if submission.explanation else []
        ))
        db.commit()

    return target
