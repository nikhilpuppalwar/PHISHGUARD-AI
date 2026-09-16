from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class UnifiedAnalyzeRequest(BaseModel):
    raw_input: str
    channel_override: Optional[str] = None
    sender_override: Optional[str] = None
    subject_override: Optional[str] = None

class AutoExtractPreviewRequest(BaseModel):
    raw_input: str

class AutoExtractPreviewResponse(BaseModel):
    detected_channel: str
    cleaned_text: str
    extracted_urls: List[str]
    extracted_sender: Optional[str] = None
    extracted_subject: Optional[str] = None
    extracted_keywords: List[str] = []

class AgentResultDetail(BaseModel):
    agent_type: str
    risk_score: float
    model_probability: float
    delta: float
    indicators: List[str]
    summary: str
    model_name: str

class SimilarIncidentDetail(BaseModel):
    incident_id: Optional[str] = None
    title: str
    similarity: float  # e.g. 0.91 (91%)
    content_summary: str
    attack_type: str
    indicators: List[str]

class AnalysisResponse(BaseModel):
    submission_id: str
    submitted_at: datetime
    channel: str
    sender: Optional[str] = None
    extracted_urls: List[str] = []
    
    # Risk Assessment
    overall_score: float  # 0 to 100
    severity: str        # Low, Medium, High
    confidence: float    # 0 to 1
    
    # Attack Type
    attack_type: str
    attack_type_id: Optional[str] = None
    attack_type_description: Optional[str] = None
    
    # Explainable AI Contributions
    agent_contributions: Dict[str, float]  # {"url": 41.0, "text": 32.0, "sender": 18.0, "rag": 9.0}
    agent_details: Dict[str, AgentResultDetail]
    
    # Indicators & Context
    major_indicators: List[str]
    similar_incident: Optional[SimilarIncidentDetail] = None
    
    # GenAI Output
    explanation: str
    action_plan: List[str]
    user_role_context: Optional[str] = "Student"
    user_feedback_state: Optional[str] = None

class SubmissionListItem(BaseModel):
    submission_id: str
    submitted_at: datetime
    channel: str
    sender: Optional[str] = None
    overall_score: float
    severity: str
    attack_type: str
    raw_snippet: str
    has_feedback: bool
    feedback_verdict: Optional[str] = None
