import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class Submission(Base):
    __tablename__ = "submissions"

    submission_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    channel = Column(String(50), nullable=False)  # email, sms, url
    raw_text = Column(Text, nullable=False)
    sender = Column(String(255), nullable=True)
    recipient = Column(String(255), nullable=True)
    subject = Column(String(255), nullable=True)
    extracted_urls = Column(JSON, default=list)
    submitted_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="submissions")
    agent_results = relationship("AgentResult", back_populates="submission", cascade="all, delete-orphan")
    combined_evidence = relationship("CombinedEvidence", back_populates="submission", uselist=False, cascade="all, delete-orphan")
    risk_assessment = relationship("RiskAssessment", back_populates="submission", uselist=False, cascade="all, delete-orphan")
    explanation = relationship("Explanation", back_populates="submission", uselist=False, cascade="all, delete-orphan")
    final_result = relationship("FinalResult", back_populates="submission", uselist=False, cascade="all, delete-orphan")
    feedback = relationship("Feedback", back_populates="submission", cascade="all, delete-orphan")

class AgentResult(Base):
    __tablename__ = "agent_results"

    result_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    submission_id = Column(String(36), ForeignKey("submissions.submission_id", ondelete="CASCADE"), nullable=False, index=True)
    agent_type = Column(String(50), nullable=False, index=True)  # text, url, sender
    risk_score = Column(Float, nullable=False)
    indicators = Column(JSON, default=list)
    model_probability = Column(Float, nullable=False, default=0.0)
    model_id = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    submission = relationship("Submission", back_populates="agent_results")

class CombinedEvidence(Base):
    __tablename__ = "combined_evidence"

    evidence_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    submission_id = Column(String(36), ForeignKey("submissions.submission_id", ondelete="CASCADE"), unique=True, nullable=False)
    text_result_id = Column(String(36), nullable=True)
    url_result_id = Column(String(36), nullable=True)
    sender_result_id = Column(String(36), nullable=True)
    rag_context = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    submission = relationship("Submission", back_populates="combined_evidence")
