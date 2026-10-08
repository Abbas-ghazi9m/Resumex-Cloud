from fastapi import APIRouter, Depends, status, Response
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
from app.core.config import settings

router = APIRouter(tags=["Health & Readiness"])

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    storage_status = "healthy"
    try:
        if not settings.LOCAL_STORAGE_DIR.exists():
            storage_status = "unhealthy: directory missing"
    except Exception:
        storage_status = "unhealthy"

    return {
        "status": "UP" if db_status == "healthy" else "DEGRADED",
        "service": "resumex-cloud-core",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "components": {
            "api": "healthy",
            "database": db_status,
            "storage": storage_status,
            "nlp_engine": "operational"
        }
    }

@router.get("/ready")
def readiness_check(response: Response, db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"ready": True, "status": "Ready to accept candidate traffic"}
    except Exception as e:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {"ready": False, "error": str(e)}
