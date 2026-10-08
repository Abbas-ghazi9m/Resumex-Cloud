import re
from typing import Dict, List, Any
from rapidfuzz import fuzz
from app.nlp.keyword_extractor import extract_keywords_from_text, normalize_term
from app.nlp.semantic_matcher import match_keyword_against_resume, compute_cosine_similarity
from app.nlp.bullet_analyzer import analyze_bullet_points
from app.nlp.ats_compat_checker import check_ats_compatibility

WEIGHTS = {
    "keyword_match": 0.30,
    "skills_match": 0.20,
    "experience_relevance": 0.15,
    "education_match": 0.10,
    "job_title_alignment": 0.10,
    "resume_structure": 0.10,
    "ats_formatting": 0.05
}

def calculate_ats_scoring(
    resume_text: str,
    job_text: str,
    job_intelligence: Dict[str, Any],
    resume_sections: Dict[str, str],
    resume_metadata: Dict[str, Any],
    target_job_title: str = "Software Engineer"
) -> Dict[str, Any]:
    """
    Executes transparent, fully explainable ATS score calculation.
    """
    resume_keywords_data = extract_keywords_from_text(resume_text)
    resume_kw_map = resume_keywords_data["keyword_map"]
    
    # ---------------- 1. KEYWORD MATCH SCORE (30%) ----------------
    job_keywords_data = extract_keywords_from_text(job_text)
    job_keywords_list = job_keywords_data["keywords"]
    
    matched_keywords_list = []
    missing_keywords_list = []
    
    total_job_kws = len(job_keywords_list)
    kw_weighted_sum = 0.0
    
    for kw_item in job_keywords_list:
        term = kw_item["term"]
        display_name = kw_item["display_name"]
        category = kw_item["category"]
        job_freq = kw_item["frequency"]
        
        match_result = match_keyword_against_resume(
            term, resume_text, resume_kw_map, resume_sections
        )
        
        if match_result["matched"]:
            matched_keywords_list.append({
                "keyword": display_name,
                "category": category,
                "match_type": match_result["match_type"],
                "confidence": match_result["confidence"],
                "resume_occurrences": match_result["resume_occurrences"],
                "job_occurrences": job_freq,
                "suggested_section": match_result["section_found"]
            })
            kw_weighted_sum += match_result["confidence"]
        else:
            importance = "Critical" if job_freq >= 3 else "Important" if job_freq >= 2 else "Optional"
            missing_keywords_list.append({
                "keyword": display_name,
                "category": category,
                "importance": importance,
                "job_occurrences": job_freq,
                "suggested_section": "Skills & Experience",
                "recommendation": f"Mention {display_name} in your experience or projects section only if you genuinely have hands-on experience."
            })

    if total_job_kws > 0:
        keyword_score = round(min(100.0, (kw_weighted_sum / total_job_kws) * 100.0), 1)
    else:
        keyword_score = 75.0

    kw_explanation = f"Matched {len(matched_keywords_list)} of {total_job_kws} technical and domain keywords found in the job description."

    # ---------------- 2. SKILLS MATCH SCORE (20%) ----------------
    mandatory_skills = job_intelligence.get("mandatory_skills", [])
    preferred_skills = job_intelligence.get("preferred_skills", [])
    
    matched_mandatory = 0
    total_mandatory = len(mandatory_skills)
    skill_gaps_list = []

    for mand in mandatory_skills:
        skill_name = mand["skill"]
        canonical = mand["canonical"]
        category = mand["category"]
        
        match_res = match_keyword_against_resume(
            canonical, resume_text, resume_kw_map, resume_sections
        )
        if match_res["matched"]:
            matched_mandatory += 1
            skill_gaps_list.append({
                "skill": skill_name,
                "category": category,
                "importance": "Critical",
                "status": "Have",
                "job_requirement_level": "Mandatory",
                "recommendation": f"Verified in your resume ({match_res['match_type']})."
            })
        else:
            skill_gaps_list.append({
                "skill": skill_name,
                "category": category,
                "importance": "Critical",
                "status": "Missing",
                "job_requirement_level": "Mandatory",
                "recommendation": f"Critical requirement: Add {skill_name} if you have practical experience with it."
            })

    matched_preferred = 0
    total_preferred = len(preferred_skills)
    for pref in preferred_skills:
        canonical = pref["canonical"]
        match_res = match_keyword_against_resume(
            canonical, resume_text, resume_kw_map, resume_sections
        )
        if match_res["matched"]:
            matched_preferred += 1
            skill_gaps_list.append({
                "skill": pref["skill"],
                "category": pref["category"],
                "importance": "Optional",
                "status": "Have",
                "job_requirement_level": "Preferred",
                "recommendation": f"Bonus qualification satisfied ({match_res['match_type']})."
            })
        else:
            skill_gaps_list.append({
                "skill": pref["skill"],
                "category": pref["category"],
                "importance": "Optional",
                "status": "Missing",
                "job_requirement_level": "Preferred",
                "recommendation": f"Preferred bonus skill: consider highlighting {pref['skill']} if applicable."
            })

    if total_mandatory > 0:
        base_mand_score = (matched_mandatory / total_mandatory) * 85.0
        bonus_pref_score = (matched_preferred / max(1, total_preferred)) * 15.0 if total_preferred > 0 else 15.0
        skills_score = round(min(100.0, base_mand_score + bonus_pref_score), 1)
        skills_explanation = f"Matched {matched_mandatory}/{total_mandatory} mandatory requirements and {matched_preferred}/{max(1, total_preferred)} preferred skills."
    else:
        skills_score = keyword_score
        skills_explanation = f"Skills evaluated against generalized technology taxonomy ({len(matched_keywords_list)} matched)."

    # ---------------- 3. EXPERIENCE RELEVANCE SCORE (15%) ----------------
    exp_text = resume_sections.get("experience", "")
    req_exp_years = job_intelligence.get("min_experience_years", 0)
    
    # Calculate years of experience from resume text
    year_numbers = [int(y) for y in re.findall(r'\b(20\d\d|19\d\d)\b', exp_text)]
    exp_years_found = 0
    if len(year_numbers) >= 2:
        valid_years = sorted([y for y in year_numbers if 1990 <= y <= 2026])
        if len(valid_years) >= 2:
            exp_years_found = max(1, valid_years[-1] - valid_years[0])
            
    # Semantic alignment between experience text and job description
    exp_semantic_sim = compute_cosine_similarity(exp_text, job_text)
    
    if req_exp_years == 0:
        # No strict years requirement specified
        exp_score = round(min(100.0, 60.0 + (exp_semantic_sim * 40.0)), 1)
        exp_explanation = f"Demonstrates relevant work experience with {round(exp_semantic_sim * 100)}% contextual topic alignment."
    else:
        if exp_years_found >= req_exp_years:
            exp_score = round(min(100.0, 75.0 + (exp_semantic_sim * 25.0)), 1)
            exp_explanation = f"Exceeds required {req_exp_years} years of experience (~{exp_years_found} yrs detected)."
        elif exp_years_found > 0:
            exp_score = round(max(30.0, (exp_years_found / req_exp_years) * 70.0 + (exp_semantic_sim * 30.0)), 1)
            exp_explanation = f"Experience gap: JD specifies {req_exp_years}+ years; resume indicates ~{exp_years_found} years."
        else:
            exp_score = round(min(100.0, 50.0 + (exp_semantic_sim * 50.0)), 1)
            exp_explanation = f"Contextual experience relevance calculated at {round(exp_semantic_sim * 100)}% based on responsibilities."

    # ---------------- 4. EDUCATION MATCH SCORE (10%) ----------------
    edu_text = resume_sections.get("education", "").lower()
    edu_score = 60.0
    edu_explanation = "Education requirements partially verified."
    
    if any(k in edu_text for k in ["bachelor", "b.s.", "bs in", "b.tech", "degree", "university", "college", "b.e."]):
        edu_score = 95.0
        edu_explanation = "Bachelor's / Undergraduate degree requirement verified."
    if any(k in edu_text for k in ["master", "m.s.", "m.tech", "phd", "doctorate"]):
        edu_score = 100.0
        edu_explanation = "Advanced Graduate degree (Master's / Ph.D.) verified."
    if not edu_text:
        edu_score = 45.0
        edu_explanation = "No dedicated 'Education' section detected. ATS may flag as missing."

    # ---------------- 5. JOB TITLE ALIGNMENT SCORE (10%) ----------------
    title_in_resume = False
    clean_target_title = target_job_title.lower()
    lower_resume = resume_text.lower()
    
    # Check title similarity
    fuzz_title_score = 0
    for line in lower_resume.split("\n")[:30]:  # check top 30 lines
        r = fuzz.partial_ratio(clean_target_title, line)
        if r > fuzz_title_score:
            fuzz_title_score = r

    if fuzz_title_score >= 85:
        job_title_score = 100.0
        job_title_explanation = f"Target job title '{target_job_title}' strongly aligned in resume header / experience."
    elif fuzz_title_score >= 60:
        job_title_score = 75.0
        job_title_explanation = f"Partial alignment between '{target_job_title}' and previous roles/headline."
    else:
        job_title_score = 50.0
        job_title_explanation = f"Direct job title alignment not found. Consider customizing your headline to reflect '{target_job_title}'."

    # ---------------- 6. RESUME STRUCTURE SCORE (10%) ----------------
    detected_count = len(resume_sections)
    essential_sections = ["contact", "summary", "skills", "experience", "education"]
    present_essentials = sum(1 for s in essential_sections if s in resume_sections)
    structure_score = round(min(100.0, (present_essentials / len(essential_sections)) * 80.0 + (detected_count * 2.5)), 1)
    structure_explanation = f"Detected {present_essentials}/{len(essential_sections)} critical ATS sections ({', '.join(resume_sections.keys())})."

    # ---------------- 7. ATS FORMATTING SCORE (5%) ----------------
    formatting_risks = check_ats_compatibility(resume_metadata, resume_sections, resume_text)
    risk_count = sum(1 for r in formatting_risks if r["severity"] == "RISK")
    warn_count = sum(1 for r in formatting_risks if r["severity"] == "WARNING")
    
    formatting_score = max(20.0, 100.0 - (risk_count * 25.0) - (warn_count * 10.0))
    formatting_explanation = f"Assessed formatting: {risk_count} critical parsing risks and {warn_count} structural warnings detected."

    # ---------------- OVERALL SCORE ----------------
    overall = (
        (keyword_score * WEIGHTS["keyword_match"]) +
        (skills_score * WEIGHTS["skills_match"]) +
        (exp_score * WEIGHTS["experience_relevance"]) +
        (edu_score * WEIGHTS["education_match"]) +
        (job_title_score * WEIGHTS["job_title_alignment"]) +
        (structure_score * WEIGHTS["resume_structure"]) +
        (formatting_score * WEIGHTS["ats_formatting"])
    )
    overall_score = round(overall, 1)

    breakdown = {
        "keyword_match": {
            "score": keyword_score,
            "weight_percentage": 30.0,
            "weighted_score": round(keyword_score * 0.30, 1),
            "explanation": kw_explanation
        },
        "skills_match": {
            "score": skills_score,
            "weight_percentage": 20.0,
            "weighted_score": round(skills_score * 0.20, 1),
            "explanation": skills_explanation
        },
        "experience_relevance": {
            "score": exp_score,
            "weight_percentage": 15.0,
            "weighted_score": round(exp_score * 0.15, 1),
            "explanation": exp_explanation
        },
        "education_match": {
            "score": edu_score,
            "weight_percentage": 10.0,
            "weighted_score": round(edu_score * 0.10, 1),
            "explanation": edu_explanation
        },
        "job_title_alignment": {
            "score": job_title_score,
            "weight_percentage": 10.0,
            "weighted_score": round(job_title_score * 0.10, 1),
            "explanation": job_title_explanation
        },
        "resume_structure": {
            "score": structure_score,
            "weight_percentage": 10.0,
            "weighted_score": round(structure_score * 0.10, 1),
            "explanation": structure_explanation
        },
        "ats_formatting": {
            "score": formatting_score,
            "weight_percentage": 5.0,
            "weighted_score": round(formatting_score * 0.05, 1),
            "explanation": formatting_explanation
        }
    }

    # Bullet feedback
    bullet_analysis = analyze_bullet_points(
        resume_sections.get("experience", ""),
        resume_sections.get("projects", "")
    )

    return {
        "overall_score": overall_score,
        "breakdown": breakdown,
        "matched_keywords": matched_keywords_list,
        "missing_keywords": missing_keywords_list,
        "skill_gaps": skill_gaps_list,
        "formatting_risks": formatting_risks,
        "bullet_analysis": bullet_analysis,
    }
