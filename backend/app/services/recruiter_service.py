from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.database_models import RecruiterJob, RecruiterCandidate, Resume, JobDescription
from app.services.analysis_service import execute_full_analysis

def rank_recruiter_candidates(candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Ranks candidates strictly using transparent, explainable meritocracy:
    - ATS Match Score
    - Skills match
    - Experience relevance
    - Education alignment
    EXPLICITLY BLIND to race, gender, age, nationality, or any protected classes.
    """
    sorted_candidates = sorted(
        candidates, 
        key=lambda c: (c.get("ats_score", 0), c.get("skills_score", 0), c.get("experience_score", 0)), 
        reverse=True
    )
    
    for idx, c in enumerate(sorted_candidates, start=1):
        c["rank"] = idx
        score = c.get("ats_score", 0)
        if score >= 88:
            c["recommendation_verdict"] = "Fast Track"
        elif score >= 75:
            c["recommendation_verdict"] = "Strong Match"
        elif score >= 60:
            c["recommendation_verdict"] = "Consider"
        else:
            c["recommendation_verdict"] = "Review Gaps"

    return sorted_candidates

def process_candidate_for_job(
    recruiter_job: RecruiterJob,
    resume_text: str,
    resume_filename: str,
    candidate_name: str,
    candidate_email: str = None
) -> Dict[str, Any]:
    """
    Evaluates a candidate resume against the recruiter job posting.
    """
    result = execute_full_analysis(
        resume_text=resume_text,
        job_text=recruiter_job.job_description_text,
        target_job_title=recruiter_job.title,
        company_name="Enterprise Talent Pool",
        candidate_name=candidate_name
    )

    top_matched = [k["keyword"] for k in result.get("matched_keywords", [])[:5]]
    missing = [k["keyword"] for k in result.get("missing_keywords", []) if k.get("importance") == "Critical"][:4]

    return {
        "candidate_name": candidate_name,
        "candidate_email": candidate_email,
        "resume_filename": resume_filename,
        "ats_score": result["overall_score"],
        "skills_score": result["breakdown"]["skills_match"]["score"],
        "experience_score": result["breakdown"]["experience_relevance"]["score"],
        "education_score": result["breakdown"]["education_match"]["score"],
        "top_matched_skills": top_matched,
        "critical_missing_skills": missing,
        "analysis_id": result.get("id")
    }
