import json
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.database_models import RecruiterJob, RecruiterCandidate, User
from app.parsers.document_validator import validate_uploaded_document
from app.parsers.pdf_parser import extract_pdf_data
from app.parsers.docx_parser import extract_docx_data
from app.services.recruiter_service import process_candidate_for_job, rank_recruiter_candidates
from app.api.auth_routes import get_current_user_optional

router = APIRouter(prefix="/recruiter", tags=["Recruiter Intelligence"])

@router.post("/jobs")
def create_recruiter_job(
    title: str = Form(...),
    department: Optional[str] = Form("Engineering"),
    job_description: str = Form(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    if not job_description.strip():
        raise HTTPException(status_code=400, detail="Job description text is required.")

    r_job = RecruiterJob(
        user_id=current_user.id if current_user else None,
        title=title.strip(),
        department=department.strip() if department else "Engineering",
        job_description_text=job_description.strip()
    )
    db.add(r_job)
    db.commit()
    db.refresh(r_job)

    return {
        "id": r_job.id,
        "title": r_job.title,
        "department": r_job.department,
        "status": r_job.status,
        "created_at": r_job.created_at
    }

@router.get("/jobs")
def list_recruiter_jobs(db: Session = Depends(get_db)):
    jobs = db.query(RecruiterJob).order_by(RecruiterJob.created_at.desc()).all()
    results = []
    for j in jobs:
        candidate_count = db.query(RecruiterCandidate).filter(RecruiterCandidate.recruiter_job_id == j.id).count()
        results.append({
            "id": j.id,
            "title": j.title,
            "department": j.department,
            "status": j.status,
            "candidate_count": candidate_count,
            "created_at": j.created_at
        })
    return results

@router.get("/jobs/{job_id}")
def get_recruiter_job_detail(job_id: str, db: Session = Depends(get_db)):
    j = db.query(RecruiterJob).filter(RecruiterJob.id == job_id).first()
    if not j:
        raise HTTPException(status_code=404, detail="Recruiter job not found")

    candidates = db.query(RecruiterCandidate).filter(RecruiterCandidate.recruiter_job_id == j.id).all()
    
    cand_list = []
    for c in candidates:
        cand_list.append({
            "id": c.id,
            "candidate_name": c.candidate_name,
            "candidate_email": c.candidate_email,
            "resume_filename": c.resume_filename,
            "ats_score": c.ats_score,
            "skills_score": c.skills_score,
            "experience_score": c.experience_score,
            "education_score": c.education_score,
            "top_matched_skills": json.loads(c.top_matched_skills) if c.top_matched_skills else [],
            "critical_missing_skills": json.loads(c.critical_missing_skills) if c.critical_missing_skills else [],
            "recommendation_verdict": c.recommendation_verdict,
            "rank": 0
        })

    ranked = rank_recruiter_candidates(cand_list)

    return {
        "id": j.id,
        "title": j.title,
        "department": j.department,
        "job_description_text": j.job_description_text,
        "candidate_count": len(ranked),
        "candidates": ranked,
        "created_at": j.created_at
    }

@router.post("/jobs/{job_id}/candidates")
async def add_candidate_resume(
    job_id: str,
    candidate_name: str = Form(...),
    candidate_email: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    j = db.query(RecruiterJob).filter(RecruiterJob.id == job_id).first()
    if not j:
        raise HTTPException(status_code=404, detail="Recruiter job not found")

    content = await file.read()
    clean_filename, doc_type = validate_uploaded_document(file.filename, content)

    # Extract text
    if doc_type == "pdf":
        text = extract_pdf_data(content)["text"]
    elif doc_type == "docx":
        text = extract_docx_data(content)["text"]
    else:
        text = content.decode("utf-8", errors="ignore")

    processed = process_candidate_for_job(
        recruiter_job=j,
        resume_text=text,
        resume_filename=clean_filename,
        candidate_name=candidate_name,
        candidate_email=candidate_email
    )

    db_cand = RecruiterCandidate(
        recruiter_job_id=j.id,
        candidate_name=candidate_name,
        candidate_email=candidate_email,
        resume_filename=clean_filename,
        ats_score=processed["ats_score"],
        skills_score=processed["skills_score"],
        experience_score=processed["experience_score"],
        education_score=processed["education_score"],
        top_matched_skills=json.dumps(processed["top_matched_skills"]),
        critical_missing_skills=json.dumps(processed["critical_missing_skills"]),
        recommendation_verdict="Review"
    )
    db.add(db_cand)
    db.commit()
    db.refresh(db_cand)

    return {
        "candidate_id": db_cand.id,
        "status": "EVALUATED",
        "ats_score": db_cand.ats_score,
        "top_matched_skills": processed["top_matched_skills"],
        "critical_missing_skills": processed["critical_missing_skills"]
    }
