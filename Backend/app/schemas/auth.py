from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class UserRegister(BaseModel):
    email: str
    password: str
    role: Optional[str] = "Student"

class UserLogin(BaseModel):
    email: str
    password: str
    remember_me: Optional[bool] = False

class PasswordResetRequest(BaseModel):
    email: str

class PasswordResetConfirm(BaseModel):
    email: str
    reset_code: str
    new_password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    has_profile: bool
    role: Optional[str] = "Student"
    preferred_name: Optional[str] = None

class UserOut(BaseModel):
    user_id: str
    email: str
    created_at: datetime
    last_login: Optional[datetime] = None
    has_profile: bool

    class Config:
        from_attributes = True
