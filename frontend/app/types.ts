export interface ScoreDetail {
  score: number;
  weight_percentage: number;
  weighted_score: number;
  explanation: string;
}

export interface ScoreBreakdown {
  keyword_match: ScoreDetail;
  skills_match: ScoreDetail;
  experience_relevance: ScoreDetail;
  education_match: ScoreDetail;
  job_title_alignment: ScoreDetail;
  resume_structure: ScoreDetail;
  ats_formatting: ScoreDetail;
}

export interface MatchedKeyword {
  keyword: string;
  category: string;
  match_type: string;
  confidence: number;
  resume_occurrences: number;
  job_occurrences: number;
  suggested_section?: string;
}

export interface MissingKeyword {
  keyword: string;
  category: string;
  importance: "Critical" | "Important" | "Optional";
  job_occurrences: number;
  suggested_section: string;
  recommendation: string;
}

export interface SkillGap {
  skill: string;
  category: string;
  importance: "Critical" | "Important" | "Optional";
  status: "Have" | "Partial" | "Missing";
  job_requirement_level: "Mandatory" | "Preferred" | "Optional";
  recommendation: string;
}

export interface BulletFeedback {
  original_bullet: string;
  issue: string;
  suggested_bullet: string;
  impact: string;
  action_verb_detected: boolean;
  has_measurable_outcome: boolean;
}

export interface Recommendation {
  priority: number;
  priority_label: string;
  category: string;
  title: string;
  problem: string;
  reason: string;
  suggested_action: string;
  expected_impact: string;
}

export interface ATSFormattingRisk {
  severity: "SAFE" | "WARNING" | "RISK";
  category: string;
  title: string;
  description: string;
  recommendation: string;
}

export interface AnalysisData {
  id: string;
  resume_id: string;
  job_id: string;
  job_title: string;
  company?: string;
  candidate_name?: string;
  overall_score: number;
  breakdown: ScoreBreakdown;
  matched_keywords: MatchedKeyword[];
  missing_keywords: MissingKeyword[];
  skill_gaps: SkillGap[];
  bullet_analysis: BulletFeedback[];
  recommendations: Recommendation[];
  formatting_risks: ATSFormattingRisk[];
  executive_summary: string;
  processing_duration_ms: number;
  created_at: string;
  is_demo?: boolean;
}

export interface ResumeItem {
  id: string;
  filename: string;
  file_size_bytes: number;
  file_type: string;
  page_count: number;
  word_count: number;
  parsed_sections?: Record<string, string>;
  ats_formatting_analysis?: ATSFormattingRisk[];
  created_at: string;
}

export interface JobItem {
  id: string;
  title: string;
  company?: string;
  raw_text: string;
  created_at: string;
}

export interface AnalysisListItem {
  id: string;
  resume_id: string;
  resume_filename: string;
  job_id: string;
  job_title: string;
  company?: string;
  overall_score: number;
  status: string;
  processing_duration_ms: number;
  created_at: string;
  is_demo: boolean;
}

export interface RecruiterCandidateItem {
  id: string;
  candidate_name: string;
  candidate_email?: string;
  resume_filename: string;
  ats_score: number;
  skills_score: number;
  experience_score: number;
  education_score: number;
  top_matched_skills: string[];
  critical_missing_skills: string[];
  recommendation_verdict: string;
  rank: number;
}

export interface RecruiterJobDetail {
  id: string;
  title: string;
  department?: string;
  job_description_text?: string;
  candidate_count: number;
  candidates: RecruiterCandidateItem[];
  created_at: string;
}

export interface CloudStats {
  documents_processed: number;
  successful_jobs: number;
  failed_jobs: number;
  average_processing_time_ms: number;
  average_document_size_kb: number;
  analysis_throughput_per_min: number;
  active_storage_provider: string;
  active_ai_provider: string;
  database_connected: boolean;
  storage_healthy: boolean;
}

export interface CloudEventItem {
  id: string;
  event_type: string;
  level: "INFO" | "WARN" | "ERROR";
  message: string;
  metadata?: Record<string, any>;
  created_at: string;
}
