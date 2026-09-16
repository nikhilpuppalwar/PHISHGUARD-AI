from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.submission import Submission
from app.models.meta import Feedback
from app.schemas.analysis import SubmissionListItem
from app.routes.auth import get_current_user

router = APIRouter(prefix="/incidents", tags=["Incidents & History"])

@router.get("", response_model=List[SubmissionListItem])
def list_user_submissions(
    channel: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Submission).filter(Submission.user_id == current_user.user_id)

    if channel and channel != "all":
        query = query.filter(Submission.channel == channel.lower())

    submissions = query.order_by(Submission.submitted_at.desc()).limit(limit).all()

    items = []
    for s in submissions:
        risk = s.risk_assessment
        final = s.final_result
        feed = db.query(Feedback).filter(Feedback.submission_id == s.submission_id).first()

        sev = risk.severity if risk else "Low Risk"
        if severity and severity.lower() != "all" and sev.lower() != severity.lower():
            continue

        raw_snippet = (s.raw_text[:120] + "...") if len(s.raw_text) > 120 else s.raw_text
        attack_name = final.attack_type.name if (final and final.attack_type) else "Generic Phishing"

        items.append(SubmissionListItem(
            submission_id=s.submission_id,
            submitted_at=s.submitted_at,
            channel=s.channel,
            sender=s.sender,
            overall_score=risk.overall_score if risk else 0.0,
            severity=sev,
            attack_type=attack_name,
            raw_snippet=raw_snippet.strip(),
            has_feedback=feed is not None,
            feedback_verdict=feed.verdict if feed else None
        ))

    return items
