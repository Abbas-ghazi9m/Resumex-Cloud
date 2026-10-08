import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, Integer, Float, Boolean, 
    DateTime, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    avatar = Column(String(512), nullable=True)
    preferred_role = Column(String(255), nullable=True, default="Full Stack Engineer")
    experience_level = Column(String(50), nullable=True, default="Mid-Senior")
    role = Column(String(50), default="candidate")  # candidate, recruiter, admin
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
    
    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    analyses = relationship("Analysis", back_populates="user", cascade="all, delete-orphan")
    jobs = relationship("JobDescription", back_populates="user", cascade="all, delete-orphan")
    recruiter_jobs = relationship("RecruiterJob", back_populates="user", cascade="all, delete-orphan")

class Resume(Base):
    __tablename__ = "resumes"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=True)
    version = Column(Integer, default=1)
    filename = Column(String(255), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    file_type = Column(String(50), nullable=False)  # pdf, docx, txt
    storage_path = Column(String(512), nullable=False)
    page_count = Column(Integer, default=1)
    word_count = Column(Integer, default=0)
    raw_text = Column(Text, nullable=False)
    
    # JSON serialized structure: contact, summary, skills, experience, education, etc.
    parsed_sections_json = Column(Text, nullable=True)
    ats_formatting_analysis_json = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
    
    user = relationship("User", back_populates="resumes")
    analyses = relationship("Analysis", back_populates="resume", cascade="all, delete-orphan")

class JobDescription(Base):
    __tablename__ = "job_descriptions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=True)
    title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=True, default="Target Enterprise")
    raw_text = Column(Text, nullable=False)
    
    # JSON parsed requirements: mandatory_skills, preferred_skills, experience_years, education, etc.
    extracted_intelligence_json = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
    
    user = relationship("User", back_populates="jobs")
    analyses = relationship("Analysis", back_populates="job", cascade="all, delete-orphan")

class Analysis(Base):
    __tablename__ = "analyses"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=True)
    resume_id = Column(String(36), ForeignKey("resumes.id", ondelete="CASCADE"), index=True, nullable=False)
    job_id = Column(String(36), ForeignKey("job_descriptions.id", ondelete="CASCADE"), index=True, nullable=False)
    
    # Overall transparent ATS match score (0-100)
    overall_score = Column(Float, nullable=False)
    
    # Breakdown component scores (0-100)
    keyword_score = Column(Float, nullable=False)
    skills_score = Column(Float, nullable=False)
    experience_score = Column(Float, nullable=False)
    education_score = Column(Float, nullable=False)
    job_title_score = Column(Float, nullable=False)
    structure_score = Column(Float, nullable=False)
    formatting_score = Column(Float, nullable=False)
    
    # Detailed JSON payloads
    breakdown_json = Column(Text, nullable=False)
    matched_keywords_json = Column(Text, nullable=False)
    missing_keywords_json = Column(Text, nullable=False)
    skill_gaps_json = Column(Text, nullable=False)
    bullet_analysis_json = Column(Text, nullable=False)
    recommendations_json = Column(Text, nullable=False)
    ats_compatibility_json = Column(Text, nullable=False)
    executive_summary = Column(Text, nullable=True)
    
    processing_duration_ms = Column(Integer, default=0)
    status = Column(String(50), default="COMPLETE")  # QUEUED, PROCESSING, COMPLETE, FAILED
    is_demo = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=utc_now, index=True)
    
    user = relationship("User", back_populates="analyses")
    resume = relationship("Resume", back_populates="analyses")
    job = relationship("JobDescription", back_populates="analyses")
    reports = relationship("Report", back_populates="analysis", cascade="all, delete-orphan")

class Report(Base):
    __tablename__ = "reports"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    analysis_id = Column(String(36), ForeignKey("analyses.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=True)
    share_token = Column(String(64), unique=True, index=True, nullable=False)
    pdf_filename = Column(String(255), nullable=False)
    pdf_storage_path = Column(String(512), nullable=False)
    status = Column(String(50), default="GENERATED")
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    
    analysis = relationship("Analysis", back_populates="reports")

class RecruiterJob(Base):
    __tablename__ = "recruiter_jobs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=True)
    title = Column(String(255), nullable=False)
    department = Column(String(255), nullable=True)
    job_description_text = Column(Text, nullable=False)
    status = Column(String(50), default="ACTIVE")
    created_at = Column(DateTime, default=utc_now)
    
    user = relationship("User", back_populates="recruiter_jobs")
    candidates = relationship("RecruiterCandidate", back_populates="job", cascade="all, delete-orphan")

class RecruiterCandidate(Base):
    __tablename__ = "recruiter_candidates"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    recruiter_job_id = Column(String(36), ForeignKey("recruiter_jobs.id", ondelete="CASCADE"), index=True, nullable=False)
    candidate_name = Column(String(255), nullable=False)
    candidate_email = Column(String(255), nullable=True)
    resume_filename = Column(String(255), nullable=False)
    ats_score = Column(Float, nullable=False)
    skills_score = Column(Float, nullable=False)
    experience_score = Column(Float, nullable=False)
    education_score = Column(Float, nullable=False)
    top_matched_skills = Column(Text, nullable=True)
    critical_missing_skills = Column(Text, nullable=True)
    recommendation_verdict = Column(String(50), default="Review")  # Strong Match, Fast Track, Consider, Reject
    created_at = Column(DateTime, default=utc_now)
    
    job = relationship("RecruiterJob", back_populates="candidates")

class CloudProcessingJob(Base):
    __tablename__ = "cloud_processing_jobs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=True)
    job_type = Column(String(50), nullable=False)  # RESUME_INGESTION, NLP_ANALYSIS, REPORT_GEN
    status = Column(String(50), default="QUEUED")  # QUEUED, PROCESSING, COMPLETE, FAILED
    progress_percent = Column(Integer, default=0)
    stage_message = Column(String(255), default="Initialized")
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

class CloudEvent(Base):
    __tablename__ = "cloud_events"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_type = Column(String(100), index=True, nullable=False)
    level = Column(String(20), default="INFO")  # INFO, WARN, ERROR
    message = Column(String(512), nullable=False)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, index=True)

# Indexes for query performance
Index("idx_analyses_user_created", Analysis.user_id, Analysis.created_at)
Index("idx_cloud_events_created", CloudEvent.created_at)
