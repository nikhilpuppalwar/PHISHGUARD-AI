import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer, Boolean, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class AttackType(Base):
    __tablename__ = "attack_types"

    attack_type_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=False)
    sample_indicators = Column(JSON, default=list)
    mitigation_tips = Column(JSON, default=list)

    final_results = relationship("FinalResult", back_populates="attack_type")
    incidents = relationship("Incident", back_populates="attack_type")

class Feedback(Base):
    __tablename__ = "feedback"

    feedback_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    submission_id = Column(String(36), ForeignKey("submissions.submission_id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    verdict = Column(String(50), nullable=False)  # confirmed_phishing, confirmed_legitimate, incorrect, unsure
    additional_context = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    submission = relationship("Submission", back_populates="feedback")
    user = relationship("User", back_populates="feedback")

class Incident(Base):
    __tablename__ = "incidents"

    incident_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source = Column(String(50), default="dataset")  # user_confirmed, dataset, manual
    attack_type_id = Column(String(36), ForeignKey("attack_types.attack_type_id"), nullable=True)
    title = Column(String(255), nullable=True)
    content_summary = Column(Text, nullable=False)
    indicators = Column(JSON, default=list)
    embedding_id = Column(String(100), nullable=True)
    similarity_keywords = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    attack_type = relationship("AttackType", back_populates="incidents")

class Dataset(Base):
    __tablename__ = "datasets"

    dataset_id = Column(String(50), primary_key=True)
    name = Column(String(255), nullable=False)
    path_or_source = Column(String(255), nullable=False)
    row_count = Column(Integer, nullable=False)
    positive_count = Column(Integer, nullable=False)
    negative_count = Column(Integer, nullable=False)
    role = Column(String(50), nullable=False)  # primary, augmentation, sms, future_out_of_scope
    version = Column(String(50), default="1.0")
    added_at = Column(DateTime, default=datetime.utcnow)

class ModelVersion(Base):
    __tablename__ = "model_versions"

    model_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    agent_type = Column(String(50), nullable=False, index=True)  # text, url, sender
    algorithm = Column(String(100), nullable=False)
    dataset_ids = Column(JSON, default=list)
    metrics = Column(JSON, default=dict)  # {"precision": 0.96, "recall": 0.94, "f1": 0.95, "roc_auc": 0.98}
    trained_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True, index=True)

class LLMCredential(Base):
    __tablename__ = "llm_credentials"

    credential_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    provider = Column(String(50), nullable=False, index=True)  # gemini, groq, openrouter, claude, openai, ollama, huggingface
    model_name = Column(String(100), nullable=False)
    api_key = Column(String(500), nullable=True)
    base_url = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

