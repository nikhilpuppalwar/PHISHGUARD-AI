from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserProfile, Session as DbSession
from app.schemas.auth import (
    UserRegister, UserLogin, PasswordResetRequest,
    PasswordResetConfirm, TokenResponse, UserOut
)
from app.services.auth_service import (
    hash_password, verify_password, create_access_token, decode_access_token
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication token"
        )
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid token"
        )
    user = db.query(User).filter(User.user_id == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

@router.post("/register", response_model=TokenResponse)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    new_user = User(
        email=user_in.email.lower(),
        password_hash=hash_password(user_in.password),
        created_at=datetime.utcnow(),
        last_login=datetime.utcnow()
    )
    db.add(new_user)
    db.flush()

    # Create initial empty profile
    initial_profile = UserProfile(
        user_id=new_user.user_id,
        role=user_in.role or "Student",
        preferred_name=user_in.email.split("@")[0].capitalize(),
        security_awareness="Beginner",
        preferred_explanation_style="Simple"
    )
    db.add(initial_profile)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": new_user.user_id, "email": new_user.email})
    return TokenResponse(
        access_token=token,
        user_id=new_user.user_id,
        email=new_user.email,
        has_profile=True,
        role=initial_profile.role,
        preferred_name=initial_profile.preferred_name
    )

@router.post("/login", response_model=TokenResponse)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email.lower()).first()
    if not user or not verify_password(login_in.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    user.last_login = datetime.utcnow()
    db.commit()

    token = create_access_token({"sub": user.user_id, "email": user.email})
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.user_id).first()

    return TokenResponse(
        access_token=token,
        user_id=user.user_id,
        email=user.email,
        has_profile=profile is not None and len(profile.common_communication_types) > 0,
        role=profile.role if profile else "Student",
        preferred_name=profile.preferred_name if profile else user.email.split("@")[0]
    )

@router.get("/me")
def me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.user_id).first()
    return {
        "user_id": current_user.user_id,
        "email": current_user.email,
        "created_at": current_user.created_at,
        "last_login": current_user.last_login,
        "profile": {
            "preferred_name": profile.preferred_name if profile else None,
            "role": profile.role if profile else "Student",
            "common_communication_types": profile.common_communication_types if profile else [],
            "security_awareness": profile.security_awareness if profile else "Beginner",
            "preferred_explanation_style": profile.preferred_explanation_style if profile else "Simple"
        } if profile else None
    }

@router.post("/password-reset/request")
def request_password_reset(req: PasswordResetRequest, db: Session = Depends(get_db)):
    """
    FR-17: Always return consistent message to prevent account enumeration.
    """
    user = db.query(User).filter(User.email == req.email.lower()).first()
    # In production, dispatch email with OTP/token. Here, simulate 6-digit code for demo testing.
    return {
        "message": "If an account exists with this email address, a secure password recovery code has been dispatched.",
        "demo_code": "482910"  # For capstone preview convenience
    }

@router.post("/password-reset/confirm")
def confirm_password_reset(conf: PasswordResetConfirm, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == conf.email.lower()).first()
    if not user:
        # Return success message to avoid leaking user presence
        return {"message": "Password has been successfully updated. You may now sign in."}

    user.password_hash = hash_password(conf.new_password)
    db.commit()
    return {"message": "Password has been successfully updated. You may now sign in."}
