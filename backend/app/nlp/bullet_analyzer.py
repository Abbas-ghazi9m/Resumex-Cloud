import re
from typing import List, Dict, Any

WEAK_VERB_PATTERNS = [
    (r"^(?:worked on|worked with)\b", "Worked on", "Architected / Engineered / Built"),
    (r"^(?:helped with|helped to|assisted in|assisted with)\b", "Helped with", "Collaborated to deliver / Spearheaded / Co-engineered"),
    (r"^(?:responsible for|in charge of)\b", "Responsible for", "Orchestrated / Led development of / Directed"),
    (r"^(?:participated in|took part in)\b", "Participated in", "Contributed to design of / Co-developed"),
    (r"^(?:handled|handled tasks related to)\b", "Handled", "Streamlined / Automated / Resolved"),
    (r"^(?:did|did work on)\b", "Did work", "Implemented / Executed / Delivered"),
    (r"^(?:supported|supported the team)\b", "Supported", "Bolstered system reliability for / Maintained and elevated"),
]

STRONG_ACTION_VERBS = [
    "architected", "engineered", "spearheaded", "optimized", "deployed", "scaled",
    "automated", "streamlined", "designed", "implemented", "refactored", "integrated",
    "accelerated", "reduced", "delivered", "mentored", "orchestrated", "consolidated"
]

METRIC_INDICATORS = [
    r'\d+%', r'\$\d+', r'\b\d+\s*(?:ms|seconds|minutes|hours)\b',
    r'\b\d+x\b', r'\b(?:reduced|increased|improved|boosted|saved)\s+by\s+\d+',
    r'\b\d+\s*(?:million|k|users|requests|queries|rps|tb|gb)\b',
    r'\b\d+\s*(?:engineers|developers|clients|customers)\b'
]

def analyze_bullet_points(experience_text: str, projects_text: str = "") -> List[Dict[str, Any]]:
    """
    Scans bullet points for weak language and missing measurable achievements.
    Provides actionable, non-hallucinated rewrite suggestions.
    """
    combined = f"{experience_text}\n{projects_text}"
    lines = [l.strip() for l in combined.split("\n") if l.strip()]
    
    analyzed_bullets = []
    
    for line in lines:
        # Check if line looks like a bullet or sentence
        clean_line = re.sub(r'^[•\-\*\–\d\.\)]\s*', '', line).strip()
        if len(clean_line.split()) < 4:
            continue
            
        lower_line = clean_line.lower()
        first_word = lower_line.split()[0] if lower_line.split() else ""
        
        # Check for weak verbs
        matched_weak = None
        for pattern, weak_term, strong_replacement in WEAK_VERB_PATTERNS:
            if re.search(pattern, lower_line):
                matched_weak = (weak_term, strong_replacement)
                break
                
        # Check metrics
        has_metric = any(re.search(pat, lower_line) for pat in METRIC_INDICATORS)
        has_action_verb = first_word in STRONG_ACTION_VERBS or any(v in lower_line for v in STRONG_ACTION_VERBS)
        
        if matched_weak:
            weak_term, replacement = matched_weak
            # Generate suggestion
            improved = re.sub(
                rf'^{re.escape(weak_term)}', 
                replacement.split(' / ')[0], 
                clean_line, 
                flags=re.IGNORECASE
            )
            metric_hint = " (Note: Append quantifiable business metrics e.g., latency reduction or user count if applicable)" if not has_metric else ""
            
            analyzed_bullets.append({
                "original_bullet": clean_line,
                "issue": f"Passive phrasing detected ('{weak_term}'). Weakens ATS impact.",
                "suggested_bullet": f"{improved}{metric_hint}",
                "impact": "High — Replacing passive phrasing with decisive action verbs immediately elevates candidate seniority rank.",
                "action_verb_detected": False,
                "has_measurable_outcome": has_metric
            })
        elif not has_metric and len(clean_line.split()) > 7:
            # Bullet lacks quantification
            analyzed_bullets.append({
                "original_bullet": clean_line,
                "issue": "Lacks measurable impact or quantified outcome.",
                "suggested_bullet": f"{clean_line} — [Quantify result: e.g. reducing build times by X% or scaling to Y users]",
                "impact": "Medium — Recruiters and modern ATS scoring algorithms prioritize metrics (%, $, latency, throughput).",
                "action_verb_detected": has_action_verb,
                "has_measurable_outcome": False
            })

    # Return top 6 most relevant bullet suggestions
    return analyzed_bullets[:6]
