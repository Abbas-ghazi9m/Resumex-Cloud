import re
from typing import Dict, List, Any

# Section canonical names
CANONICAL_SECTIONS = [
    "contact",
    "summary",
    "objective",
    "skills",
    "experience",
    "projects",
    "education",
    "certifications",
    "achievements",
    "publications",
    "languages",
    "interests"
]

SECTION_HEADER_PATTERNS = {
    "contact": [r"contact", r"contact information", r"personal details", r"reach me"],
    "summary": [r"professional summary", r"summary", r"profile", r"executive summary", r"about me", r"career overview"],
    "objective": [r"career objective", r"objective"],
    "skills": [r"skills", r"technical skills", r"core competencies", r"technologies", r"skill set", r"tools & technologies", r"areas of expertise"],
    "experience": [r"work experience", r"professional experience", r"employment history", r"experience", r"career history", r"work history"],
    "projects": [r"projects", r"personal projects", r"key projects", r"academic projects", r"technical projects"],
    "education": [r"education", r"academic background", r"qualifications", r"academic history", r"educational background"],
    "certifications": [r"certifications", r"licenses", r"credentials", r"courses & certificates", r"professional certifications"],
    "achievements": [r"achievements", r"honors & awards", r"awards", r"accomplishments"],
    "publications": [r"publications", r"papers", r"research"],
    "languages": [r"languages", r"language proficiencies"],
    "interests": [r"interests", r"hobbies", r"activities"]
}

EMAIL_REGEX = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
PHONE_REGEX = r'(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?'
LINKEDIN_REGEX = r'linkedin\.com\/in\/[a-zA-Z0-9_-]+'
GITHUB_REGEX = r'github\.com\/[a-zA-Z0-9_-]+'

def extract_contact_info(text: str) -> Dict[str, Any]:
    emails = re.findall(EMAIL_REGEX, text)
    phones = re.findall(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)
    linkedin = re.findall(LINKEDIN_REGEX, text, re.IGNORECASE)
    github = re.findall(GITHUB_REGEX, text, re.IGNORECASE)
    
    # Try finding candidate name from first few non-empty lines
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    candidate_name = "Candidate"
    for line in lines[:5]:
        # If line doesn't contain email, phone, or url, and is short
        if not re.search(r'[@|/|\d{5,}]', line) and 2 <= len(line.split()) <= 4:
            candidate_name = line
            break

    return {
        "candidate_name": candidate_name,
        "email": emails[0] if emails else None,
        "phone": phones[0] if phones else None,
        "linkedin": f"https://{linkedin[0]}" if linkedin else None,
        "github": f"https://{github[0]}" if github else None,
    }

def detect_resume_sections(text: str) -> Dict[str, str]:
    """
    Splits resume text into structured logical sections based on header patterns.
    """
    lines = text.split("\n")
    sections: Dict[str, List[str]] = {sec: [] for sec in CANONICAL_SECTIONS}
    sections["unclassified"] = []
    
    current_section = "contact"
    contact_info = extract_contact_info(text)
    
    # Store contact details
    contact_summary = []
    if contact_info.get("candidate_name"):
        contact_summary.append(f"Name: {contact_info['candidate_name']}")
    if contact_info.get("email"):
        contact_summary.append(f"Email: {contact_info['email']}")
    if contact_info.get("phone"):
        contact_summary.append(f"Phone: {contact_info['phone']}")
    if contact_info.get("linkedin"):
        contact_summary.append(f"LinkedIn: {contact_info['linkedin']}")
    if contact_info.get("github"):
        contact_summary.append(f"GitHub: {contact_info['github']}")
    sections["contact"] = contact_summary

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
            
        lower_line = stripped.lower()
        clean_header = re.sub(r'[^a-zA-Z0-9\s&]', '', lower_line).strip()
        
        # Check if line looks like a header (short length, <= 5 words)
        is_header = False
        if len(clean_header.split()) <= 5:
            for section_name, patterns in SECTION_HEADER_PATTERNS.items():
                for pat in patterns:
                    if clean_header == pat or clean_header.startswith(f"{pat} ") or clean_header.endswith(f" {pat}"):
                        current_section = section_name
                        is_header = True
                        break
                if is_header:
                    break

        if not is_header:
            if current_section != "contact":  # Don't overwrite contact info
                sections[current_section].append(stripped)

    # Convert list of lines to strings
    result = {}
    for sec, content_lines in sections.items():
        joined = "\n".join(content_lines).strip()
        if joined:
            result[sec] = joined

    return result
