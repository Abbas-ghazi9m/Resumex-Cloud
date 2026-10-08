from typing import List, Dict, Any, Tuple

def generate_recommendations(
    scoring_result: Dict[str, Any],
    job_title: str,
    company: str = "Target Enterprise"
) -> Tuple[List[Dict[str, Any]], str]:
    """
    Generates prioritized, explainable recommendations strictly derived from empirical analysis.
    """
    recommendations = []
    
    # 1. Critical Missing Skills (Priority 1)
    missing_critical = [s for s in scoring_result.get("skill_gaps", []) if s["status"] == "Missing" and s["importance"] == "Critical"]
    if missing_critical:
        missing_names = ", ".join([s["skill"] for s in missing_critical[:3]])
        recommendations.append({
            "priority": 1,
            "priority_label": "Priority 1: Critical Skill Deficit",
            "category": "Skills & Keywords",
            "title": f"Integrate Core Required Skills ({missing_names})",
            "problem": f"Your resume lacks {len(missing_critical)} non-negotiable requirements explicitly emphasized in the job description: {missing_names}.",
            "reason": "Automated ATS filters configure hard binary thresholds for mandatory skills. Missing them often triggers automated rejection prior to recruiter review.",
            "suggested_action": f"If you possess hands-on exposure with {missing_names}, feature them explicitly under 'Technical Skills' and anchor them with real achievements in your 'Experience' bullets.",
            "expected_impact": f"+{min(15, len(missing_critical) * 5)} ATS points and pass automated screening filters."
        })

    # 2. Weak Bullet Points & Missing Quantifiable Metrics (Priority 2)
    bullets = scoring_result.get("bullet_analysis", [])
    weak_bullets = [b for b in bullets if not b["action_verb_detected"] or not b["has_measurable_outcome"]]
    if weak_bullets:
        example_bullet = weak_bullets[0]
        recommendations.append({
            "priority": 2,
            "priority_label": "Priority 2: Low-Impact Bullet Points",
            "category": "Experience & Impact",
            "title": "Upgrade Passive Bullets with Action Verbs & Metrics",
            "problem": f"Found {len(weak_bullets)} experience bullets relying on passive verbs or lacking quantified business outcomes.",
            "reason": "Top-tier ATS parsers and engineering hiring managers look for the Google XYZ formula: 'Accomplished [X] as measured by [Y], by doing [Z]'.",
            "suggested_action": f"Revise bullet '{example_bullet['original_bullet'][:60]}...' to decisively lead with action verbs (e.g., Architected, Optimized) and include numerical outcomes (e.g. latency, %, users).",
            "expected_impact": "+8 ATS points and significantly higher hiring manager callback conversion."
        })

    # 3. Formatting & Parsing Risks (Priority 3)
    risks = scoring_result.get("formatting_risks", [])
    severe_risks = [r for r in risks if r["severity"] in ["RISK", "WARNING"]]
    if severe_risks:
        primary_risk = severe_risks[0]
        recommendations.append({
            "priority": 3,
            "priority_label": "Priority 3: ATS Parsing Risk",
            "category": "Formatting & Layout",
            "title": primary_risk["title"],
            "problem": primary_risk["description"],
            "reason": "Structural quirks (tables, multi-column layouts, graphics) degrade parser OCR fidelity, causing text truncation or scrambling.",
            "suggested_action": primary_risk["recommendation"],
            "expected_impact": "+5 ATS points and 100% deterministic text extraction across Workday/Taleo."
        })

    # 4. Job Title Alignment (Priority 4)
    breakdown = scoring_result.get("breakdown", {})
    title_score = breakdown.get("job_title_alignment", {}).get("score", 100)
    if title_score < 80:
        recommendations.append({
            "priority": 4,
            "priority_label": "Priority 4: Title & Headline Alignment",
            "category": "Targeting & Positioning",
            "title": f"Align Headline with Target Role: '{job_title}'",
            "problem": f"Your current headline or recent titles do not closely match the exact target job title '{job_title}'.",
            "reason": "Recruiters searching internal candidate databases query exact title phrases first.",
            "suggested_action": f"Update your professional headline to '{job_title} | [Key Tech Stack]' and highlight relevant experience prominently.",
            "expected_impact": "+6 ATS points and immediate keyword relevancy validation."
        })

    # 5. Preferred Skills & Bonus Qualifications (Priority 5)
    missing_pref = [s for s in scoring_result.get("skill_gaps", []) if s["status"] == "Missing" and s["importance"] == "Optional"]
    if missing_pref:
        pref_names = ", ".join([s["skill"] for s in missing_pref[:3]])
        recommendations.append({
            "priority": 5,
            "priority_label": "Priority 5: Preferred Bonus Skills",
            "category": "Competitive Advantage",
            "title": f"Consider Adding Preferred Skills ({pref_names})",
            "problem": f"The job posting lists {pref_names} as desirable bonus skills.",
            "reason": "While not strictly mandatory, possessing preferred skills places candidates in the top decile ranking.",
            "suggested_action": f"If you have worked with {pref_names} even in side projects or coursework, include them in your skills matrix.",
            "expected_impact": "+4 ATS points and superior candidate ranking against peers."
        })

    # Executive Summary Formulation
    overall = scoring_result.get("overall_score", 0)
    status_label = "Exceptional Match" if overall >= 85 else "Strong Contender" if overall >= 70 else "Moderate Alignment" if overall >= 55 else "Significant Gaps"
    
    executive_summary = (
        f"Candidate scored {overall}% overall ATS Match for '{job_title}' at {company} ({status_label}). "
        f"{breakdown.get('skills_match', {}).get('explanation', '')} "
        f"Key optimization priority: {recommendations[0]['title'] if recommendations else 'Maintain alignment'}."
    )

    return recommendations, executive_summary
