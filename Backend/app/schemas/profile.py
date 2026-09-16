from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from pydantic import BaseModel, Field

# --- Base Profile Schemas ---

class UserProfileBase(BaseModel):
    preferred_name: Optional[str] = None
    role: Optional[str] = "Student"
    industry: Optional[str] = None
    organization_type: Optional[str] = None
    common_services: List[str] = Field(default_factory=list)
    online_activities: List[str] = Field(default_factory=list)
    common_communication_types: List[str] = Field(default_factory=list)
    security_awareness: Optional[str] = "Beginner"
    technical_experience: Optional[str] = "Intermediate"
    banking_usage: bool = False
    online_shopping: bool = False
    work_email_usage: bool = False
    preferred_explanation_style: Optional[str] = "Simple"
    profile_preferences: Dict[str, Any] = Field(default_factory=dict)
    custom_information: Dict[str, Any] = Field(default_factory=dict)
    risk_preferences: Dict[str, Any] = Field(default_factory=dict)
    profile_completion: int = 20

class UserProfileUpdate(BaseModel):
    preferred_name: Optional[str] = None
    role: Optional[str] = None
    industry: Optional[str] = None
    organization_type: Optional[str] = None
    common_services: Optional[List[str]] = None
    online_activities: Optional[List[str]] = None
    common_communication_types: Optional[List[str]] = None
    security_awareness: Optional[str] = None
    technical_experience: Optional[str] = None
    banking_usage: Optional[bool] = None
    online_shopping: Optional[bool] = None
    work_email_usage: Optional[bool] = None
    preferred_explanation_style: Optional[str] = None
    custom_information: Optional[Dict[str, Any]] = None

class UserProfileFieldPatch(BaseModel):
    field: str
    value: Any

class UserProfileOut(UserProfileBase):
    profile_id: str
    user_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Structured Conversational Onboarding Schemas ---

class QuestionOption(BaseModel):
    label: str
    value: str

class StructuredQuestion(BaseModel):
    question: str
    question_type: str = "single_choice"  # single_choice, multiple_choice, text, yes_no, custom
    options: List[str] = Field(default_factory=list)
    allow_custom_input: bool = True
    profile_field: str
    next_action: str = "await_answer"
    placeholder: Optional[str] = None
    current_step: int = 1
    total_steps: int = 5
    profile_completion: int = 20

class OnboardingStartResponse(BaseModel):
    conversation_id: str
    assistant_message: str
    question: StructuredQuestion
    extracted_profile: Dict[str, Any]
    profile_completion: int

class OnboardingAnswerRequest(BaseModel):
    conversation_id: Optional[str] = None
    field: str
    answer: Union[str, List[str], bool]
    custom_answer: Optional[str] = None  # populated if "Other" was chosen

class OnboardingAnswerResponse(BaseModel):
    conversation_id: str
    assistant_message: str
    is_complete: bool = False
    next_question: Optional[StructuredQuestion] = None
    extracted_profile: Dict[str, Any]
    profile_completion: int
    feedback_note: Optional[str] = None

# --- Conversational Profile Editing & Natural Language Schemas ---

class ProfileChangeItem(BaseModel):
    field: str
    operation: str = "set"  # set, add, remove
    value: Any

class ConversationalEditRequest(BaseModel):
    conversation_id: Optional[str] = None
    message: str

class ConversationalEditResponse(BaseModel):
    conversation_id: str
    intent: str = "profile_update"  # profile_update, clarification, info
    assistant_message: str
    changes: List[ProfileChangeItem] = Field(default_factory=list)
    requires_confirmation: bool = False
    confirmation_prompt: Optional[str] = None
    updated_profile: Optional[Dict[str, Any]] = None
    profile_completion: int

class ConfirmChangesRequest(BaseModel):
    conversation_id: str
    confirmed: bool = True
    changes: Optional[List[ProfileChangeItem]] = None

class ProfileCompletionOut(BaseModel):
    completion_percentage: int
    completed_fields: List[str]
    missing_fields: List[str]
    message: str

class ConversationalTurnRequest(BaseModel):
    message: str
    history: List[Dict[str, Any]] = Field(default_factory=list)

class ConversationalTurnResponse(BaseModel):
    assistant_message: str
    is_complete: bool = False
    step: int = 1
    total_steps: int = 4
    extracted_profile: Optional[Dict[str, Any]] = None
    quick_suggestions: List[str] = Field(default_factory=list)

