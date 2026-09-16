from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class AttackTypeOut(BaseModel):
    attack_type_id: str
    name: str
    description: str
    sample_indicators: List[str]
    mitigation_tips: List[str]

    class Config:
        from_attributes = True

class DatasetOut(BaseModel):
    dataset_id: str
    name: str
    path_or_source: str
    row_count: int
    positive_count: int
    negative_count: int
    role: str
    version: str
    added_at: datetime

    class Config:
        from_attributes = True

class ModelVersionOut(BaseModel):
    model_id: str
    agent_type: str
    algorithm: str
    dataset_ids: List[str]
    metrics: Dict[str, Any]
    trained_at: datetime
    is_active: bool

    class Config:
        from_attributes = True

class AnalyticsSummaryOut(BaseModel):
    total_submissions: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    average_risk_score: float
    channel_breakdown: Dict[str, int]
    attack_type_breakdown: Dict[str, int]
    timeline: List[Dict[str, Any]]

class LLMProviderInfo(BaseModel):
    id: str
    name: str
    default_model: str
    models: List[str]
    requires_key: bool
    base_url: Optional[str] = None
    description: str

class LLMCredentialCreate(BaseModel):
    provider: str
    model_name: str
    api_key: Optional[str] = ""
    base_url: Optional[str] = None
    is_active: Optional[bool] = True

class LLMCredentialOut(BaseModel):
    credential_id: str
    provider: str
    model_name: str
    masked_key: str
    base_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class LLMTestRequest(BaseModel):
    provider: str
    model_name: str
    api_key: Optional[str] = ""
    base_url: Optional[str] = None

class LLMTestResponse(BaseModel):
    success: bool
    provider: str
    model: str
    latency_ms: Optional[int] = None
    response: Optional[str] = None
    error: Optional[str] = None

