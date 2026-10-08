import re
from typing import Dict, List, Any
from app.nlp.keyword_extractor import extract_keywords_from_text, normalize_term

MANDATORY_MARKERS = [
    r"must have", r"required", r"requirements", r"minimum qualifications",
    r"essential", r"mandatory", r"you need", r"experience with"
]

PREFERRED_MARKERS = [
    r"nice to have", r"preferred", r"bonus", r"plus", r"ideal candidate",
    r"advantageous", r"good to have", r"optional"
]

EXPERIENCE_YEARS_PATTERNS = [
    r'(\d+)\+?\s*(?:to\s*(\d+))?\s*(?:years?|yrs?)(?:\s*of)?\s*(?:relevant|industry|professional|work)?\s*experience',
    r'minimum\s*(?:of)?\s*(\d+)\s*years?',
    r'at least\s*(\d+)\s*years?'
]

EDUCATION_PATTERNS = {
    "bachelor": [r"bachelor", r"b\.s\.", r"bs in", r"b\.tech", r"undergraduate", r"b\.e\."],
    "master": [r"master", r"m\.s\.", r"ms in", r"m\.tech", r"postgraduate", r"m\.e\."],
    "phd": [r"phd", r"ph\.d\.", r"doctorate"]
}

def extract_job_intelligence(job_text: str) -> Dict[str, Any]:
    """
    Parses a job description to extract mandatory skills, preferred skills,
    required years of experience, and education expectations.
    """
    lower_text = job_text.lower()
    paragraphs = [p.strip() for p in job_text.split("\n\n") if p.strip()]
    
    # 1. Experience Years extraction
    min_exp_years = 0
    max_exp_years = 0
    for pat in EXPERIENCE_YEARS_PATTERNS:
        match = re.search(pat, lower_text)
        if match:
            groups = match.groups()
            if groups[0]:
                min_exp_years = int(groups[0])
            if len(groups) > 1 and groups[1]:
                max_exp_years = int(groups[1])
            break

    # 2. Education requirement extraction
    required_education = "Bachelor's Degree or Equivalent"
    for level, patterns in EDUCATION_PATTERNS.items():
        for pat in patterns:
            if re.search(pat, lower_text):
                if level == "phd":
                    required_education = "Ph.D. in Computer Science or related"
                elif level == "master":
                    required_education = "Master's Degree in Computer Science or related"
                elif level == "bachelor":
                    required_education = "Bachelor's Degree in Computer Science or related"

    # 3. Keyword extraction from full job text
    all_job_keywords = extract_keywords_from_text(job_text)["keywords"]

    # 4. Mandatory vs Preferred separation
    mandatory_skills = []
    preferred_skills = []
    
    # Split JD into sections if markers exist
    mandatory_blocks = []
    preferred_blocks = []
    current_block_type = "mandatory"  # Default assumption
    
    for line in job_text.split("\n"):
        lower_line = line.lower()
        if any(re.search(pat, lower_line) for pat in PREFERRED_MARKERS):
            current_block_type = "preferred"
        elif any(re.search(pat, lower_line) for pat in MANDATORY_MARKERS):
            current_block_type = "mandatory"
            
        if current_block_type == "mandatory":
            mandatory_blocks.append(line)
        else:
            preferred_blocks.append(line)

    mandatory_text = " ".join(mandatory_blocks).lower()
    preferred_text = " ".join(preferred_blocks).lower()

    for kw in all_job_keywords:
        term = kw["term"]
        is_pref = any(term in preferred_text for _ in [1]) and not (term in mandatory_text)
        
        item = {
            "skill": kw["display_name"],
            "canonical": term,
            "category": kw["category"],
            "frequency": kw["frequency"],
            "importance": "Preferred" if is_pref else "Critical" if kw["frequency"] >= 2 else "Important"
        }
        
        if is_pref:
            preferred_skills.append(item)
        else:
            mandatory_skills.append(item)

    return {
        "min_experience_years": min_exp_years,
        "max_experience_years": max_exp_years,
        "required_education": required_education,
        "mandatory_skills": mandatory_skills,
        "preferred_skills": preferred_skills,
        "total_requirements_count": len(mandatory_skills) + len(preferred_skills)
    }
