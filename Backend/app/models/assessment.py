import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    risk_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    submission_id = Column(String(36), ForeignKey("submissions.submission_id", ondelete="CASCADE"), unique=True, nullable=False)
    overall_score = Column(Float, nullable=False)  # 0 to 100
    severity = Column(String(50), nullable=False)  # Low, Medium, High
    confidence = Column(Float, nullable=False)     # 0.0 to 1.0
    risk_factors = Column(JSON, default=list)      # [{"factor": "Payment request", "weight": 0.9}]
    created_at = Column(DateTime, default=datetime.utcnow)

    submission = relationship("Submission", back_populates="risk_assessment")

class Explanation(Base):
    __tablename__ = "explanations"

    explanation_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    submission_id = Column(String(36), ForeignKey("submissions.submission_id", ondelete="CASCADE"), unique=True, nullable=False)
    agent_contribution = Column(JSON, default=dict)   # {"url": 0.41, "text": 0.32, "sender": 0.18, "rag": 0.09}
    detected_indicators = Column(JSON, default=list)  # list of strings / objects
    rag_evidence = Column(JSON, default=list)         # similar cases
    risk_factors = Column(JSON, default=list)
    human_readable_text = Column(Text, nullable=False)

    submission = relationship("Submission", back_populates="explanation")

class FinalResult(Base):
    __tablename__ = "final_results"

    result_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    submission_id = Column(String(36), ForeignKey("submissions.submission_id", ondelete="CASCADE"), unique=True, nullable=False)
    risk_id = Column(String(36), nullable=True)
    explanation_id = Column(String(36), nullable=True)
    attack_type_id = Column(String(36), ForeignKey("attack_types.attack_type_id"), nullable=True)
    explanation_text = Column(Text, nullable=False)
    action_plan = Column(JSON, default=list)          # list of actionable strings/steps
    llm_provider = Column(String(50), default="PhishGuard-GenAI")
    llm_model = Column(String(50), default="MultiAgent-Fusion-v2")
    generated_at = Column(DateTime, default=datetime.utcnow)

    submission = relationship("Submission", back_populates="final_result")
    attack_type = relationship("AttackType", back_populates="final_results")
