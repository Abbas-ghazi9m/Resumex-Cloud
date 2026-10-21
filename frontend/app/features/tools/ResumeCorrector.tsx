"use client";

import React, { useState } from "react";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import {
  CheckCircle,
  Sparkles,
  ArrowRight,
  Copy,
  RefreshCw,
  Edit3,
  Check,
  AlertCircle,
} from "lucide-react";

interface ResumeCorrectorProps {
  initialText?: string;
  onNavigateToEditor?: (text: string) => void;
}

interface IssueItem {
  id: string;
  type: "weak_verb" | "missing_metric" | "tech_casing" | "filler_phrase";
  title: string;
  originalText: string;
  replacementText: string;
  reason: string;
  applied: boolean;
}

export function ResumeCorrector({
  initialText = "",
  onNavigateToEditor,
}: ResumeCorrectorProps) {
  const defaultSample = `• Responsible for managing backend services in python and aws.
• Worked on building rest apis with docker and postgresql.
• Helped with database optimization in order to decrease server latency.
• Participated in sprint planning and handled tasks related to ci/cd pipelines.
• Developed user authentication module with jwt tokens.`;

  const [inputText, setInputText] = useState(initialText || defaultSample);
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [correctedText, setCorrectedText] = useState("");
  const [copied, setCopied] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Tech casing dictionary
  const techCasingMap: Record<string, string> = {
    python: "Python",
    aws: "AWS",
    docker: "Docker",
    postgresql: "PostgreSQL",
    postgres: "PostgreSQL",
    javascript: "JavaScript",
    typescript: "TypeScript",
    react: "React",
    "next.js": "Next.js",
    nextjs: "Next.js",
    "spring boot": "Spring Boot",
    fastapi: "FastAPI",
    sql: "SQL",
    "rest apis": "REST APIs",
    "rest api": "REST API",
    "ci/cd": "CI/CD",
    k8s: "Kubernetes",
    jwt: "JWT",
    api: "API",
    github: "GitHub",
    kubernetes: "Kubernetes",
  };

  // Weak verb replacements
  const weakVerbReplacements: Record<string, string> = {
    "responsible for managing": "Architected and orchestrated",
    "responsible for": "Engineered and led",
    "worked on building": "Engineered and deployed",
    "worked on": "Spearheaded development of",
    "helped with": "Collaborated to optimize",
    "participated in": "Contributed to",
    "handled tasks related to": "Automated and streamlined",
    handled: "Executed and streamlined",
    "in charge of": "Directed and scaled",
  };

  // Filler phrases
  const fillerReplacements: Record<string, string> = {
    "in order to": "to",
    "due to the fact that": "because",
    "duties included": "spearheaded",
    "various different": "various",
  };

  const handleRunCorrector = () => {
    setIsScanning(true);
    const lines = inputText.split("\n");
    const detected: IssueItem[] = [];
    let runningText = inputText;

    // 1. Weak verbs
    Object.entries(weakVerbReplacements).forEach(([weak, strong], idx) => {
      const regex = new RegExp(`\\b${weak}\\b`, "gi");
      if (regex.test(runningText)) {
        detected.push({
          id: `weak-${idx}`,
          type: "weak_verb",
          title: "Passive / Weak Verb Phrasing",
          originalText: weak,
          replacementText: strong,
          reason: `Replacing passive "${weak}" with senior action verb "${strong}" elevates candidate seniority score.`,
          applied: false,
        });
      }
    });

    // 2. Filler phrases
    Object.entries(fillerReplacements).forEach(([filler, concise], idx) => {
      const regex = new RegExp(`\\b${filler}\\b`, "gi");
      if (regex.test(runningText)) {
        detected.push({
          id: `filler-${idx}`,
          type: "filler_phrase",
          title: "Wordiness & Filler Phrase",
          originalText: filler,
          replacementText: concise,
          reason: `Trim filler phrase "${filler}" to concise "${concise}" to maximize punch.`,
          applied: false,
        });
      }
    });

    // 3. Tech casing
    Object.entries(techCasingMap).forEach(([lower, correct], idx) => {
      const regex = new RegExp(`\\b${lower}\\b`, "g");
      if (regex.test(runningText)) {
        detected.push({
          id: `casing-${idx}`,
          type: "tech_casing",
          title: "Technology Nomenclature Capitalization",
          originalText: lower,
          replacementText: correct,
          reason: `ATS parser and technical recruiters expect standardized capitalization for "${correct}".`,
          applied: false,
        });
      }
    });

    // 4. Missing metrics on long bullets
    lines.forEach((line, lIdx) => {
      const clean = line.replace(/^[•\-\*\–\d\.]\s*/, "").trim();
      const hasMetric = /\d+%|\$\d+|\b\d+\s*(?:ms|k|m|million|users|ops|rps)\b/i.test(clean);
      if (clean.length > 25 && !hasMetric && !clean.includes("quantified")) {
        detected.push({
          id: `metric-${lIdx}`,
          type: "missing_metric",
          title: "Missing Quantifiable Impact Metric",
          originalText: clean,
          replacementText: `${clean} [measuring X% latency reduction or Y users served]`,
          reason: "Modern applicant tracking algorithms and hiring managers reward quantified outcomes (XYZ Formula).",
          applied: false,
        });
      }
    });

    setIssues(detected);

    // Initial draft of corrected text
    let polished = inputText;
    Object.entries(weakVerbReplacements).forEach(([weak, strong]) => {
      polished = polished.replace(new RegExp(`\\b${weak}\\b`, "gi"), strong);
    });
    Object.entries(fillerReplacements).forEach(([filler, concise]) => {
      polished = polished.replace(new RegExp(`\\b${filler}\\b`, "gi"), concise);
    });
    Object.entries(techCasingMap).forEach(([lower, correct]) => {
      polished = polished.replace(new RegExp(`\\b${lower}\\b`, "g"), correct);
    });

    setCorrectedText(polished);
    setIsScanning(false);
  };

  const handleApplySingleFix = (issueId: string) => {
    const issue = issues.find((i) => i.id === issueId);
    if (!issue) return;

    const regex = new RegExp(`\\b${issue.originalText}\\b`, "gi");
    setCorrectedText((prev) => prev.replace(regex, issue.replacementText));
    setIssues((prev) =>
      prev.map((i) => (i.id === issueId ? { ...i, applied: true } : i))
    );
  };

  const handleApplyAllFixes = () => {
    let polished = inputText;
    issues.forEach((issue) => {
      if (issue.type !== "missing_metric") {
        const regex = new RegExp(`\\b${issue.originalText}\\b`, "gi");
        polished = polished.replace(regex, issue.replacementText);
      }
    });
    setCorrectedText(polished);
    setIssues((prev) => prev.map((i) => ({ ...i, applied: true })));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(correctedText || inputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E6E0]">
        <div>
          <h2 className="text-base font-semibold text-[#20211F]">
            Resume Bullet Corrector & Style Polisher
          </h2>
          <p className="text-xs text-[#777872] mt-0.5">
            Real-world passive-voice correction, tech nomenclature normalization, and XYZ metric enhancers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setInputText(defaultSample)}
          >
            Load Sample Bullets
          </Button>
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Sparkles className="h-3.5 w-3.5" />}
            onClick={handleRunCorrector}
            isLoading={isScanning}
          >
            Scan & Polish Bullets
          </Button>
        </div>
      </div>

      {/* Editor & Side-by-side Diff Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Input Text */}
        <Card
          header={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-semibold text-[#20211F]">
                Input Resume Bullets
              </span>
              <span className="text-[10px] text-[#777872] font-mono-tech">
                ORIGINAL DRAFT
              </span>
            </div>
          }
          padding="sm"
        >
          <textarea
            rows={10}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste resume bullets or draft text..."
            className="w-full p-2.5 text-xs rounded-[3px] border border-[#E8E6E0] bg-[#FAF9F6] text-[#20211F] focus:border-[#52664F] focus:bg-[#FFFFFF] focus:outline-none transition leading-relaxed"
          />
        </Card>

        {/* Right: Corrected / Polished Text */}
        <Card
          header={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-semibold text-[#52664F] flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5" />
                Corrected & Polished Output
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="text-xs text-[#52664F] hover:underline flex items-center gap-1 font-medium"
                >
                  <Copy className="h-3 w-3" />
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>
          }
          padding="sm"
        >
          <textarea
            rows={10}
            value={correctedText || inputText}
            onChange={(e) => setCorrectedText(e.target.value)}
            className="w-full p-2.5 text-xs rounded-[3px] border border-[#E8E6E0] bg-[#FFFFFF] text-[#20211F] focus:border-[#52664F] focus:outline-none transition leading-relaxed font-sans"
          />
        </Card>
      </div>

      {/* Issues & Suggested Enhancements Feed */}
      {issues.length > 0 && (
        <Card
          header={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-semibold text-[#20211F]">
                Detected Optimization Opportunities ({issues.length})
              </span>
              <Button size="sm" variant="outline" onClick={handleApplyAllFixes}>
                Apply All Recommended Fixes
              </Button>
            </div>
          }
          padding="sm"
        >
          <div className="space-y-3">
            {issues.map((issue) => (
              <div
                key={issue.id}
                className="p-3 rounded-[3px] border border-[#E8E6E0] bg-[#FAF9F6] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      size="sm"
                      variant={
                        issue.type === "weak_verb"
                          ? "warning"
                          : issue.type === "tech_casing"
                          ? "accent"
                          : "neutral"
                      }
                    >
                      {issue.title}
                    </Badge>
                    <span className="text-xs font-mono-tech text-[#B9382F] line-through">
                      {issue.originalText}
                    </span>
                    <ArrowRight className="h-3 w-3 text-[#777872]" />
                    <span className="text-xs font-mono-tech font-bold text-[#52664F]">
                      {issue.replacementText}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#777872] leading-snug">
                    {issue.reason}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant={issue.applied ? "secondary" : "primary"}
                  onClick={() => handleApplySingleFix(issue.id)}
                  disabled={issue.applied}
                >
                  {issue.applied ? (
                    <span className="flex items-center gap-1 text-[#52664F]">
                      <Check className="h-3 w-3" /> Applied
                    </span>
                  ) : (
                    "Apply Fix"
                  )}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Transfer Action */}
      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onNavigateToEditor && onNavigateToEditor(correctedText || inputText)}
        >
          Transfer into Live Resume Editor
        </Button>
      </div>
    </div>
  );
}
