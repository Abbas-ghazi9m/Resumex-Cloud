import os
from pathlib import Path
from app.services.report_service import generate_pdf_report
from app.core.config import settings

def test_generate_pdf_report():
    sample_analysis = {
        "candidate_name": "Alexander Vance",
        "job_title": "Senior Java Backend Developer",
        "company": "Enterprise FinTech Cloud Corp",
        "overall_score": 88.5,
        "executive_summary": "Candidate exhibits strong alignment with core cloud and Java microservice requirements.",
        "breakdown": {
            "keyword_match": {"score": 91.0, "weight_percentage": 30.0, "weighted_score": 27.3, "explanation": "Matched 14 of 16 keywords."},
            "skills_match": {"score": 85.0, "weight_percentage": 20.0, "weighted_score": 17.0, "explanation": "Matched 6 of 7 mandatory skills."},
            "experience_relevance": {"score": 88.0, "weight_percentage": 15.0, "weighted_score": 13.2, "explanation": "5 years detected vs 4 required."},
            "education_match": {"score": 100.0, "weight_percentage": 10.0, "weighted_score": 10.0, "explanation": "B.S. verified."},
            "job_title_alignment": {"score": 90.0, "weight_percentage": 10.0, "weighted_score": 9.0, "explanation": "Direct match."},
            "resume_structure": {"score": 95.0, "weight_percentage": 10.0, "weighted_score": 9.5, "explanation": "Standard hierarchy."},
            "ats_formatting": {"score": 90.0, "weight_percentage": 5.0, "weighted_score": 4.5, "explanation": "Single-column format."}
        },
        "missing_keywords": [
            {"keyword": "Kafka", "category": "Tools", "importance": "Critical", "job_occurrences": 2, "recommendation": "Add Kafka experience if applicable."}
        ],
        "recommendations": [
            {
                "priority_label": "Priority 1: Critical Skill Deficit",
                "title": "Integrate Kafka Experience",
                "problem": "Missing Kafka event streaming.",
                "suggested_action": "Add distributed streaming projects.",
                "expected_impact": "+5 ATS points."
            }
        ]
    }
    
    filename = "test_output_report.pdf"
    path_str = generate_pdf_report(sample_analysis, filename)
    p = Path(path_str)
    assert p.exists()
    assert p.stat().st_size > 1000  # Non-trivial PDF generated
    # Clean up
    if p.exists():
        p.unlink()
