from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field

# ----------------- Auth & User -----------------
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str
    preferred_role: Optional[str] = "Full Stack Engineer"
    experience_level: Optional[str] = "Mid-Senior"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    preferred_role: Optional[str] = None
    experience_level: Optional[str] = None
    avatar: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    avatar: Optional[str] = None
    preferred_role: Optional[str] = None
    experience_level: Optional[str] = None
    role: str = "candidate"
    created_at: Any

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# ----------------- Resume & Documents -----------------
class ResumeUploadResponse(BaseModel):
    id: str
    filename: str
    file_size_bytes: int
    file_type: str
    page_count: int
    word_count: int
    status: str = "UPLOADED"
    message: str

class ResumeResponse(BaseModel):
    id: str
    filename: str
    file_size_bytes: int
    file_type: str
    page_count: int
    word_count: int
    parsed_sections: Optional[Dict[str, Any]] = None
    ats_formatting_analysis: Optional[Dict[str, Any]] = None
    created_at: Any

# ----------------- Job Description -----------------
class JobCreate(BaseModel):
    title: str
    company: Optional[str] = "Target Enterprise"
    raw_text: str

class JobResponse(BaseModel):
    id: str
    title: str
    company: Optional[str]
    raw_text: str
    extracted_intelligence: Optional[Dict[str, Any]] = None
    created_at: Any

# ----------------- ATS & Analysis Details -----------------
class ScoreDetail(BaseModel):
    score: float
    weight_percentage: float
    weighted_score: float
    explanation: str

class ScoreBreakdown(BaseModel):
    keyword_match: ScoreDetail
    skills_match: ScoreDetail
    experience_relevance: ScoreDetail
    education_match: ScoreDetail
    job_title_alignment: ScoreDetail
    resume_structure: ScoreDetail
    ats_formatting: ScoreDetail

class MatchedKeyword(BaseModel):
    keyword: str
    category: str  # Programming Languages, Frameworks, Cloud, etc.
    match_type: str  # Exact Match, Normalized Match, Lemmatized Match, Fuzzy Match, Semantic Similarity
    confidence: float
    resume_occurrences: int
    job_occurrences: int
    suggested_section: Optional[str] = None

class MissingKeyword(BaseModel):
    keyword: str
    category: str
    importance: str  # Critical, Important, Optional
    job_occurrences: int
    suggested_section: str
    recommendation: str

class SkillGap(BaseModel):
    skill: str
    category: str
    importance: str  # Critical, Important, Optional
    status: str  # Have, Partial, Missing
    job_requirement_level: str  # Mandatory, Preferred, Optional
    recommendation: str

class BulletFeedback(BaseModel):
    original_bullet: str
    issue: str
    suggested_bullet: str
    impact: str
    action_verb_detected: bool
    has_measurable_outcome: bool

class Recommendation(BaseModel):
    priority: int  # 1 to 5
    priority_label: str  # Priority 1: Critical, etc.
    category: str
    title: str
    problem: str
    reason: str
    suggested_action: str
    expected_impact: str

class ATSFormattingRisk(BaseModel):
    severity: str  # SAFE, WARNING, RISK
    category: str
    title: str
    description: str
    recommendation: str

class AnalysisRequest(BaseModel):
    resume_id: str
    job_id: Optional[str] = None
    job_title: Optional[str] = None
    job_company: Optional[str] = None
    job_text: Optional[str] = None  # Inline pasted job description

class QuickAnalysisRequest(BaseModel):
    resume_text: str
    job_text: str
    job_title: Optional[str] = "Software Engineer"
    candidate_name: Optional[str] = "Candidate"

class AnalysisResponse(BaseModel):
    id: str
    resume_id: str
    job_id: str
    job_title: str
    company: Optional[str]
    candidate_name: Optional[str] = None
    overall_score: float
    breakdown: ScoreBreakdown
    matched_keywords: List[MatchedKeyword]
    missing_keywords: List[MissingKeyword]
    skill_gaps: List[SkillGap]
    bullet_analysis: List[BulletFeedback]
    recommendations: List[Recommendation]
    formatting_risks: List[ATSFormattingRisk]
    executive_summary: str
    processing_duration_ms: int
    created_at: Any
    is_demo: bool = False

class AnalysisListItem(BaseModel):
    id: str
    resume_id: str
    resume_filename: str
    job_id: str
    job_title: str
    company: Optional[str]
    overall_score: float
    status: str
    processing_duration_ms: int
    created_at: Any
    is_demo: bool = False

# ----------------- Optimization Assistant -----------------
class AssistantQueryRequest(BaseModel):
    analysis_id: str
    question: str

class AssistantQueryResponse(BaseModel):
    analysis_id: str
    question: str
    answer: str
    suggested_actions: List[str]
    grounding_data: Dict[str, Any]

# ----------------- Report -----------------
class ReportResponse(BaseModel):
    id: str
    analysis_id: str
    share_token: str
    pdf_filename: str
    download_url: str
    share_url: str
    created_at: Any

# ----------------- Recruiter Mode -----------------
class RecruiterCandidateItem(BaseModel):
    id: str
    candidate_name: str
    candidate_email: Optional[str]
    resume_filename: str
    ats_score: float
    skills_score: float
    experience_score: float
    education_score: float
    top_matched_skills: List[str]
    critical_missing_skills: List[str]
    recommendation_verdict: str
    rank: int

class RecruiterJobDetail(BaseModel):
    id: str
    title: str
    department: Optional[str]
    created_at: Any
    candidate_count: int
    candidates: List[RecruiterCandidateItem]

# ----------------- Cloud & Health -----------------
class CloudEventItem(BaseModel):
    id: str
    event_type: str
    level: str
    message: str
    metadata: Optional[Dict[str, Any]] = None
    created_at: Any

class CloudStats(BaseModel):
    documents_processed: int
    successful_jobs: int
    failed_jobs: int
    average_processing_time_ms: float
    average_document_size_kb: float
    analysis_throughput_per_min: float
    active_storage_provider: str
    active_ai_provider: str
    database_connected: bool
    storage_healthy: bool

class HealthResponse(BaseModel):
    status: str
    version: str
    environment: str
    services: Dict[str, str]
