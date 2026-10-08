import uuid
import json
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.models.database_models import Analysis, Report, User
from app.models.schemas import ReportResponse
from app.services.report_service import generate_pdf_report
from app.api.auth_routes import get_current_user_optional

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("/generate/{analysis_id}", response_model=ReportResponse)
def create_report(
    analysis_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    a = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Analysis not found")

    share_token = str(uuid.uuid4()).replace("-", "")
    pdf_filename = f"resumex_ats_report_{share_token[:12]}.pdf"

    # Assemble analysis data for reportlab
    analysis_dict = {
        "candidate_name": a.user.name if a.user else "Candidate",
        "job_title": a.job.title if a.job else "Target Role",
        "company": a.job.company if a.job else "Target Enterprise",
        "overall_score": a.overall_score,
        "breakdown": json.loads(a.breakdown_json) if a.breakdown_json else {},
        "missing_keywords": json.loads(a.missing_keywords_json) if a.missing_keywords_json else [],
        "recommendations": json.loads(a.recommendations_json) if a.recommendations_json else [],
        "executive_summary": a.executive_summary
    }

    try:
        report_file_path = generate_pdf_report(analysis_dict, pdf_filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compile PDF report: {str(e)}")

    db_report = Report(
        analysis_id=a.id,
        user_id=current_user.id if current_user else None,
        share_token=share_token,
        pdf_filename=pdf_filename,
        pdf_storage_path=report_file_path,
        status="GENERATED"
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)

    return {
        "id": db_report.id,
        "analysis_id": a.id,
        "share_token": share_token,
        "pdf_filename": pdf_filename,
        "download_url": f"/api/reports/download/{pdf_filename}",
        "share_url": f"/reports/view/{share_token}",
        "created_at": db_report.created_at
    }

@router.get("/download/{filename}")
def download_pdf_file(filename: str):
    clean_name = Path(filename).name
    file_path = settings.REPORTS_DIR / clean_name
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Report file not found")
    
    return FileResponse(
        path=file_path, 
        media_type="application/pdf", 
        filename=clean_name,
        headers={"Content-Disposition": f"attachment; filename={clean_name}"}
    )

@router.get("/share/{token}")
def get_shared_report(token: str, db: Session = Depends(get_db)):
    rep = db.query(Report).filter(Report.share_token == token).first()
    if not rep:
        raise HTTPException(status_code=404, detail="Shared report not found or link expired.")
        
    a = rep.analysis
    return {
        "report_id": rep.id,
        "pdf_filename": rep.pdf_filename,
        "download_url": f"/api/reports/download/{rep.pdf_filename}",
        "overall_score": a.overall_score if a else 0,
        "job_title": a.job.title if a and a.job else "Target Role",
        "created_at": rep.created_at
    }
