from typing import List, Dict, Any

def check_ats_compatibility(
    resume_meta: Dict[str, Any],
    sections: Dict[str, str],
    raw_text: str
) -> List[Dict[str, Any]]:
    """
    Evaluates physical and structural document compatibility with ATS parsing engines.
    """
    risks = []
    
    # 1. Multi-column layout check
    two_col = resume_meta.get("two_column_risk", False)
    if two_col:
        risks.append({
            "severity": "WARNING",
            "category": "Layout Structure",
            "title": "Two-Column Layout Detected",
            "description": "Text layout appears multi-column. Legacy ATS engines parse multi-column PDFs horizontally across columns, interleaving job titles and unrelated dates.",
            "recommendation": "Switch to a clean single-column chronological layout to ensure 100% deterministic text stream extraction."
        })
    else:
        risks.append({
            "severity": "SAFE",
            "category": "Layout Structure",
            "title": "Single-Column Text Stream",
            "description": "Standard linear reading flow detected. Compatible with Workday, Greenhouse, Taleo, and Lever ATS parsers.",
            "recommendation": "Maintain linear section hierarchy."
        })

    # 2. Scanned / Image Check
    is_scanned = resume_meta.get("is_scanned", False)
    image_count = resume_meta.get("image_count", 0)
    if is_scanned:
        risks.append({
            "severity": "RISK",
            "category": "OCR & Extraction",
            "title": "Document Relies on Images / Scanned Content",
            "description": "ATS parsers cannot index text flattened inside bitmap images without OCR pre-processing. Critical keywords will be invisible to recruiters.",
            "recommendation": "Re-export resume directly from Word or Google Docs as a searchable vector text PDF."
        })
    elif image_count > 3:
        risks.append({
            "severity": "WARNING",
            "category": "Media Elements",
            "title": "Multiple Embedded Images / Icons Detected",
            "description": f"Found {image_count} embedded graphical elements. Decorative skill progress bars and graphical icons often confuse ATS text streams.",
            "recommendation": "Remove graphic icons and skill proficiency charts; use plain text bullet points."
        })

    # 3. Tables Check
    has_tables = resume_meta.get("has_tables", False)
    if has_tables:
        risks.append({
            "severity": "WARNING",
            "category": "Table Formatting",
            "title": "Nested Tables Detected",
            "description": "Embedded table cells can cause ATS scrapers to truncate text or merge cell contents improperly.",
            "recommendation": "Replace tabular skill grids with clean comma-separated lists or bullet lists."
        })

    # 4. Contact Information Check
    contact = sections.get("contact", "")
    has_email = "@" in contact or "@" in raw_text
    has_phone = any(char.isdigit() for char in contact)
    if not has_email:
        risks.append({
            "severity": "RISK",
            "category": "Contact Information",
            "title": "Missing or Unparsable Email Address",
            "description": "No valid email address was detected in the contact header or body. ATS candidate creation will fail or flag incomplete profile.",
            "recommendation": "Place your professional email clearly in the top header as plain text."
        })
    if not has_phone:
        risks.append({
            "severity": "WARNING",
            "category": "Contact Information",
            "title": "Missing Phone Number in Header",
            "description": "Standard recruiter outreach requires a normalized telephone number.",
            "recommendation": "Add your phone number with country/area code in the header."
        })

    # 5. Core Sections Completeness Check
    has_exp = bool(sections.get("experience"))
    has_skills = bool(sections.get("skills"))
    has_edu = bool(sections.get("education"))

    if not has_exp:
        risks.append({
            "severity": "RISK",
            "category": "Core Structure",
            "title": "Missing 'Experience' Section Header",
            "description": "Standard ATS indexing engines require a clearly labeled 'Experience' or 'Work Experience' section heading.",
            "recommendation": "Use standard canonical header 'Work Experience' or 'Professional Experience'."
        })
    if not has_skills:
        risks.append({
            "severity": "WARNING",
            "category": "Core Structure",
            "title": "Missing Dedicated 'Skills' Section Header",
            "description": "Skills listed implicitly across paragraphs without a dedicated 'Technical Skills' section achieve 40% lower ATS extraction weights.",
            "recommendation": "Add a dedicated 'Technical Skills' section organized by category."
        })

    # 6. Length Check
    word_count = len(raw_text.split())
    if word_count < 150:
        risks.append({
            "severity": "RISK",
            "category": "Content Depth",
            "title": "Extremely Low Word Count",
            "description": f"Resume contains only {word_count} words. Insufficient density for comprehensive ATS keyword matching.",
            "recommendation": "Expand experience descriptions with specific technical contributions, projects, and metrics."
        })
    elif word_count > 1400:
        risks.append({
            "severity": "WARNING",
            "category": "Document Length",
            "title": "Length Exceeds Standard Recommendation",
            "description": f"Word count ({word_count}) indicates a 3+ page resume. Most corporate recruiters recommend 1-2 pages for maximum retention.",
            "recommendation": "Condense older roles and prune non-essential bullet points to 1-2 pages."
        })

    return risks
