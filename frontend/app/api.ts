import {
  AnalysisData, ResumeItem, JobItem, AnalysisListItem, 
  RecruiterJobDetail, CloudStats, CloudEventItem
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export async function uploadResume(file: File): Promise<{
  id: string;
  filename: string;
  file_size_bytes: number;
  file_type: string;
  page_count: number;
  word_count: number;
  status: string;
  message: string;
}> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/resumes/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(errorData.detail || "Failed to upload resume");
  }

  return res.json();
}

export async function runAnalysis(payload: {
  resume_id: string;
  job_id?: string;
  job_title?: string;
  job_company?: string;
  job_text?: string;
}): Promise<AnalysisData> {
  const res = await fetch(`${API_BASE}/analysis`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Analysis failed" }));
    throw new Error(err.detail || "Analysis computation failed");
  }

  return res.json();
}

export async function runQuickAnalysis(payload: {
  resume_text: string;
  job_text: string;
  job_title?: string;
  candidate_name?: string;
}): Promise<AnalysisData> {
  const res = await fetch(`${API_BASE}/analysis/quick`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Analysis failed" }));
    throw new Error(err.detail || "Quick analysis failed");
  }

  return res.json();
}

export async function fetchAnalyses(): Promise<AnalysisListItem[]> {
  const res = await fetch(`${API_BASE}/analysis/list`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchAnalysisDetail(id: string): Promise<AnalysisData> {
  const res = await fetch(`${API_BASE}/analysis/${id}`);
  if (!res.ok) throw new Error("Analysis not found");
  return res.json();
}

export async function fetchResumes(): Promise<ResumeItem[]> {
  const res = await fetch(`${API_BASE}/resumes`);
  if (!res.ok) return [];
  return res.json();
}

export async function deleteResume(id: string): Promise<void> {
  await fetch(`${API_BASE}/resumes/${id}`, { method: "DELETE" });
}

export async function fetchJobs(): Promise<JobItem[]> {
  const res = await fetch(`${API_BASE}/jobs`);
  if (!res.ok) return [];
  return res.json();
}

export async function createJob(title: string, raw_text: string, company?: string): Promise<JobItem> {
  const res = await fetch(`${API_BASE}/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, raw_text, company }),
  });
  if (!res.ok) throw new Error("Failed to create job");
  return res.json();
}

export async function generateReport(analysisId: string): Promise<{
  id: string;
  share_token: string;
  pdf_filename: string;
  download_url: string;
  share_url: string;
}> {
  const res = await fetch(`${API_BASE}/reports/generate/${analysisId}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to generate PDF report");
  return res.json();
}

export async function askAssistant(analysisId: string, question: string): Promise<{
  question: string;
  answer: string;
  suggested_actions: string[];
}> {
  const res = await fetch(`${API_BASE}/analysis/${analysisId}/assistant`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ analysis_id: analysisId, question }),
  });
  if (!res.ok) throw new Error("Failed to query assistant");
  return res.json();
}

export async function requestRewrite(analysisId: string, sectionName: string, content: string): Promise<{
  section: string;
  before: string;
  after: string;
  keywords_infused: string[];
  disclaimer: string;
}> {
  const res = await fetch(`${API_BASE}/analysis/${analysisId}/rewrite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ section_name: sectionName, content }),
  });
  if (!res.ok) throw new Error("Failed to get rewrite suggestion");
  return res.json();
}

export async function fetchRecruiterJobs(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/recruiter/jobs`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchRecruiterJobDetail(jobId: string): Promise<RecruiterJobDetail> {
  const res = await fetch(`${API_BASE}/recruiter/jobs/${jobId}`);
  if (!res.ok) throw new Error("Failed to load recruiter job");
  return res.json();
}

export async function fetchCloudStats(): Promise<CloudStats> {
  const res = await fetch(`${API_BASE}/cloud/stats`);
  if (!res.ok) throw new Error("Failed to fetch cloud stats");
  return res.json();
}

export async function fetchCloudEvents(): Promise<CloudEventItem[]> {
  const res = await fetch(`${API_BASE}/cloud/events`);
  if (!res.ok) return [];
  return res.json();
}
