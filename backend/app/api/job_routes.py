import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.database_models import JobDescription, User
from app.models.schemas import JobCreate, JobResponse
from app.nlp.skill_extractor import extract_job_intelligence
from app.api.auth_routes import get_current_user_optional

router = APIRouter(prefix="/jobs", tags=["Job Descriptions"])

@router.post("", response_model=JobResponse)
def create_job_description(
    job_in: JobCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    if not job_in.raw_text.strip():
        raise HTTPException(status_code=400, detail="Job description text cannot be empty.")

    # Extract intelligence
    intel = extract_job_intelligence(job_in.raw_text)

    db_job = JobDescription(
        user_id=current_user.id if current_user else None,
        title=job_in.title.strip(),
        company=job_in.company.strip() if job_in.company else "Target Enterprise",
        raw_text=job_in.raw_text.strip(),
        extracted_intelligence_json=json.dumps(intel)
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)

    return {
        "id": db_job.id,
        "title": db_job.title,
        "company": db_job.company,
        "raw_text": db_job.raw_text,
        "extracted_intelligence": intel,
        "created_at": db_job.created_at
    }

@router.get("", response_model=List[JobResponse])
def list_jobs(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    query = db.query(JobDescription)
    if current_user:
        query = query.filter((JobDescription.user_id == current_user.id) | (JobDescription.user_id == None))
    jobs = query.order_by(JobDescription.created_at.desc()).limit(20).all()

    results = []
    for j in jobs:
        results.append({
            "id": j.id,
            "title": j.title,
            "company": j.company,
            "raw_text": j.raw_text,
            "extracted_intelligence": json.loads(j.extracted_intelligence_json) if j.extracted_intelligence_json else {},
            "created_at": j.created_at
        })
    return results

@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: str, db: Session = Depends(get_db)):
    j = db.query(JobDescription).filter(JobDescription.id == job_id).first()
    if not j:
        raise HTTPException(status_code=404, detail="Job description not found")
    return {
        "id": j.id,
        "title": j.title,
        "company": j.company,
        "raw_text": j.raw_text,
        "extracted_intelligence": json.loads(j.extracted_intelligence_json) if j.extracted_intelligence_json else {},
        "created_at": j.created_at
    }

@router.delete("/{job_id}")
def delete_job(job_id: str, db: Session = Depends(get_db)):
    j = db.query(JobDescription).filter(JobDescription.id == job_id).first()
    if not j:
        raise HTTPException(status_code=404, detail="Job description not found")
    db.delete(j)
    db.commit()
    return {"status": "DELETED", "message": f"Job description {job_id} removed."}
