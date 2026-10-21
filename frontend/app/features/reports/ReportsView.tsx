"use client";

import React, { useState } from "react";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { EmptyState } from "../../components/ui/EmptyState";
import { AnalysisListItem, AnalysisData } from "../../types";
import {
  fetchAnalysisDetail,
  generateReport,
  getReportDownloadUrl,
  deleteAnalysis,
} from "../../api";
import {
  FileText,
  Search,
  Download,
  Trash2,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ArrowUpDown,
} from "lucide-react";

interface ReportsViewProps {
  analyses: AnalysisListItem[];
  onRefresh: () => void;
  selectedAnalysisId?: string | null;
  onClearSelectedAnalysis?: () => void;
}

export function ReportsView({
  analyses,
  onRefresh,
  selectedAnalysisId,
  onClearSelectedAnalysis,
}: ReportsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [scoreFilter, setScoreFilter] = useState<"ALL" | "HIGH" | "MID" | "LOW">("ALL");
  const [activeAnalysis, setActiveAnalysis] = useState<AnalysisData | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Auto-load if selectedAnalysisId passed from Dashboard
  React.useEffect(() => {
    if (selectedAnalysisId) {
      handleOpenDetail(selectedAnalysisId);
    }
  }, [selectedAnalysisId]);

  const handleOpenDetail = async (id: string) => {
    setLoadingDetail(true);
    setActionError(null);
    try {
      const detail = await fetchAnalysisDetail(id);
      setActiveAnalysis(detail);
    } catch (err: any) {
      setActionError(err.message || "Failed to load analysis details");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDownloadPdf = async (analysisId: string) => {
    setDownloadingPdf(true);
    setActionError(null);
    try {
      const rep = await generateReport(analysisId);
      // Trigger download
      const downloadUrl = getReportDownloadUrl(rep.pdf_filename);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = rep.pdf_filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      setActionError(err.message || "Failed to compile or download report PDF");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently remove this analysis report?")) {
      return;
    }
    try {
      await deleteAnalysis(id);
      if (activeAnalysis?.id === id) {
        setActiveAnalysis(null);
      }
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to delete report");
    }
  };

  // Filter analyses
  const filtered = analyses.filter((a) => {
    const matchesSearch =
      a.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.company && a.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      a.resume_filename.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (scoreFilter === "HIGH") return a.overall_score >= 80;
    if (scoreFilter === "MID") return a.overall_score >= 60 && a.overall_score < 80;
    if (scoreFilter === "LOW") return a.overall_score < 60;
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E6E0]">
        <div>
          <h2 className="text-base font-semibold text-[#20211F]">
            Audit Reports Workspace
          </h2>
          <p className="text-xs text-[#777872] mt-0.5">
            Persisted candidate-to-job ATS compatibility records and downloadable audits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-[#777872]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by title, company, file..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-[3px] border border-[#E8E6E0] bg-[#FFFFFF] text-[#20211F] focus:border-[#52664F] focus:outline-none w-48 sm:w-64 transition"
            />
          </div>

          {/* Score Filter */}
          <select
            value={scoreFilter}
            onChange={(e) => setScoreFilter(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs rounded-[3px] border border-[#E8E6E0] bg-[#FFFFFF] text-[#20211F] focus:border-[#52664F] focus:outline-none transition"
          >
            <option value="ALL">All Scores</option>
            <option value="HIGH">High (80%+)</option>
            <option value="MID">Moderate (60-79%)</option>
            <option value="LOW">Low (&lt;60%)</option>
          </select>
        </div>
      </div>

      {actionError && (
        <div className="p-3 rounded-[3px] bg-[#FDF2F1] border border-[#F5C7C3] text-xs text-[#9E2B23] flex items-center justify-between">
          <span>{actionError}</span>
          <button
            onClick={() => setActionError(null)}
            className="text-[#9E2B23] font-semibold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Reports Table / List */}
      <Card padding="none">
        {filtered.length === 0 ? (
          <div className="p-10">
            <EmptyState
              icon={<FileText className="h-5 w-5" />}
              title={analyses.length === 0 ? "No reports found" : "No matching reports"}
              description={
                analyses.length === 0
                  ? "Run a resume analysis to generate your first audit report."
                  : "Try refining your search keyword or score filter."
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] border-b border-[#E8E6E0] text-[11px] font-mono-tech uppercase text-[#777872]">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Target Role & Company</th>
                  <th className="py-2.5 px-4 font-medium">Resume File</th>
                  <th className="py-2.5 px-4 font-medium text-center">Score</th>
                  <th className="py-2.5 px-4 font-medium text-center">Engine Duration</th>
                  <th className="py-2.5 px-4 font-medium">Timestamp</th>
                  <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E6E0]">
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#FAF9F6] transition group"
                  >
                    <td className="py-3 px-4 font-medium text-[#20211F]">
                      <div>{item.job_title}</div>
                      <div className="text-[11px] text-[#777872] font-normal">
                        {item.company || "Target Enterprise"}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#555650] font-mono-tech text-[11px]">
                      {item.resume_filename}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`font-mono-tech font-bold text-xs ${
                          item.overall_score >= 80
                            ? "text-[#3F704D]"
                            : item.overall_score >= 60
                            ? "text-[#B46C1E]"
                            : "text-[#B9382F]"
                        }`}
                      >
                        {Math.round(item.overall_score)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-[#777872] font-mono-tech text-[11px]">
                      {item.processing_duration_ms}ms
                    </td>
                    <td className="py-3 px-4 text-[#777872] text-[11px]">
                      {new Date(item.created_at).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleOpenDetail(item.id)}
                        >
                          View Audit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Generate & Download PDF"
                          onClick={() => handleDownloadPdf(item.id)}
                          isLoading={downloadingPdf}
                        >
                          <Download className="h-3.5 w-3.5 text-[#52664F]" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Delete Report"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-[#9E2B23]" />
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

      {/* Detail Audit Modal */}
      {activeAnalysis && (
        <Modal
          isOpen={Boolean(activeAnalysis)}
          onClose={() => {
            setActiveAnalysis(null);
            if (onClearSelectedAnalysis) onClearSelectedAnalysis();
          }}
          title={`Audit Breakdown — ${activeAnalysis.job_title}`}
          description={`Persisted analysis record for ${activeAnalysis.candidate_name || "Candidate"} (${activeAnalysis.company || "Enterprise"})`}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            {/* Top Score Summary Banner */}
            <div className="p-4 rounded-[4px] bg-[#FAF9F6] border border-[#E8E6E0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono-tech uppercase text-[#777872]">
                  OVERALL ATS COMPATIBILITY SCORE
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-bold font-mono-tech text-[#52664F]">
                    {Math.round(activeAnalysis.overall_score)}%
                  </span>
                  <span className="text-xs text-[#777872]">
                    (Deterministic multi-tier score)
                  </span>
                </div>
                <p className="text-xs text-[#555650] mt-1.5 leading-relaxed">
                  {activeAnalysis.executive_summary}
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                leftIcon={<Download className="h-3.5 w-3.5" />}
                onClick={() => handleDownloadPdf(activeAnalysis.id)}
                isLoading={downloadingPdf}
              >
                Download PDF
              </Button>
            </div>

            {/* Score Component Breakdown */}
            <div>
              <h4 className="text-xs font-semibold text-[#20211F] mb-2 font-mono-tech uppercase">
                Weighted Scoring Breakdown
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {Object.entries(activeAnalysis.breakdown || {}).map(
                  ([key, val]: [string, any]) => (
                    <div
                      key={key}
                      className="p-3 rounded-[3px] border border-[#E8E6E0] bg-[#FFFFFF] space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#20211F] capitalize">
                          {key.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs font-mono-tech font-bold text-[#52664F]">
                          {val.score}%{" "}
                          <span className="text-[10px] text-[#777872] font-normal">
                            ({val.weight_percentage}%)
                          </span>
                        </span>
                      </div>
                      <div className="w-full bg-[#FAF9F6] h-1.5 rounded-full overflow-hidden border border-[#E8E6E0]">
                        <div
                          className="bg-[#52664F] h-full"
                          style={{ width: `${Math.min(100, val.score)}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-[#777872] leading-snug">
                        {val.explanation}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Matched & Missing Keywords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Matched Keywords */}
              <div className="border border-[#E8E6E0] rounded-[4px] p-3.5 bg-[#FFFFFF]">
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#E8E6E0]">
                  <span className="text-xs font-semibold text-[#3F704D] flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Matched Keywords ({activeAnalysis.matched_keywords?.length || 0})
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                  {(activeAnalysis.matched_keywords || []).map((kw, idx) => (
                    <Badge key={idx} variant="success" size="sm">
                      {kw.keyword} ({kw.resume_occurrences}x)
                    </Badge>
                  ))}
                  {(!activeAnalysis.matched_keywords ||
                    activeAnalysis.matched_keywords.length === 0) && (
                    <span className="text-xs text-[#777872]">
                      No keywords matched.
                    </span>
                  )}
                </div>
              </div>

              {/* Missing Keywords */}
              <div className="border border-[#E8E6E0] rounded-[4px] p-3.5 bg-[#FFFFFF]">
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#E8E6E0]">
                  <span className="text-xs font-semibold text-[#B9382F] flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Missing Requirements ({activeAnalysis.missing_keywords?.length || 0})
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                  {(activeAnalysis.missing_keywords || []).map((kw, idx) => (
                    <Badge
                      key={idx}
                      variant={kw.importance === "Critical" ? "danger" : "warning"}
                      size="sm"
                    >
                      {kw.keyword} ({kw.importance})
                    </Badge>
                  ))}
                  {(!activeAnalysis.missing_keywords ||
                    activeAnalysis.missing_keywords.length === 0) && (
                    <span className="text-xs text-[#777872]">
                      Zero missing keyword gaps detected.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Recommendations List */}
            {activeAnalysis.recommendations && activeAnalysis.recommendations.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-[#20211F] mb-2 font-mono-tech uppercase">
                  Actionable Optimization Advice
                </h4>
                <div className="space-y-2">
                  {activeAnalysis.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-[3px] border border-[#E8E6E0] bg-[#FAF9F6] text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#20211F]">
                          {rec.title}
                        </span>
                        <Badge size="sm" variant="accent">
                          {rec.priority_label}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-[#555650]">{rec.problem}</p>
                      <div className="text-[11px] text-[#52664F] font-medium pt-1 border-t border-[#E8E6E0]/60">
                        Suggested action: {rec.suggested_action}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
