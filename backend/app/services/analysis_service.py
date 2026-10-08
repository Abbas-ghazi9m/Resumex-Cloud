import time
import json
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.nlp.section_detector import detect_resume_sections, extract_contact_info
from app.nlp.skill_extractor import extract_job_intelligence
from app.nlp.ats_scorer import calculate_ats_scoring
from app.nlp.recommendation_engine import generate_recommendations
from app.models.database_models import Analysis, Resume, JobDescription, CloudEvent

def execute_full_analysis(
    resume_text: str,
    job_text: str,
    target_job_title: str = "Software Engineer",
    company_name: str = "Target Enterprise",
    candidate_name: Optional[str] = None,
    resume_metadata: Optional[Dict[str, Any]] = None,
    db: Optional[Session] = None,
    user_id: Optional[str] = None,
    resume_id: Optional[str] = None,
    job_id: Optional[str] = None,
    is_demo: bool = False
) -> Dict[str, Any]:
    """
    Executes the comprehensive Resumex-Cloud intelligence pipeline.
    """
    start_time = time.time()
    resume_meta = resume_metadata or {
        "two_column_risk": False,
        "is_scanned": False,
        "image_count": 0,
        "has_tables": False
    }

    # Step 1: Detect Sections & Contact Information
    sections = detect_resume_sections(resume_text)
    contact_info = extract_contact_info(resume_text)
    candidate = candidate_name or contact_info.get("candidate_name") or "Candidate"

    # Step 2: Extract Job Requirements & Mandatory vs Preferred
    job_intel = extract_job_intelligence(job_text)

    # Step 3: Run ATS Scoring Engine
    scoring_result = calculate_ats_scoring(
        resume_text=resume_text,
        job_text=job_text,
        job_intelligence=job_intel,
        resume_sections=sections,
        resume_metadata=resume_meta,
        target_job_title=target_job_title
    )

    # Step 4: Generate Prioritized Recommendations & Executive Summary
    recommendations, exec_summary = generate_recommendations(
        scoring_result=scoring_result,
        job_title=target_job_title,
        company=company_name
    )

    elapsed_ms = int((time.time() - start_time) * 1000)

    # Format result payload
    analysis_payload = {
        "resume_id": resume_id or "res_temp",
        "job_id": job_id or "job_temp",
        "job_title": target_job_title,
        "company": company_name,
        "candidate_name": candidate,
        "overall_score": scoring_result["overall_score"],
        "breakdown": scoring_result["breakdown"],
        "matched_keywords": scoring_result["matched_keywords"],
        "missing_keywords": scoring_result["missing_keywords"],
        "skill_gaps": scoring_result["skill_gaps"],
        "bullet_analysis": scoring_result["bullet_analysis"],
        "recommendations": recommendations,
        "formatting_risks": scoring_result["formatting_risks"],
        "executive_summary": exec_summary,
        "processing_duration_ms": elapsed_ms,
        "is_demo": is_demo
    }

    # Step 5: Persist to Database if DB Session & IDs present
    if db and resume_id and job_id:
        db_analysis = Analysis(
            user_id=user_id,
            resume_id=resume_id,
            job_id=job_id,
            overall_score=scoring_result["overall_score"],
            keyword_score=scoring_result["breakdown"]["keyword_match"]["score"],
            skills_score=scoring_result["breakdown"]["skills_match"]["score"],
            experience_score=scoring_result["breakdown"]["experience_relevance"]["score"],
            education_score=scoring_result["breakdown"]["education_match"]["score"],
            job_title_score=scoring_result["breakdown"]["job_title_alignment"]["score"],
            structure_score=scoring_result["breakdown"]["resume_structure"]["score"],
            formatting_score=scoring_result["breakdown"]["ats_formatting"]["score"],
            breakdown_json=json.dumps(scoring_result["breakdown"]),
            matched_keywords_json=json.dumps(scoring_result["matched_keywords"]),
            missing_keywords_json=json.dumps(scoring_result["missing_keywords"]),
            skill_gaps_json=json.dumps(scoring_result["skill_gaps"]),
            bullet_analysis_json=json.dumps(scoring_result["bullet_analysis"]),
            recommendations_json=json.dumps(recommendations),
            ats_compatibility_json=json.dumps(scoring_result["formatting_risks"]),
            executive_summary=exec_summary,
            processing_duration_ms=elapsed_ms,
            status="COMPLETE",
            is_demo=is_demo
        )
        db.add(db_analysis)
        
        # Log structured CloudEvent
        cloud_evt = CloudEvent(
            event_type="ANALYSIS_COMPLETED",
            level="INFO",
            message=f"Analysis completed for role '{target_job_title}'. Score: {scoring_result['overall_score']}% in {elapsed_ms}ms.",
            metadata_json=json.dumps({
                "score": scoring_result["overall_score"],
                "duration_ms": elapsed_ms,
                "user_id": user_id
            })
        )
        db.add(cloud_evt)
        db.commit()
        db.refresh(db_analysis)
        analysis_payload["id"] = db_analysis.id
        analysis_payload["created_at"] = db_analysis.created_at
    else:
        analysis_payload["id"] = f"ana_{int(time.time())}"
        analysis_payload["created_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    return analysis_payload
