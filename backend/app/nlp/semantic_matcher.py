import re
from typing import Dict, List, Tuple, Any
from rapidfuzz import fuzz
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.nlp.keyword_extractor import SYNONYMS, normalize_term

def compute_cosine_similarity(text1: str, text2: str) -> float:
    """Computes TF-IDF cosine similarity between two texts"""
    if not text1.strip() or not text2.strip():
        return 0.0
    try:
        vectorizer = TfidfVectorizer(stop_words='english', token_pattern=r'(?u)\b\w+\b')
        tfidf_matrix = vectorizer.fit_transform([text1, text2])
        sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        return round(float(sim), 4)
    except Exception:
        # Fallback to Jaccard set similarity
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        if not words1 or not words2:
            return 0.0
        intersection = len(words1.intersection(words2))
        union = len(words1.union(words2))
        return round(intersection / union, 4)

def match_keyword_against_resume(
    target_keyword: str,
    resume_text: str,
    resume_keyword_map: Dict[str, Any],
    resume_sections: Dict[str, str]
) -> Dict[str, Any]:
    """
    Evaluates target_keyword against resume text using 7 tiers of matching:
    1. Exact match
    2. Normalized match
    3. Synonym match
    4. Phrase match
    5. Fuzzy match
    6. Section-specific match
    7. Semantic similarity
    """
    clean_target = target_keyword.lower().strip()
    norm_target = normalize_term(clean_target)
    lower_resume = resume_text.lower()
    
    # Tier 1 & 2: Exact or Normalized match in pre-extracted map
    if norm_target in resume_keyword_map:
        kw_data = resume_keyword_map[norm_target]
        return {
            "matched": True,
            "match_type": "Exact Match",
            "confidence": 1.0,
            "resume_occurrences": kw_data["frequency"],
            "section_found": find_keyword_section(norm_target, resume_sections)
        }

    # Tier 3: Synonym Match
    for syn_key, syn_val in SYNONYMS.items():
        if (norm_target == syn_key or norm_target == syn_val) and (syn_key in resume_keyword_map or syn_val in resume_keyword_map):
            found_key = syn_key if syn_key in resume_keyword_map else syn_val
            kw_data = resume_keyword_map[found_key]
            return {
                "matched": True,
                "match_type": "Synonym Match",
                "confidence": 0.95,
                "resume_occurrences": kw_data["frequency"],
                "section_found": find_keyword_section(found_key, resume_sections)
            }

    # Tier 4: Phrase substring match
    pattern = rf'(?<!\w){re.escape(clean_target)}(?!\w)'
    phrase_matches = list(re.finditer(pattern, lower_resume))
    if phrase_matches:
        return {
            "matched": True,
            "match_type": "Phrase Match",
            "confidence": 0.92,
            "resume_occurrences": len(phrase_matches),
            "section_found": find_keyword_section(clean_target, resume_sections)
        }

    # Tier 5: Fuzzy Match using rapidfuzz against tokens in resume
    # Check best matching token or bigram
    words = lower_resume.split()
    best_fuzzy_score = 0
    matched_word = None
    
    # Sample candidate tokens to keep performance fast
    candidate_tokens = set(words)
    for token in candidate_tokens:
        if abs(len(token) - len(clean_target)) <= 3 and len(token) >= 4:
            ratio = fuzz.ratio(clean_target, token)
            if ratio > best_fuzzy_score:
                best_fuzzy_score = ratio
                matched_word = token

    if best_fuzzy_score >= 88:
        return {
            "matched": True,
            "match_type": "Fuzzy Match",
            "confidence": round(best_fuzzy_score / 100.0, 2),
            "resume_occurrences": 1,
            "section_found": find_keyword_section(matched_word, resume_sections)
        }

    # Tier 6 & 7: Semantic Similarity check against context
    # Check if target appears semantically in experience or skills text
    context_text = f"{resume_sections.get('skills', '')} {resume_sections.get('experience', '')}"
    sim = compute_cosine_similarity(clean_target, context_text)
    if sim >= 0.35:
        return {
            "matched": True,
            "match_type": "Semantic Match",
            "confidence": round(sim, 2),
            "resume_occurrences": 1,
            "section_found": "Experience / Context"
        }

    # No match found
    return {
        "matched": False,
        "match_type": "Missing",
        "confidence": 0.0,
        "resume_occurrences": 0,
        "section_found": None
    }

def find_keyword_section(term: str, sections: Dict[str, str]) -> str:
    lower_term = term.lower()
    for sec_name, content in sections.items():
        if lower_term in content.lower():
            return sec_name.title()
    return "Body"
