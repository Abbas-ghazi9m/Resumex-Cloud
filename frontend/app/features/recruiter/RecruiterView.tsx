"use client";

import React, { useState, useEffect } from "react";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { EmptyState } from "../../components/ui/EmptyState";
import {
  RecruiterJobDetail,
  RecruiterCandidateItem,
} from "../../types";
import {
  fetchRecruiterJobs,
  fetchRecruiterJobDetail,
  createRecruiterJob,
  deleteRecruiterJob,
  addCandidateResume,
  deleteCandidate,
} from "../../api";
import {
  Users,
  Briefcase,
  Plus,
  Trash2,
  Upload,
  Search,
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ChevronRight,
  Filter,
} from "lucide-react";

export function RecruiterView() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [jobDetail, setJobDetail] = useState<RecruiterJobDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Job Modal State
  const [isNewJobOpen, setIsNewJobOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDepartment, setNewDepartment] = useState("Engineering");
  const [newDescription, setNewDescription] = useState("");
  const [creatingJob, setCreatingJob] = useState(false);

  // Candidate Upload Modal State
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [candidateFile, setCandidateFile] = useState<File | null>(null);
  const [uploadingCandidate, setUploadingCandidate] = useState(false);

  // Candidate Filter & Sort
  const [searchCandidate, setSearchCandidate] = useState("");
  const [sortBy, setSortBy] = useState<"ats" | "skills" | "name">("ats");

  // Candidate Comparison Modal
  const [comparingCandidate, setComparingCandidate] = useState<RecruiterCandidateItem | null>(null);

  const loadJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchRecruiterJobs();
      setJobs(list);
      if (list.length > 0 && !selectedJobId) {
        setSelectedJobId(list[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load recruiter jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (selectedJobId) {
      loadJobDetail(selectedJobId);
    }
  }, [selectedJobId]);

  const loadJobDetail = async (id: string) => {
    setError(null);
    try {
      const detail = await fetchRecruiterJobDetail(id);
      setJobDetail(detail);
    } catch (err: any) {
      setError(err.message || "Failed to load candidate roster for job");
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;
    setCreatingJob(true);
    setError(null);
    try {
      const created = await createRecruiterJob({
        title: newTitle,
        department: newDepartment,
        job_description: newDescription,
      });
      setIsNewJobOpen(false);
      setNewTitle("");
      setNewDescription("");
      await loadJobs();
      setSelectedJobId(created.id);
    } catch (err: any) {
      setError(err.message || "Failed to create job requisition");
    } finally {
      setCreatingJob(false);
    }
  };

  const handleDeleteJob = async (id: string) => {
    if (!confirm("Are you sure you want to delete this job and all associated candidate evaluations?")) {
      return;
    }
    try {
      await deleteRecruiterJob(id);
      setSelectedJobId(null);
      setJobDetail(null);
      await loadJobs();
    } catch (err: any) {
      alert(err.message || "Failed to delete job");
    }
  };

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobId || !candidateName.trim() || !candidateFile) return;

    setUploadingCandidate(true);
    setError(null);
    try {
      await addCandidateResume(
        selectedJobId,
        candidateName,
        candidateEmail.trim() || undefined,
        candidateFile
      );
      setIsCandidateModalOpen(false);
      setCandidateName("");
      setCandidateEmail("");
      setCandidateFile(null);
      await loadJobDetail(selectedJobId);
    } catch (err: any) {
      setError(err.message || "Failed to upload and match candidate");
    } finally {
      setUploadingCandidate(false);
    }
  };

  const handleDeleteCandidate = async (candId: string) => {
    if (!confirm("Remove this candidate from the requisition?")) return;
    try {
      await deleteCandidate(candId);
      if (selectedJobId) loadJobDetail(selectedJobId);
    } catch (err: any) {
      alert(err.message || "Failed to delete candidate");
    }
  };

  // Filter & Sort Candidates
  const candidates = (jobDetail?.candidates || [])
    .filter((c) =>
      c.candidate_name.toLowerCase().includes(searchCandidate.toLowerCase()) ||
      (c.candidate_email && c.candidate_email.toLowerCase().includes(searchCandidate.toLowerCase())) ||
      c.resume_filename.toLowerCase().includes(searchCandidate.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "ats") return b.ats_score - a.ats_score;
      if (sortBy === "skills") return b.skills_score - a.skills_score;
      return a.candidate_name.localeCompare(b.candidate_name);
    });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E6E0]">
        <div>
          <h2 className="text-base font-semibold text-[#20211F]">
            Recruiter Workspace
          </h2>
          <p className="text-xs text-[#777872] mt-0.5">
            Job description management, batch resume matching, and transparent applicant evidence.
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          leftIcon={<Plus className="h-3.5 w-3.5" />}
          onClick={() => setIsNewJobOpen(true)}
        >
          New Requisition
        </Button>
      </div>

      {error && (
        <div className="p-3 rounded-[3px] bg-[#FDF2F1] border border-[#F5C7C3] text-xs text-[#9E2B23] flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-[#9E2B23] font-semibold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Job Requisitions List (1 col) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-[#20211F] font-mono-tech uppercase">
            <span>Requisitions ({jobs.length})</span>
          </div>

          <Card padding="none">
            {jobs.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#777872]">
                No requisitions created.
              </div>
            ) : (
              <div className="divide-y divide-[#E8E6E0]">
                {jobs.map((j) => {
                  const isSelected = selectedJobId === j.id;
                  return (
                    <div
                      key={j.id}
                      onClick={() => setSelectedJobId(j.id)}
                      className={`p-3 cursor-pointer transition ${
                        isSelected
                          ? "bg-[#EDF1EC] border-l-2 border-[#52664F]"
                          : "hover:bg-[#FAF9F6]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#20211F] truncate">
                          {j.title}
                        </span>
                        <Badge size="sm" variant="neutral">
                          {j.candidate_count || 0}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-[#777872] mt-0.5 flex items-center justify-between">
                        <span>{j.department || "General"}</span>
                        <span>
                          {new Date(j.created_at).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Active Job Candidates Roster (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          {jobDetail ? (
            <>
              {/* Job Header Bar */}
              <div className="p-4 rounded-[4px] bg-[#FFFFFF] border border-[#E8E6E0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[#20211F]">
                      {jobDetail.title}
                    </h3>
                    <Badge variant="accent" size="sm">
                      {jobDetail.department || "Engineering"}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#777872] mt-1 line-clamp-1">
                    {jobDetail.job_description_text}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="primary"
                    leftIcon={<Upload className="h-3.5 w-3.5" />}
                    onClick={() => setIsCandidateModalOpen(true)}
                  >
                    Add Candidate
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    title="Delete Job"
                    onClick={() => handleDeleteJob(jobDetail.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-[#B9382F]" />
                  </Button>
                </div>
              </div>

              {/* Candidate Roster Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="relative flex-1 max-w-xs">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-[#777872]" />
                  <input
                    type="text"
                    value={searchCandidate}
                    onChange={(e) => setSearchCandidate(e.target.value)}
                    placeholder="Search candidate by name, email..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-[3px] border border-[#E8E6E0] bg-[#FFFFFF] text-[#20211F] focus:border-[#52664F] focus:outline-none transition"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#777872]">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-2.5 py-1 text-xs rounded-[3px] border border-[#E8E6E0] bg-[#FFFFFF] text-[#20211F] focus:border-[#52664F] focus:outline-none transition"
                  >
                    <option value="ats">ATS Score (Highest)</option>
                    <option value="skills">Skills Score</option>
                    <option value="name">Candidate Name</option>
                  </select>
                </div>
              </div>

              {/* Candidates Table */}
              <Card padding="none">
                {candidates.length === 0 ? (
                  <div className="p-8">
                    <EmptyState
                      icon={<Users className="h-5 w-5" />}
                      title="No candidates evaluated yet"
                      description="Upload candidate resumes (PDF, DOCX, TXT) to evaluate their alignment against this requisition."
                      actionLabel="Upload First Candidate"
                      onAction={() => setIsCandidateModalOpen(true)}
                    />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAF9F6] border-b border-[#E8E6E0] text-[11px] font-mono-tech uppercase text-[#777872]">
                        <tr>
                          <th className="py-2.5 px-4 font-medium">Rank</th>
                          <th className="py-2.5 px-4 font-medium">Candidate</th>
                          <th className="py-2.5 px-4 font-medium text-center">ATS Score</th>
                          <th className="py-2.5 px-4 font-medium text-center">Skills Score</th>
                          <th className="py-2.5 px-4 font-medium">Matched Evidence</th>
                          <th className="py-2.5 px-4 font-medium">Missing Skills</th>
                          <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8E6E0]">
                        {candidates.map((c, idx) => (
                          <tr
                            key={c.id}
                            className="hover:bg-[#FAF9F6] transition"
                          >
                            <td className="py-3 px-4 font-mono-tech text-[#777872]">
                              #{idx + 1}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-[#20211F]">
                                {c.candidate_name}
                              </div>
                              <div className="text-[11px] text-[#777872] font-mono-tech">
                                {c.candidate_email || c.resume_filename}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="font-mono-tech font-bold text-xs text-[#52664F]">
                                {Math.round(c.ats_score)}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="font-mono-tech text-xs text-[#20211F]">
                                {Math.round(c.skills_score)}%
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {(c.top_matched_skills || []).slice(0, 3).map((sk, sIdx) => (
                                  <Badge key={sIdx} variant="success" size="sm">
                                    {sk}
                                  </Badge>
                                ))}
                                {(c.top_matched_skills || []).length > 3 && (
                                  <span className="text-[10px] text-[#777872]">
                                    +{(c.top_matched_skills || []).length - 3}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {(c.critical_missing_skills || []).slice(0, 2).map((sk, sIdx) => (
                                  <Badge key={sIdx} variant="danger" size="sm">
                                    {sk}
                                  </Badge>
                                ))}
                                {(!c.critical_missing_skills || c.critical_missing_skills.length === 0) && (
                                  <span className="text-[10px] text-[#777872]">None</span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => setComparingCandidate(c)}
                                >
                                  Details
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteCandidate(c.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-[#B9382F]" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </>
          ) : (
            <Card padding="lg" className="text-center">
              <EmptyState
                icon={<Briefcase className="h-5 w-5" />}
                title="Select a job requisition"
                description="Choose an existing job requisition from the left sidebar or create a new one to start candidate evaluation."
                actionLabel="Create Requisition"
                onAction={() => setIsNewJobOpen(true)}
              />
            </Card>
          )}
        </div>
      </div>

      {/* Modal: New Job Requisition */}
      <Modal
        isOpen={isNewJobOpen}
        onClose={() => setIsNewJobOpen(false)}
        title="Create Job Requisition"
        description="Define a target role and paste requirements to match candidate resumes."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateJob} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-[#20211F] mb-1">
              Job Title *
            </label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Senior Backend Engineer"
              className="w-full p-2.5 rounded-[3px] border border-[#E8E6E0] bg-[#FAF9F6] text-[#20211F] focus:border-[#52664F] focus:bg-[#FFFFFF] focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block font-medium text-[#20211F] mb-1">
              Department
            </label>
            <input
              type="text"
              value={newDepartment}
              onChange={(e) => setNewDepartment(e.target.value)}
              placeholder="e.g. Infrastructure Engineering"
              className="w-full p-2.5 rounded-[3px] border border-[#E8E6E0] bg-[#FAF9F6] text-[#20211F] focus:border-[#52664F] focus:bg-[#FFFFFF] focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block font-medium text-[#20211F] mb-1">
              Job Description & Requirements *
            </label>
            <textarea
              required
              rows={8}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Paste complete role description, responsibilities, and required qualifications..."
              className="w-full p-2.5 rounded-[3px] border border-[#E8E6E0] bg-[#FAF9F6] text-[#20211F] focus:border-[#52664F] focus:bg-[#FFFFFF] focus:outline-none transition leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E6E0]">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsNewJobOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={creatingJob}
            >
              Save Requisition
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Candidate Resume */}
      <Modal
        isOpen={isCandidateModalOpen}
        onClose={() => setIsCandidateModalOpen(false)}
        title="Evaluate Candidate Resume"
        description={`Upload an actual candidate resume file to evaluate against ${jobDetail?.title || "selected requisition"}.`}
        maxWidth="md"
      >
        <form onSubmit={handleAddCandidate} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-[#20211F] mb-1">
              Candidate Full Name *
            </label>
            <input
              type="text"
              required
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              placeholder="e.g. Sarah Jenkins"
              className="w-full p-2.5 rounded-[3px] border border-[#E8E6E0] bg-[#FAF9F6] text-[#20211F] focus:border-[#52664F] focus:bg-[#FFFFFF] focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block font-medium text-[#20211F] mb-1">
              Candidate Email (Optional)
            </label>
            <input
              type="email"
              value={candidateEmail}
              onChange={(e) => setCandidateEmail(e.target.value)}
              placeholder="sarah@email.com"
              className="w-full p-2.5 rounded-[3px] border border-[#E8E6E0] bg-[#FAF9F6] text-[#20211F] focus:border-[#52664F] focus:bg-[#FFFFFF] focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block font-medium text-[#20211F] mb-1">
              Resume Document (PDF, DOCX, TXT) *
            </label>
            <input
              type="file"
              required
              accept=".pdf,.docx,.txt"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setCandidateFile(e.target.files[0]);
                }
              }}
              className="w-full p-2 rounded-[3px] border border-[#E8E6E0] bg-[#FAF9F6] text-xs text-[#20211F] file:mr-3 file:py-1 file:px-2.5 file:rounded-[3px] file:border-0 file:text-xs file:font-medium file:bg-[#52664F] file:text-white hover:file:bg-[#41523F]"
            />
            <p className="text-[10px] text-[#777872] mt-1">
              Strict document parsing via PyMuPDF / python-docx. Max 15MB.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E6E0]">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsCandidateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={uploadingCandidate}
            >
              Run Match Audit
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Candidate Detailed Evidence */}
      {comparingCandidate && (
        <Modal
          isOpen={Boolean(comparingCandidate)}
          onClose={() => setComparingCandidate(null)}
          title={`Candidate Profile — ${comparingCandidate.candidate_name}`}
          description={`Evaluation evidence for ${jobDetail?.title || "role"}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-[3px] bg-[#FAF9F6] border border-[#E8E6E0]">
              <div>
                <span className="text-[10px] font-mono-tech text-[#777872] uppercase block">
                  ATS Score
                </span>
                <span className="text-xl font-bold font-mono-tech text-[#52664F]">
                  {Math.round(comparingCandidate.ats_score)}%
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono-tech text-[#777872] uppercase block">
                  Skills Score
                </span>
                <span className="text-xl font-bold font-mono-tech text-[#20211F]">
                  {Math.round(comparingCandidate.skills_score)}%
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono-tech text-[#777872] uppercase block">
                  Experience
                </span>
                <span className="text-xl font-bold font-mono-tech text-[#20211F]">
                  {Math.round(comparingCandidate.experience_score)}%
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-[#20211F] mb-1 font-mono-tech uppercase">
                Matched Technical Requirements
              </h4>
              <div className="flex flex-wrap gap-1.5 p-3 rounded-[3px] border border-[#E8E6E0] bg-[#FFFFFF]">
                {(comparingCandidate.top_matched_skills || []).map((sk, idx) => (
                  <Badge key={idx} variant="success" size="sm">
                    {sk}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-[#20211F] mb-1 font-mono-tech uppercase">
                Critical Skill Deficits
              </h4>
              <div className="flex flex-wrap gap-1.5 p-3 rounded-[3px] border border-[#E8E6E0] bg-[#FFFFFF]">
                {(comparingCandidate.critical_missing_skills || []).map((sk, idx) => (
                  <Badge key={idx} variant="danger" size="sm">
                    {sk}
                  </Badge>
                ))}
                {(!comparingCandidate.critical_missing_skills ||
                  comparingCandidate.critical_missing_skills.length === 0) && (
                  <span className="text-xs text-[#777872]">
                    No critical missing requirements identified.
                  </span>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
