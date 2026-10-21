"use client";

import React, { useState } from "react";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { runQuickAnalysis } from "../../api";
import { AnalysisData } from "../../types";
import {
  FileCheck2,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Layers,
  Edit3,
} from "lucide-react";

interface AtsCheckerProps {
  initialResumeText?: string;
  onNavigateToCorrector?: (text: string) => void;
  onNavigateToEditor?: (text: string) => void;
}

export function AtsChecker({
  initialResumeText = "",
  onNavigateToCorrector,
  onNavigateToEditor,
}: AtsCheckerProps) {
  const [jobTitle, setJobTitle] = useState("Senior Java Backend Developer");
  const [company, setCompany] = useState("Enterprise Cloud FinTech");
  const [resumeText, setResumeText] = useState(
    initialResumeText ||
      `ALEXANDER VANCE
San Francisco, CA | alex.vance@cloudeng.io | (555) 234-5678

PROFESSIONAL SUMMARY
Senior Backend Engineer with 5+ years of experience designing and deploying high-throughput distributed microservices in Java, Spring Boot, PostgreSQL, Docker, and Kubernetes. Scaled systems to 15M daily requests.

PROFESSIONAL EXPERIENCE
Senior Software Engineer | FinTech Cloud Systems | 2022 – Present
• Architected and deployed Java Spring Boot microservices processing 12,000 requests/second with sub-40ms P99 latency.
• Engineered distributed caching layer using Redis and PostgreSQL, reducing database query overhead by 42%.
• Spearheaded containerization migration with Docker and Kubernetes, standardizing deployment across 8 microservices.
• Integrated automated CI/CD deployment pipelines using GitHub Actions, decreasing release cycle duration from 4 hours to 18 minutes.

EDUCATION
Bachelor of Science in Computer Science | UC Berkeley`
  );

  const [jobText, setJobText] = useState(`Job Title: Senior Java Backend Developer
Company: Enterprise Cloud FinTech

Requirements (Must Have):
• 4+ years of software engineering experience.
• Strong proficiency with Java 11/17 and Spring Boot microservices.
• Relational database expertise with PostgreSQL or MySQL.
• Hands-on containerization with Docker and Kubernetes.
• Automated testing with JUnit and CI/CD pipelines.
• Bachelor's Degree in Computer Science or related.

Preferred Qualifications:
• AWS cloud infrastructure experience (EC2, S3, ECS).
• Distributed caching using Redis.
• Familiarity with message brokers such as Kafka or RabbitMQ.`);

  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);

  const handleRunMatch = async () => {
    if (!resumeText.trim() || !jobText.trim()) {
      setError("Please provide both resume text and job description text.");
      return;
    }
    setAnalyzing(true);
    setError(null);
    try {
      const res = await runQuickAnalysis({
        resume_text: resumeText,
        job_text: jobText,
        job_title: jobTitle,
        candidate_name: "Candidate",
      });
      setAnalysis(res);
    } catch (err: any) {
      setError(err.message || "Failed to execute ATS match evaluation.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E6E0]">
        <div>
          <h2 className="text-base font-semibold text-[#20211F]">
            ATS Compatibility & Gap Checker
          </h2>
          <p className="text-xs text-[#777872] mt-0.5">
            Deterministic token matching against job requirements, semantic keyword coverage, and parseability audits.
          </p>
        </div>

        <Button
          size="md"
          variant="primary"
          isLoading={analyzing}
          leftIcon={<FileCheck2 className="h-4 w-4" />}
          onClick={handleRunMatch}
        >
          Evaluate ATS Match
        </Button>
      </div>

      {error && (
        <div className="p-3 rounded-[3px] bg-[#FDF2F1] border border-[#F5C7C3] text-xs text-[#9E2B23] flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-semibold underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Input Columns: Resume on Left, Job Description on Right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Target Resume */}
        <Card
          header={
            <span className="text-xs font-semibold text-[#20211F]">
              1. Candidate Resume Text
            </span>
          }
          padding="sm"
        >
          <textarea
            rows={10}
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste complete candidate resume text..."
            className="w-full p-2.5 text-xs rounded-[3px] border border-[#E8E6E0] bg-[#FAF9F6] text-[#20211F] focus:border-[#52664F] focus:bg-[#FFFFFF] focus:outline-none transition leading-relaxed"
          />
        </Card>

        {/* Right: Job Description */}
        <Card
          header={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-semibold text-[#20211F]">
                2. Target Job Description
              </span>
              <div className="flex items-center gap-1.5 text-[11px]">
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Target Role"
                  className="px-2 py-0.5 rounded-[3px] border border-[#E8E6E0] bg-[#FAF9F6] text-xs text-[#20211F] focus:outline-none"
                />
              </div>
            </div>
          }
          padding="sm"
        >
          <textarea
            rows={10}
            value={jobText}
            onChange={(e) => setJobText(e.target.value)}
            placeholder="Paste target job description and requirements..."
            className="w-full p-2.5 text-xs rounded-[3px] border border-[#E8E6E0] bg-[#FAF9F6] text-[#20211F] focus:border-[#52664F] focus:bg-[#FFFFFF] focus:outline-none transition leading-relaxed"
          />
        </Card>
      </div>

      {/* Evaluation Results */}
      {analysis && (
        <div className="space-y-6 pt-2">
          {/* Main Score Banner */}
          <div className="p-5 rounded-[4px] bg-[#FFFFFF] border border-[#E8E6E0] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono-tech uppercase text-[#777872]">
                CALCULATED ATS MATCH SCORE
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-4xl font-bold font-mono-tech text-[#52664F]">
                  {Math.round(analysis.overall_score)}%
                </span>
                <span className="text-xs text-[#777872]">
                  {analysis.overall_score >= 80
                    ? "Strong ATS Compatibility"
                    : analysis.overall_score >= 60
                    ? "Moderate Alignment — Gaps Present"
                    : "High Risk — Critical Keywords Missing"}
                </span>
              </div>
              <p className="text-xs text-[#555650] mt-1.5 leading-relaxed max-w-2xl">
                {analysis.executive_summary}
              </p>
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onNavigateToCorrector && onNavigateToCorrector(resumeText)}
              >
                Send to Corrector
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => onNavigateToEditor && onNavigateToEditor(resumeText)}
              >
                Open in Live Editor
              </Button>
            </div>
          </div>

          {/* Breakdown by Factor */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(analysis.breakdown || {}).slice(0, 4).map(([key, val]: [string, any]) => (
              <Card key={key} padding="sm">
                <span className="text-[10px] font-mono-tech uppercase text-[#777872] block truncate">
                  {key.replace(/_/g, " ")}
                </span>
                <div className="text-xl font-bold font-mono-tech text-[#52664F] my-1">
                  {val.score}%
                </div>
                <span className="text-[10px] text-[#777872] block truncate">
                  Weight: {val.weight_percentage}%
                </span>
              </Card>
            ))}
          </div>

          {/* Keywords Match Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Matched Keywords */}
            <Card
              header={
                <span className="text-xs font-semibold text-[#3F704D] flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Matched Requirements ({analysis.matched_keywords?.length || 0})
                </span>
              }
              padding="sm"
            >
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                {(analysis.matched_keywords || []).map((kw, idx) => (
                  <Badge key={idx} variant="success" size="sm">
                    {kw.keyword} ({kw.resume_occurrences}x in resume)
                  </Badge>
                ))}
                {(!analysis.matched_keywords || analysis.matched_keywords.length === 0) && (
                  <span className="text-xs text-[#777872]">
                    No keyword matches identified.
                  </span>
                )}
              </div>
            </Card>

            {/* Critical Missing Keywords */}
            <Card
              header={
                <span className="text-xs font-semibold text-[#B9382F] flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Missing Job Keywords ({analysis.missing_keywords?.length || 0})
                </span>
              }
              padding="sm"
            >
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                {(analysis.missing_keywords || []).map((kw, idx) => (
                  <Badge
                    key={idx}
                    variant={kw.importance === "Critical" ? "danger" : "warning"}
                    size="sm"
                  >
                    {kw.keyword} ({kw.importance})
                  </Badge>
                ))}
                {(!analysis.missing_keywords || analysis.missing_keywords.length === 0) && (
                  <span className="text-xs text-[#777872]">
                    No missing keywords detected.
                  </span>
                )}
              </div>
            </Card>
          </div>

          {/* Keyword Insertion Suggestions */}
          {analysis.missing_keywords && analysis.missing_keywords.length > 0 && (
            <Card
              header={
                <span className="text-xs font-semibold text-[#20211F]">
                  Natural Keyword Integration Recommendations
                </span>
              }
              padding="sm"
            >
              <div className="space-y-2 text-xs">
                {analysis.missing_keywords.slice(0, 4).map((kw, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-[3px] border border-[#E8E6E0] bg-[#FAF9F6] flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="font-semibold text-[#20211F]">
                        Incorporate &quot;{kw.keyword}&quot;
                      </div>
                      <p className="text-[11px] text-[#777872] mt-0.5">
                        {kw.recommendation}
                      </p>
                    </div>
                    <Badge variant="accent" size="sm">
                      {kw.suggested_section || "Experience"}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
