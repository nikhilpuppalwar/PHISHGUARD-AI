from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class FeedbackCreate(BaseModel):
    submission_id: str
    verdict: str  # confirmed_phishing, confirmed_legitimate, incorrect, unsure
    additional_context: Optional[str] = None

class FeedbackOut(BaseModel):
    feedback_id: str
    submission_id: str
    user_id: str
    verdict: str
    additional_context: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
