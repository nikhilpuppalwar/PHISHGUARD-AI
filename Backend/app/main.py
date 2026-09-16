from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.seed_data import seed_database
from app.routes import (
    auth_router,
    profile_router,
    analyze_router,
    incidents_router,
    feedback_router,
    analytics_router,
    meta_router
)

# Initialize database schema and seed defaults
Base.metadata.create_all(bind=engine)
try:
    seed_database()
except Exception as e:
    print(f"Seed info: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Personalized Multi-Agent Phishing Detection & Explainable Threat Risk Analysis Platform"
)

# Configure CORS for local development and Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(profile_router, prefix=settings.API_V1_STR)
app.include_router(analyze_router, prefix=settings.API_V1_STR)
app.include_router(incidents_router, prefix=settings.API_V1_STR)
app.include_router(feedback_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(meta_router, prefix=settings.API_V1_STR)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "multi_agent_pipeline": "operational",
        "agents": {
            "text": "TF-IDF + Logistic Regression",
            "url": "XGBoost (PhiUSIIL)",
            "sender": "Random Forest",
            "rag": "ChromaDB Memory"
        }
    }
