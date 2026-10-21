"use client";

import React, { useState } from "react";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import {
  AnalysisListItem,
  ResumeItem,
  JobItem,
  CloudStats,
  CloudEventItem,
} from "../../types";
import {
  FileText,
  Search,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  Upload,
  RefreshCw,
  BarChart3,
  Layers,
  Edit3,
  FileCheck2,
} from "lucide-react";

interface DashboardViewProps {
  stats: CloudStats | null;
  analyses: AnalysisListItem[];
  resumes: ResumeItem[];
  jobs: JobItem[];
  events: CloudEventItem[];
  loading: boolean;
  onRefresh: () => void;
  onNavigate: (tab: string) => void;
  onSelectAnalysis: (analysisId: string) => void;
}

export function DashboardView({
  stats,
  analyses,
  resumes,
  jobs,
  events,
  loading,
  onRefresh,
  onNavigate,
  onSelectAnalysis,
}: DashboardViewProps) {
  // Real aggregates calculation
  const totalResumes = resumes.length;
  const completedAnalyses = analyses.filter((a) => a.status === "COMPLETE");
  const totalCompletedAnalyses = completedAnalyses.length;
  const averageATSScore =
    totalCompletedAnalyses > 0
      ? Math.round(
          completedAnalyses.reduce((acc, curr) => acc + curr.overall_score, 0) /
            totalCompletedAnalyses
        )
      : null;
  const totalJobs = jobs.length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E6E0]">
        <div>
          <h2 className="text-base font-semibold text-[#20211F]">
            Platform Overview
          </h2>
          <p className="text-xs text-[#777872] mt-0.5">
            Operational telemetry and persisted ATS matching records.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />}
            onClick={onRefresh}
            disabled={loading}
          >
            Sync Data
          </Button>
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Search className="h-3.5 w-3.5" />}
            onClick={() => onNavigate("analyzer")}
          >
            Analyze Resume
          </Button>
        </div>
      </div>

      {/* KPI Cards — Pure Real Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Card padding="sm" className="bg-[#FFFFFF]">
          <span className="text-[10px] font-mono-tech uppercase text-[#777872] block">
            Resumes Stored
          </span>
          <div className="text-xl font-bold font-mono-tech text-[#20211F] my-1">
            {totalResumes}
          </div>
          <span className="text-[10px] text-[#777872]">
            {totalResumes === 0 ? "No files ingested" : "Verified documents"}
          </span>
        </Card>

        <Card padding="sm" className="bg-[#FFFFFF]">
          <span className="text-[10px] font-mono-tech uppercase text-[#777872] block">
            Completed Analyses
          </span>
          <div className="text-xl font-bold font-mono-tech text-[#20211F] my-1">
            {totalCompletedAnalyses}
          </div>
          <span className="text-[10px] text-[#777872]">
            {totalCompletedAnalyses === 0
              ? "0 audit runs"
              : "Deterministic runs"}
          </span>
        </Card>

        <Card padding="sm" className="bg-[#FFFFFF]">
          <span className="text-[10px] font-mono-tech uppercase text-[#777872] block">
            Average ATS Match
          </span>
          <div className="text-xl font-bold font-mono-tech text-[#52664F] my-1">
            {averageATSScore !== null ? `${averageATSScore}%` : "—"}
          </div>
          <span className="text-[10px] text-[#777872]">
            {averageATSScore !== null
              ? "Across all audits"
              : "No analyses scored"}
          </span>
        </Card>

        <Card padding="sm" className="bg-[#FFFFFF]">
          <span className="text-[10px] font-mono-tech uppercase text-[#777872] block">
            Job Requisitions
          </span>
          <div className="text-xl font-bold font-mono-tech text-[#20211F] my-1">
            {totalJobs}
          </div>
          <span className="text-[10px] text-[#777872]">
            {totalJobs === 0 ? "No active roles" : "Roles mapped"}
          </span>
        </Card>
      </div>

      {/* Quick Launchpad for Core Tools */}
      <Card
        header={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-semibold text-[#20211F]">
              Direct Tool Launchpad
            </span>
            <span className="text-[11px] font-mono-tech text-[#777872]">
              REAL-TIME ENGINES
            </span>
          </div>
        }
        padding="sm"
      >
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {[
            {
              id: "analyzer",
              title: "Resume Analyzer",
              desc: "Deep structure & metrics scan",
              icon: Search,
            },
            {
              id: "builder",
              title: "Resume Builder",
              desc: "Structured builder + ATS preview",
              icon: Layers,
            },
            {
              id: "ats_checker",
              title: "ATS Checker",
              desc: "Job match & keyword gaps",
              icon: FileCheck2,
            },
            {
              id: "corrector",
              title: "Bullet Corrector",
              desc: "Action verbs & metric fixes",
              icon: CheckCircle2,
            },
            {
              id: "editor",
              title: "Live Editor",
              desc: "Side-by-side editing & PDF export",
              icon: Edit3,
            },
          ].map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => onNavigate(tool.id)}
                className="p-3 text-left rounded-[3px] border border-[#E8E6E0] bg-[#FAF9F6] hover:bg-[#F0EEE7] hover:border-[#D9D7CE] transition group"
              >
                <Icon className="h-4 w-4 text-[#52664F] mb-1.5" />
                <div className="text-xs font-medium text-[#20211F] group-hover:text-[#41523F]">
                  {tool.title}
                </div>
                <div className="text-[10px] text-[#777872] mt-0.5 leading-snug">
                  {tool.desc}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Main Two-Column Activity & Analyses Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Analyses (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card
            header={
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-semibold text-[#20211F]">
                  Recent ATS Analyses
                </span>
                <button
                  onClick={() => onNavigate("reports")}
                  className="text-xs text-[#52664F] hover:underline flex items-center gap-1 font-medium"
                >
                  <span>View all reports</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            }
            padding="none"
          >
            {analyses.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={<FileText className="h-5 w-5" />}
                  title="No analyses recorded"
                  description="Upload a resume and job description to generate your first ATS match evaluation."
                  actionLabel="Run First Analysis"
                  onAction={() => onNavigate("analyzer")}
                />
              </div>
            ) : (
              <div className="divide-y divide-[#E8E6E0]">
                {analyses.slice(0, 5).map((an) => (
                  <div
                    key={an.id}
                    onClick={() => onSelectAnalysis(an.id)}
                    className="p-3.5 hover:bg-[#FAF9F6] transition cursor-pointer flex items-center justify-between group"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-[#20211F] group-hover:text-[#52664F] transition">
                        {an.job_title}
                      </div>
                      <div className="text-[11px] text-[#777872]">
                        {an.company || "Target Enterprise"} •{" "}
                        <span className="font-mono-tech">
                          {an.resume_filename}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-sm font-bold font-mono-tech text-[#52664F]">
                          {Math.round(an.overall_score)}%
                        </span>
                        <div className="text-[9px] font-mono-tech text-[#777872] uppercase">
                          ATS Score
                        </div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-[#9E9F99] group-hover:text-[#52664F] transition" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Platform Audit Log & Quick Recruiter (1 col) */}
        <div className="space-y-4">
          <Card
            header={
              <span className="text-xs font-semibold text-[#20211F]">
                Real Activity Stream
              </span>
            }
            padding="none"
          >
            {events.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#777872]">
                No recent system events logged.
              </div>
            ) : (
              <div className="divide-y divide-[#E8E6E0] max-h-72 overflow-y-auto">
                {events.slice(0, 6).map((evt) => (
                  <div key={evt.id} className="p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono-tech">
                      <Badge
                        size="sm"
                        variant={
                          evt.level === "ERROR"
                            ? "danger"
                            : evt.level === "WARN"
                            ? "warning"
                            : "neutral"
                        }
                      >
                        {evt.event_type}
                      </Badge>
                      <span className="text-[#9E9F99]">
                        {new Date(evt.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#555650] leading-snug">
                      {evt.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
