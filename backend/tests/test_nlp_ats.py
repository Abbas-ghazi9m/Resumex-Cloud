import pytest
from app.nlp.keyword_extractor import extract_keywords_from_text, normalize_term
from app.nlp.section_detector import detect_resume_sections, extract_contact_info
from app.nlp.skill_extractor import extract_job_intelligence
from app.nlp.semantic_matcher import match_keyword_against_resume, compute_cosine_similarity
from app.nlp.ats_scorer import calculate_ats_scoring
from app.nlp.bullet_analyzer import analyze_bullet_points
from app.nlp.ats_compat_checker import check_ats_compatibility
from app.nlp.recommendation_engine import generate_recommendations

def test_normalize_term():
    assert normalize_term("k8s") == "kubernetes"
    assert normalize_term("postgres") == "postgresql"
    assert normalize_term("python") == "python"

def test_extract_keywords():
    sample = "Building cloud microservices with Python, FastAPI, Docker, and PostgreSQL on AWS."
    extracted = extract_keywords_from_text(sample)
    terms = [k["term"] for k in extracted["keywords"]]
    assert "python" in terms
    assert "fastapi" in terms
    assert "docker" in terms
    assert "postgresql" in terms
    assert "aws" in terms

def test_section_detector():
    text = """
    Jane Doe
    jane@example.com | (555) 123-4567 | linkedin.com/in/janedoe
    
    Professional Summary
    Experienced developer.
    
    Technical Skills
    Python, Django, AWS
    
    Work Experience
    Software Engineer at Company X.
    
    Education
    B.S. in Computer Science
    """
    sections = detect_resume_sections(text)
    assert "summary" in sections
    assert "skills" in sections
    assert "experience" in sections
    assert "education" in sections

    contact = extract_contact_info(text)
    assert contact["email"] == "jane@example.com"
    assert contact["phone"] is not None

def test_job_intelligence():
    jd = """
    Senior Python Engineer
    Requirements:
    Must have 4+ years of experience with Python and Django.
    Experience with PostgreSQL and Docker required.
    Preferred:
    Knowledge of Kubernetes and AWS is a plus.
    """
    intel = extract_job_intelligence(jd)
    assert intel["min_experience_years"] == 4
    mand_skills = [s["canonical"] for s in intel["mandatory_skills"]]
    pref_skills = [s["canonical"] for s in intel["preferred_skills"]]
    assert "python" in mand_skills
    assert "kubernetes" in pref_skills or "kubernetes" in mand_skills

def test_semantic_matcher():
    resume_text = "Implemented high throughput microservices using K8s and Postgres."
    kw_map = {"kubernetes": {"frequency": 1}, "postgresql": {"frequency": 1}}
    sections = {"experience": resume_text}
    
    # Exact / normalized
    res = match_keyword_against_resume("kubernetes", resume_text, kw_map, sections)
    assert res["matched"] is True

    # Synonym
    res_syn = match_keyword_against_resume("postgres", resume_text, kw_map, sections)
    assert res_syn["matched"] is True

def test_bullet_analyzer():
    bullet = "Worked on a web application."
    feedback = analyze_bullet_points(bullet)
    assert len(feedback) > 0
    assert "Passive phrasing detected" in feedback[0]["issue"]

def test_ats_scoring_pipeline():
    resume = """
    Senior Engineer with 5 years experience in Python, FastAPI, PostgreSQL, Docker, AWS.
    Education: Bachelor of Science in Computer Science.
    Work Experience:
    Senior Developer at Cloud Inc. Architected distributed systems.
    """
    jd = """
    Looking for a Senior Python Engineer with 3+ years experience.
    Must have Python, FastAPI, PostgreSQL, Docker.
    Degree in Computer Science required.
    """
    intel = extract_job_intelligence(jd)
    sections = detect_resume_sections(resume)
    meta = {"two_column_risk": False, "is_scanned": False, "image_count": 0, "has_tables": False}

    scoring = calculate_ats_scoring(
        resume_text=resume,
        job_text=jd,
        job_intelligence=intel,
        resume_sections=sections,
        resume_metadata=meta,
        target_job_title="Senior Python Engineer"
    )

    assert 0 <= scoring["overall_score"] <= 100
    assert "keyword_match" in scoring["breakdown"]
    assert "skills_match" in scoring["breakdown"]
    assert scoring["overall_score"] >= 70  # strong match

    recs, summary = generate_recommendations(scoring, "Senior Python Engineer")
    assert len(recs) >= 0
    assert len(summary) > 10
