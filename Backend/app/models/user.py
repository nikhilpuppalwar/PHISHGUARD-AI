import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, Boolean, Integer
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="user", cascade="all, delete-orphan")
    feedback = relationship("Feedback", back_populates="user", cascade="all, delete-orphan")
    conversations = relationship("ProfileConversation", back_populates="user", cascade="all, delete-orphan")

class UserProfile(Base):
    __tablename__ = "user_profiles"

    profile_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.user_id", ondelete="CASCADE"), unique=True, nullable=False)
    preferred_name = Column(String(100), nullable=True)
    role = Column(String(100), default="Student")
    industry = Column(String(150), nullable=True)
    organization_type = Column(String(150), nullable=True)
    common_services = Column(JSON, default=list)  # ["Google", "GitHub", "Microsoft", "Social Media"]
    online_activities = Column(JSON, default=list)  # ["Education", "Online Shopping", "Banking"]
    common_communication_types = Column(JSON, default=list)
    security_awareness = Column(String(50), default="Beginner")
    technical_experience = Column(String(50), default="Intermediate")
    banking_usage = Column(Boolean, default=False)
    online_shopping = Column(Boolean, default=False)
    work_email_usage = Column(Boolean, default=False)
    preferred_explanation_style = Column(String(50), default="Simple")
    profile_preferences = Column(JSON, default=dict)
    custom_information = Column(JSON, default=dict)
    risk_preferences = Column(JSON, default=dict)
    profile_completion = Column(Integer, default=20)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="profile")

class ProfileConversation(Base):
    __tablename__ = "profile_conversations"

    conversation_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    conversation_type = Column(String(50), default="onboarding")  # "onboarding" or "profile_edit"
    messages = Column(JSON, default=list)
    profile_updates = Column(JSON, default=list)
    pending_changes = Column(JSON, default=list)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="conversations")

class Session(Base):
    __tablename__ = "sessions"

    session_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    token_hash = Column(String(255), index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)

    user = relationship("User", back_populates="sessions")

