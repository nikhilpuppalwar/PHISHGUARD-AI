import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent
WORKSPACE_DIR = BASE_DIR.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "PhishGuard AI"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "phishguard_ai_secure_development_secret_key_2025_mdm_capstone")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'phishguard.db'}")
    
    # Paths
    DATASET_DIR: Path = WORKSPACE_DIR / "dataset"
    MODELS_DIR: Path = BASE_DIR / "saved_models"
    
    # AI / LLM Providers (optional if user configures API key)
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
settings.MODELS_DIR.mkdir(parents=True, exist_ok=True)
