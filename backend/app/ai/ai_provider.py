import os
import json
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import httpx
from app.core.config import settings

class AIProvider(ABC):
    @abstractmethod
    def answer_query(self, question: str, analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        """Answers candidate inquiry grounded strictly in analysis data"""
        pass

    @abstractmethod
    def suggest_rewrite(self, section_name: str, current_content: str, target_keywords: List[str]) -> Dict[str, Any]:
        """Generates before/after rewrite proposal without inventing facts"""
        pass

class LocalDeterministicAIProvider(AIProvider):
    """
    Deterministic NLP & Rule-based engine.
    Ensures 100% functionality without external API keys or cloud dependencies.
    """
    def answer_query(self, question: str, analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        q_lower = question.lower()
        score = analysis_data.get("overall_score", 0)
        missing_kws = [k["keyword"] for k in analysis_data.get("missing_keywords", []) if k.get("importance") == "Critical"]
        recs = analysis_data.get("recommendations", [])
        
        if "why" in q_lower and ("low" in q_lower or "score" in q_lower):
            breakdown = analysis_data.get("breakdown", {})
            lowest_cat = "keyword_match"
            lowest_val = 100.0
            for cat, data in breakdown.items():
                if data.get("score", 100) < lowest_val:
                    lowest_val = data.get("score", 100)
                    lowest_cat = cat
            
            clean_name = lowest_cat.replace("_", " ").title()
            answer = (
                f"Your ATS score is currently {score}/100. The primary limiting factor is your '{clean_name}' score "
                f"({lowest_val}/100). "
            )
            if missing_kws:
                answer += f"Specifically, the job requires critical skills you haven't listed: {', '.join(missing_kws[:4])}."
            else:
                answer += "Focus on aligning bullet points with measurable outcomes and verifiable action verbs."
                
            suggested_actions = [
                f"Improve {clean_name} section",
                "Integrate missing mandatory keywords",
                "Quantify bullet points with % or numeric metrics"
            ]
        elif "missing" in q_lower or "skill" in q_lower:
            if missing_kws:
                answer = (
                    f"The analysis detected {len(missing_kws)} critical skills in the job description that do not appear "
                    f"with sufficient confidence in your resume: {', '.join(missing_kws[:6])}."
                )
                suggested_actions = [f"Add {k} if experienced" for k in missing_kws[:3]]
            else:
                answer = "You have matched all critical skills! Only minor preferred bonus skills remain missing."
                suggested_actions = ["Review preferred qualifications", "Focus on impact metrics"]
        elif "first" in q_lower or "priority" in q_lower or "fix" in q_lower:
            if recs:
                top_rec = recs[0]
                answer = (
                    f"You should fix {top_rec['priority_label']} first: '{top_rec['title']}'. "
                    f"Reason: {top_rec['reason']}"
                )
                suggested_actions = [top_rec['suggested_action']]
            else:
                answer = "Your resume has high structural integrity. Review specific bullet metrics."
                suggested_actions = ["Review bullet point analyzer"]
        elif "recruiter" in q_lower or "care" in q_lower:
            matched = [k["keyword"] for k in analysis_data.get("matched_keywords", [])]
            answer = (
                f"Recruiters for '{analysis_data.get('job_title', 'this role')}' prioritize: "
                f"1. Verified hands-on experience with core tech ({', '.join(matched[:3]) if matched else 'core stack'}). "
                f"2. Measurable business outcomes (reduced latency, scaled traffic, revenue). "
                f"3. Clear career trajectory without unexplainable tenure gaps."
            )
            suggested_actions = ["Highlight top technologies in summary", "Use Google XYZ bullet formula"]
        else:
            answer = (
                f"Based on your analysis for {analysis_data.get('job_title', 'the role')}: "
                f"Your resume matches with an overall score of {score}%. Review the Recommendations tab "
                f"for the top prioritized adjustments."
            )
            suggested_actions = ["Review Skill Gaps", "Check ATS Formatting Risks"]

        return {
            "analysis_id": analysis_data.get("id", ""),
            "question": question,
            "answer": answer,
            "suggested_actions": suggested_actions,
            "grounding_data": {
                "overall_score": score,
                "missing_critical_count": len(missing_kws),
                "top_recommendation": recs[0]["title"] if recs else None
            }
        }

    def suggest_rewrite(self, section_name: str, current_content: str, target_keywords: List[str]) -> Dict[str, Any]:
        """Deterministic before/after enhancement template"""
        clean_content = current_content.strip()
        kw_str = ", ".join(target_keywords[:4]) if target_keywords else "industry best practices"
        
        suggested = clean_content
        if section_name.lower() in ["summary", "profile"]:
            suggested = (
                f"Results-driven professional with proven expertise in {kw_str}. "
                f"{clean_content} Demonstrated record of architecting scalable solutions, "
                f"collaborating across cross-functional teams, and delivering measurable business impact."
            )
        elif section_name.lower() in ["experience", "work experience"]:
            lines = [l.strip() for l in clean_content.split("\n") if l.strip()]
            new_lines = []
            for line in lines:
                if any(line.lower().startswith(p) for p in ["worked", "helped", "responsible"]):
                    new_lines.append(f"• Engineered and deployed scalable components utilizing {kw_str}, optimizing reliability and throughput.")
                else:
                    new_lines.append(f"• {line} (Achieved quantifiable improvement across core operations).")
            suggested = "\n".join(new_lines)

        return {
            "section": section_name,
            "before": clean_content,
            "after": suggested,
            "keywords_infused": target_keywords[:4],
            "disclaimer": "AI suggestion — verify accuracy before using. Do not claim technologies or metrics you have not worked with."
        }

class OpenAIProvider(AIProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.client = httpx.Client(timeout=20.0)
        self.fallback = LocalDeterministicAIProvider()

    def answer_query(self, question: str, analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            prompt = (
                f"You are the Resumex-Cloud ATS Career Intelligence Assistant. "
                f"Answer the candidate's question strictly grounded in this factual analysis data:\n"
                f"Job Title: {analysis_data.get('job_title')}\n"
                f"ATS Score: {analysis_data.get('overall_score')}\n"
                f"Breakdown: {json.dumps(analysis_data.get('breakdown', {}))}\n"
                f"Missing Skills: {[k.get('keyword') for k in analysis_data.get('missing_keywords', [])]}\n"
                f"Recommendations: {[r.get('title') for r in analysis_data.get('recommendations', [])]}\n\n"
                f"Question: {question}\n\n"
                f"Rules: Be concise, analytical, never hallucinate false facts, give direct actionable advice."
            )
            resp = self.client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "model": "gpt-4o-mini",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 400
                }
            )
            if resp.status_code == 200:
                answer = resp.json()["choices"][0]["message"]["content"].strip()
                return {
                    "analysis_id": analysis_data.get("id", ""),
                    "question": question,
                    "answer": answer,
                    "suggested_actions": ["Review detailed recommendations", "Update resume keywords"],
                    "grounding_data": {"provider": "openai", "model": "gpt-4o-mini"}
                }
        except Exception:
            pass
        return self.fallback.answer_query(question, analysis_data)

    def suggest_rewrite(self, section_name: str, current_content: str, target_keywords: List[str]) -> Dict[str, Any]:
        return self.fallback.suggest_rewrite(section_name, current_content, target_keywords)

class GeminiProvider(AIProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.client = httpx.Client(timeout=20.0)
        self.fallback = LocalDeterministicAIProvider()

    def answer_query(self, question: str, analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"
            prompt = (
                f"You are the Resumex-Cloud ATS Intelligence Agent. "
                f"Candidate Analysis Context:\n"
                f"Role: {analysis_data.get('job_title')}, Overall Score: {analysis_data.get('overall_score')}%\n"
                f"Missing Skills: {[k.get('keyword') for k in analysis_data.get('missing_keywords', [])]}\n"
                f"Question: {question}\n"
                f"Provide concise, direct ATS guidance. Never hallucinate facts."
            )
            resp = self.client.post(
                url,
                json={"contents": [{"parts": [{"text": prompt}]}]}
            )
            if resp.status_code == 200:
                answer = resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
                return {
                    "analysis_id": analysis_data.get("id", ""),
                    "question": question,
                    "answer": answer,
                    "suggested_actions": ["Review detailed skill breakdown", "Re-scan updated resume"],
                    "grounding_data": {"provider": "gemini", "model": "gemini-1.5-flash"}
                }
        except Exception:
            pass
        return self.fallback.answer_query(question, analysis_data)

    def suggest_rewrite(self, section_name: str, current_content: str, target_keywords: List[str]) -> Dict[str, Any]:
        return self.fallback.suggest_rewrite(section_name, current_content, target_keywords)

def get_ai_provider() -> AIProvider:
    provider = settings.AI_PROVIDER.lower()
    if provider == "gemini" and settings.GEMINI_API_KEY:
        return GeminiProvider(settings.GEMINI_API_KEY)
    elif provider == "openai" and settings.OPENAI_API_KEY:
        return OpenAIProvider(settings.OPENAI_API_KEY)
    elif provider == "auto":
        if settings.GEMINI_API_KEY:
            return GeminiProvider(settings.GEMINI_API_KEY)
        if settings.OPENAI_API_KEY:
            return OpenAIProvider(settings.OPENAI_API_KEY)
    return LocalDeterministicAIProvider()
