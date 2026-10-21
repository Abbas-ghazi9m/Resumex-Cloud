import {
  AnalysisData, ResumeItem, JobItem, AnalysisListItem, 
  RecruiterJobDetail, CloudStats, CloudEventItem, User, ReportItem
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

// Token storage key
const TOKEN_KEY = "resumex_auth_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

function getAuthHeaders(isJson = true): Record<string, string> {
  const headers: Record<string, string> = {};
  if (isJson) {
    headers["Content-Type"] = "application/json";
  }
  const token = getStoredToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// ---------------- AUTHENTICATION ----------------
export async function loginUser(email: string, password: string): Promise<{ access_token: string; user: User }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Login failed" }));
    throw new Error(errorData.detail || "Invalid email or password");
  }

  const data = await res.json();
  setStoredToken(data.access_token);
  return data;
}

export async function registerUser(payload: { email: string; password: string; name: string }): Promise<{ access_token: string; user: User }> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Registration failed" }));
    throw new Error(errorData.detail || "Registration failed");
  }

  const data = await res.json();
  setStoredToken(data.access_token);
  return data;
}

export async function fetchCurrentUser(): Promise<User | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(false),
    });
    if (!res.ok) {
      setStoredToken(null);
      return null;
    }
    return res.json();
  } catch {
    return null;
  }
}

export function logoutUser(): void {
  setStoredToken(null);
}

// ---------------- RESUMES ----------------
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

  const headers: Record<string, string> = {};
  const token = getStoredToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/resumes/upload`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(errorData.detail || "Failed to upload resume");
  }

  return res.json();
}

export async function fetchResumes(): Promise<ResumeItem[]> {
  const res = await fetch(`${API_BASE}/resumes`, {
    headers: getAuthHeaders(false),
  });
  if (!res.ok) return [];
  return res.json();
}

export async function deleteResume(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/resumes/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(false),
  });
  if (!res.ok) {
    throw new Error("Failed to delete resume");
  }
}

// ---------------- ANALYSIS ----------------
export async function runAnalysis(payload: {
  resume_id: string;
  job_id?: string;
  job_title?: string;
  job_company?: string;
  job_text?: string;
}): Promise<AnalysisData> {
  const res = await fetch(`${API_BASE}/analysis`, {
    method: "POST",
    headers: getAuthHeaders(true),
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
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Analysis failed" }));
    throw new Error(err.detail || "Quick analysis failed");
  }

  return res.json();
}

export async function fetchAnalyses(): Promise<AnalysisListItem[]> {
  const res = await fetch(`${API_BASE}/analysis/list`, {
    headers: getAuthHeaders(false),
  });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchAnalysisDetail(id: string): Promise<AnalysisData> {
  const res = await fetch(`${API_BASE}/analysis/${id}`, {
    headers: getAuthHeaders(false),
  });
  if (!res.ok) throw new Error("Analysis record not found");
  return res.json();
}

export async function deleteAnalysis(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/analysis/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(false),
  });
  if (!res.ok) throw new Error("Failed to delete analysis");
}

export async function askAssistant(analysisId: string, question: string): Promise<{
  question: string;
  answer: string;
  suggested_actions: string[];
}> {
  const res = await fetch(`${API_BASE}/analysis/${analysisId}/assistant`, {
    method: "POST",
    headers: getAuthHeaders(true),
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
    headers: getAuthHeaders(true),
    body: JSON.stringify({ section_name: sectionName, content }),
  });
  if (!res.ok) throw new Error("Failed to get rewrite suggestion");
  return res.json();
}


// ---------------- JOBS ----------------
export async function fetchJobs(): Promise<JobItem[]> {
  const res = await fetch(`${API_BASE}/jobs`, {
    headers: getAuthHeaders(false),
  });
  if (!res.ok) return [];
  return res.json();
}

export async function createJob(title: string, raw_text: string, company?: string): Promise<JobItem> {
  const res = await fetch(`${API_BASE}/jobs`, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: JSON.stringify({ title, raw_text, company }),
  });
  if (!res.ok) throw new Error("Failed to create job description");
  return res.json();
}

export async function deleteJob(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/jobs/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(false),
  });
  if (!res.ok) throw new Error("Failed to delete job description");
}

// ---------------- REPORTS ----------------
export async function fetchReportsList(): Promise<ReportItem[]> {
  const res = await fetch(`${API_BASE}/reports`, {
    headers: getAuthHeaders(false),
  });
  if (!res.ok) return [];
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
    headers: getAuthHeaders(false),
  });
  if (!res.ok) throw new Error("Failed to generate PDF report");
  return res.json();
}

export function getReportDownloadUrl(filename: string): string {
  return `${API_BASE}/reports/download/${filename}`;
}

// ---------------- RECRUITER ----------------
export async function fetchRecruiterJobs(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/recruiter/jobs`, {
    headers: getAuthHeaders(false),
  });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchRecruiterJobDetail(jobId: string): Promise<RecruiterJobDetail> {
  const res = await fetch(`${API_BASE}/recruiter/jobs/${jobId}`, {
    headers: getAuthHeaders(false),
  });
  if (!res.ok) throw new Error("Failed to load recruiter job");
  return res.json();
}

export async function createRecruiterJob(payload: { title: string; department?: string; job_description: string }): Promise<any> {
  const formData = new FormData();
  formData.append("title", payload.title);
  if (payload.department) formData.append("department", payload.department);
  formData.append("job_description", payload.job_description);

  const headers: Record<string, string> = {};
  const token = getStoredToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/recruiter/jobs`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to create recruiter job" }));
    throw new Error(err.detail || "Failed to create job requisition");
  }

  return res.json();
}

export async function deleteRecruiterJob(jobId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/recruiter/jobs/${jobId}`, {
    method: "DELETE",
    headers: getAuthHeaders(false),
  });
  if (!res.ok) throw new Error("Failed to delete requisition");
}

export async function addCandidateResume(jobId: string, candidateName: string, candidateEmail: string | undefined, file: File): Promise<any> {
  const formData = new FormData();
  formData.append("candidate_name", candidateName);
  if (candidateEmail) formData.append("candidate_email", candidateEmail);
  formData.append("file", file);

  const headers: Record<string, string> = {};
  const token = getStoredToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/recruiter/jobs/${jobId}/candidates`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Candidate evaluation failed" }));
    throw new Error(err.detail || "Failed to parse and evaluate candidate resume");
  }

  return res.json();
}

export async function deleteCandidate(candidateId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/recruiter/candidates/${candidateId}`, {
    method: "DELETE",
    headers: getAuthHeaders(false),
  });
  if (!res.ok) throw new Error("Failed to remove candidate");
}

// ---------------- CLOUD OBSERVABILITY ----------------
export async function fetchCloudStats(): Promise<CloudStats> {
  const res = await fetch(`${API_BASE}/cloud/stats`, {
    headers: getAuthHeaders(false),
  });
  if (!res.ok) throw new Error("Failed to fetch platform metrics");
  return res.json();
}

export async function fetchCloudEvents(): Promise<CloudEventItem[]> {
  const res = await fetch(`${API_BASE}/cloud/events`, {
    headers: getAuthHeaders(false),
  });
  if (!res.ok) return [];
  return res.json();
}
