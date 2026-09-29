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
    external_threat_intel: Optional[Dict[str, Any]] = None
    structural_analysis: Optional[Dict[str, Any]] = None
    evidence_object: Optional[Dict[str, Any]] = None

class SimilarIncidentDetail(BaseModel):
    incident_id: Optional[str] = None
    title: str
    similarity: float  # e.g. 0.91 (91%)
    content_summary: str
    attack_type: str
    indicators: List[str]
    has_match: Optional[bool] = True
    what_changed: Optional[Dict[str, Any]] = None

class ThreatIntelStatusResponse(BaseModel):
    google_safe_browsing: str
    virustotal: str
    mongodb_persistence: str
    demo_mode: bool

class ThreatIntelCheckRequest(BaseModel):
    url: str

class AnalysisResponse(BaseModel):
    submission_id: str
    submitted_at: datetime
    original_content: Optional[str] = None
    channel: str
    sender: Optional[str] = None
    subject: Optional[str] = None
    extracted_urls: List[str] = []
    
    # Risk Assessment
    overall_score: float  # 0 to 100
    base_score: Optional[float] = None
    personalized_score: Optional[float] = None
    profile_relevance: Optional[str] = None
    severity: str        # Low, Medium, High
    confidence: float    # 0 to 1
    risk_factors: Optional[List[Dict[str, Any]]] = []
    
    # Attack Type
    attack_type: str
    attack_type_id: Optional[str] = None
    attack_type_description: Optional[str] = None
    attack_classification: Optional[Dict[str, Any]] = None
    
    # Explainable AI Contributions
    agent_contributions: Dict[str, float]  # {"url": 41.0, "text": 32.0, "sender": 18.0, "rag": 9.0}
    agent_details: Dict[str, AgentResultDetail]
    explainability_details: Optional[Dict[str, Any]] = None
    
    # Indicators & Context
    major_indicators: List[str]
    similar_incident: Optional[SimilarIncidentDetail] = None
    what_changed: Optional[Dict[str, Any]] = None
    
    # GenAI Output & Personalization
    explanation: str
    action_plan: List[str]
    personalized_recommendations: Optional[List[str]] = None
    genai_output: Optional[Dict[str, Any]] = None
    personalization_context: Optional[Dict[str, Any]] = None
    why_this_matters: Optional[str] = None
    before_you_act: Optional[List[str]] = None
    user_role_context: Optional[str] = "Student"
    user_feedback_state: Optional[str] = None

    # Trace & Coverage
    evidence_coverage: Optional[Dict[str, Any]] = None
    agent_trace: Optional[List[Dict[str, Any]]] = None

    # External Threat Intelligence & Evidence
    external_threat_intel: Optional[Dict[str, Any]] = None
    url_evidence: Optional[Dict[str, Any]] = None
    text_evidence: Optional[Dict[str, Any]] = None
    sender_evidence: Optional[Dict[str, Any]] = None

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
