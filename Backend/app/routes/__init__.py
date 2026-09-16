from app.routes.auth import router as auth_router
from app.routes.profile import router as profile_router
from app.routes.analyze import router as analyze_router
from app.routes.incidents import router as incidents_router
from app.routes.feedback import router as feedback_router
from app.routes.analytics import router as analytics_router
from app.routes.meta import router as meta_router

__all__ = [
    "auth_router",
    "profile_router",
    "analyze_router",
    "incidents_router",
    "feedback_router",
    "analytics_router",
    "meta_router",
]
