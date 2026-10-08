import json
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.database_models import Analysis, Resume, JobDescription, User
from app.models.schemas import (
    AnalysisRequest, QuickAnalysisRequest, AnalysisResponse, 
    AnalysisListItem, AssistantQueryRequest, AssistantQueryResponse
)
from app.services.analysis_service import execute_full_analysis
from app.ai.ai_provider import get_ai_provider
from app.api.auth_routes import get_current_user_optional

router = APIRouter(prefix="/analysis", tags=["Analysis"])
ai_provider = get_ai_provider()

@router.post("", response_model=AnalysisResponse)
def run_analysis(
    req: AnalysisRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    # Retrieve resume
    resume = db.query(Resume).filter(Resume.id == req.resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Retrieve or create job
    job = None
    if req.job_id:
        job = db.query(JobDescription).filter(JobDescription.id == req.job_id).first()
    elif req.job_text:
        job = JobDescription(
            user_id=current_user.id if current_user else None,
            title=req.job_title or "Target Role",
            company=req.job_company or "Target Enterprise",
            raw_text=req.job_text.strip()
        )
        db.add(job)
        db.commit()
        db.refresh(job)

    if not job:
        raise HTTPException(status_code=400, detail="Either a valid job_id or job_text must be provided.")

    resume_metadata = {
        "two_column_risk": False,
        "is_scanned": False,
        "image_count": 0,
        "has_tables": False
    }
    if resume.ats_formatting_analysis_json:
        risks = json.loads(resume.ats_formatting_analysis_json)
        resume_metadata["two_column_risk"] = any(r.get("title") == "Two-Column Layout Detected" for r in risks)

    user_id = current_user.id if current_user else None
    analysis_result = execute_full_analysis(
        resume_text=resume.raw_text,
        job_text=job.raw_text,
        target_job_title=job.title,
        company_name=job.company or "Target Enterprise",
        resume_metadata=resume_metadata,
        db=db,
        user_id=user_id,
        resume_id=resume.id,
        job_id=job.id,
        is_demo=False
    )

    return analysis_result

@router.post("/quick", response_model=AnalysisResponse)
def run_quick_analysis(req: QuickAnalysisRequest):
    """Zero-upload instant analysis for presentation, demo, and rapid evaluation"""
    if not req.resume_text.strip() or not req.job_text.strip():
        raise HTTPException(status_code=400, detail="Resume text and Job text must both be provided.")

    analysis_result = execute_full_analysis(
        resume_text=req.resume_text,
        job_text=req.job_text,
        target_job_title=req.job_title or "Target Role",
        company_name="Target Enterprise",
        candidate_name=req.candidate_name or "Candidate",
        is_demo=True
    )
    return analysis_result

@router.get("/list", response_model=List[AnalysisListItem])
def list_analyses(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    query = db.query(Analysis).join(Resume).join(JobDescription)
    if current_user:
        query = query.filter((Analysis.user_id == current_user.id) | (Analysis.user_id == None))
    analyses = query.order_by(Analysis.created_at.desc()).limit(30).all()

    results = []
    for a in analyses:
        results.append({
            "id": a.id,
            "resume_id": a.resume_id,
            "resume_filename": a.resume.filename if a.resume else "resume.pdf",
            "job_id": a.job_id,
            "job_title": a.job.title if a.job else "Target Role",
            "company": a.job.company if a.job else "Target Enterprise",
            "overall_score": a.overall_score,
            "status": a.status,
            "processing_duration_ms": a.processing_duration_ms,
            "created_at": a.created_at,
            "is_demo": a.is_demo
        })
    return results

@router.get("/{analysis_id}", response_model=AnalysisResponse)
def get_analysis_detail(analysis_id: str, db: Session = Depends(get_db)):
    a = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Analysis record not found")

    job_title = a.job.title if a.job else "Target Role"
    company = a.job.company if a.job else "Target Enterprise"

    return {
        "id": a.id,
        "resume_id": a.resume_id,
        "job_id": a.job_id,
        "job_title": job_title,
        "company": company,
        "candidate_name": a.user.name if a.user else "Candidate",
        "overall_score": a.overall_score,
        "breakdown": json.loads(a.breakdown_json) if a.breakdown_json else {},
        "matched_keywords": json.loads(a.matched_keywords_json) if a.matched_keywords_json else [],
        "missing_keywords": json.loads(a.missing_keywords_json) if a.missing_keywords_json else [],
        "skill_gaps": json.loads(a.skill_gaps_json) if a.skill_gaps_json else [],
        "bullet_analysis": json.loads(a.bullet_analysis_json) if a.bullet_analysis_json else [],
        "recommendations": json.loads(a.recommendations_json) if a.recommendations_json else [],
        "formatting_risks": json.loads(a.ats_compatibility_json) if a.ats_compatibility_json else [],
        "executive_summary": a.executive_summary or "ATS Analysis complete.",
        "processing_duration_ms": a.processing_duration_ms,
        "created_at": a.created_at,
        "is_demo": a.is_demo
    }

@router.delete("/{analysis_id}")
def delete_analysis(analysis_id: str, db: Session = Depends(get_db)):
    a = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Analysis not found")
    db.delete(a)
    db.commit()
    return {"status": "DELETED", "message": f"Analysis {analysis_id} purged."}

@router.post("/{analysis_id}/assistant", response_model=AssistantQueryResponse)
def ask_assistant(analysis_id: str, req: AssistantQueryRequest, db: Session = Depends(get_db)):
    a = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Analysis record not found")

    analysis_data = {
        "id": a.id,
        "job_title": a.job.title if a.job else "Target Role",
        "overall_score": a.overall_score,
        "breakdown": json.loads(a.breakdown_json) if a.breakdown_json else {},
        "matched_keywords": json.loads(a.matched_keywords_json) if a.matched_keywords_json else [],
        "missing_keywords": json.loads(a.missing_keywords_json) if a.missing_keywords_json else [],
        "recommendations": json.loads(a.recommendations_json) if a.recommendations_json else [],
    }

    resp = ai_provider.answer_query(req.question, analysis_data)
    return resp

@router.post("/{analysis_id}/rewrite")
def suggest_section_rewrite(
    analysis_id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db)
):
    a = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Analysis record not found")

    section_name = payload.get("section_name", "summary")
    current_content = payload.get("content", "")
    missing_kws = [k.get("keyword") for k in json.loads(a.missing_keywords_json or "[]")][:4]

    rewrite_res = ai_provider.suggest_rewrite(section_name, current_content, missing_kws)
    return rewrite_res
