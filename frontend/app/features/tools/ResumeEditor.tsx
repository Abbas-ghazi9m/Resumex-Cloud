"use client";

import React, { useState } from "react";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import {
  Printer,
  Copy,
  Download,
  Bold,
  Italic,
  List,
  Sparkles,
  FileCheck2,
  FileText,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface ResumeEditorProps {
  initialContent?: string;
  onNavigateToAtsChecker?: (text: string) => void;
  onNavigateToCorrector?: (text: string) => void;
}

export function ResumeEditor({
  initialContent = "",
  onNavigateToAtsChecker,
  onNavigateToCorrector,
}: ResumeEditorProps) {
  const defaultText = `ALEXANDER VANCE
San Francisco, CA | alex.vance@cloudeng.io | (555) 234-5678 | linkedin.com/in/alexandervance

PROFESSIONAL SUMMARY
Senior Backend Engineer with 5+ years of experience designing and deploying high-throughput distributed microservices in Java, Spring Boot, PostgreSQL, Docker, and Kubernetes. Scaled systems to 15M daily requests and reduced database query overhead by 42%.

TECHNICAL SKILLS
Languages: Java (11/17), Python, SQL, Go, Bash
Frameworks: Spring Boot, Hibernate, REST APIs, GraphQL, JUnit
Cloud & DevOps: Docker, Kubernetes, AWS (EC2, S3), GitHub Actions, CI/CD, Terraform
Databases: PostgreSQL, Redis, MySQL, MongoDB

PROFESSIONAL EXPERIENCE
Senior Software Engineer | FinTech Cloud Systems | 2022 – Present
• Architected and deployed Java Spring Boot microservices processing 12,000 requests/second with sub-40ms P99 latency.
• Engineered distributed caching layer using Redis and PostgreSQL, reducing database query overhead by 42%.
• Spearheaded containerization migration with Docker and Kubernetes, standardizing deployment across 8 microservices.
• Integrated automated CI/CD deployment pipelines using GitHub Actions, decreasing release cycle duration from 4 hours to 18 minutes.

Software Engineer | Nexus Digital Platforms | 2019 – 2022
• Developed backend RESTful services and relational database schemas in Java and MySQL for enterprise portal.
• Refactored legacy monolithic services into modular Spring components, improving test coverage to 88%.
• Collaborated with frontend engineering teams to implement GraphQL and REST endpoints serving 500,000 active web users.

EDUCATION
Bachelor of Science in Computer Science
University of California, Berkeley | Graduated 2019`;

  const [content, setContent] = useState(initialContent || defaultText);
  const [copied, setCopied] = useState(false);

  // Live telemetry
  const words = content.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const charCount = content.length;
  const estimatedPages = wordCount <= 450 ? 1 : wordCount <= 900 ? 2 : 3;

  // Formatting checks
  const hasTables = content.includes("|---") || content.includes("+---");
  const hasContact = /(?:@|\.com|\(\d{3}\)|\d{3}[-\s]\d{3})/i.test(content);
  const hasExperience = /experience|work history/i.test(content);
  const hasEducation = /education|university|degree|bachelor/i.test(content);
  const hasSkills = /skills|technologies|proficiencies/i.test(content);

  const handleInsertSection = (sectionHeader: string) => {
    setContent((prev) => `${prev}\n\n${sectionHeader}\n• Accomplished [X] as measured by [Y] by doing [Z].`);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "resume.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E6E0] no-print">
        <div>
          <h2 className="text-base font-semibold text-[#20211F]">
            Live Resume Document Editor
          </h2>
          <p className="text-xs text-[#777872] mt-0.5">
            Distraction-free markdown/text editor with live ATS-standard page preview and format validation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Copy className="h-3.5 w-3.5" />}
            onClick={handleCopy}
          >
            {copied ? "Copied" : "Copy Text"}
          </Button>

          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Download className="h-3.5 w-3.5" />}
            onClick={handleDownloadTxt}
          >
            Export TXT
          </Button>

          <Button
            size="sm"
            variant="primary"
            leftIcon={<Printer className="h-3.5 w-3.5" />}
            onClick={handlePrint}
          >
            Print Clean ATS PDF
          </Button>
        </div>
      </div>

      {/* Real-time Document Telemetry Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 no-print">
        <div className="p-2.5 rounded-[3px] border border-[#E8E6E0] bg-[#FFFFFF] text-xs">
          <span className="text-[10px] font-mono-tech uppercase text-[#777872] block">
            Word Count
          </span>
          <span className="text-base font-bold font-mono-tech text-[#20211F]">
            {wordCount}
          </span>
        </div>

        <div className="p-2.5 rounded-[3px] border border-[#E8E6E0] bg-[#FFFFFF] text-xs">
          <span className="text-[10px] font-mono-tech uppercase text-[#777872] block">
            Estimated Fit
          </span>
          <span
            className={`text-base font-bold font-mono-tech ${
              estimatedPages === 1
                ? "text-[#3F704D]"
                : estimatedPages === 2
                ? "text-[#B46C1E]"
                : "text-[#B9382F]"
            }`}
          >
            {estimatedPages} Page{estimatedPages > 1 ? "s" : ""}
          </span>
        </div>

        <div className="p-2.5 rounded-[3px] border border-[#E8E6E0] bg-[#FFFFFF] text-xs">
          <span className="text-[10px] font-mono-tech uppercase text-[#777872] block">
            Headers Audit
          </span>
          <span className="text-xs font-semibold text-[#52664F] flex items-center gap-1 mt-0.5">
            {hasContact && hasExperience && hasEducation && hasSkills ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-[#3F704D]" /> Standard 4/4
              </>
            ) : (
              <>
                <AlertTriangle className="h-3.5 w-3.5 text-[#B46C1E]" /> Incomplete
              </>
            )}
          </span>
        </div>

        <div className="p-2.5 rounded-[3px] border border-[#E8E6E0] bg-[#FFFFFF] text-xs">
          <span className="text-[10px] font-mono-tech uppercase text-[#777872] block">
            Table Risk
          </span>
          <span className="text-xs font-semibold mt-0.5 block">
            {hasTables ? (
              <span className="text-[#B9382F] flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Risk (Tables)
              </span>
            ) : (
              <span className="text-[#3F704D] flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Zero Table Risk
              </span>
            )}
          </span>
        </div>

        <div className="p-2.5 rounded-[3px] border border-[#E8E6E0] bg-[#FFFFFF] text-xs flex flex-col justify-between">
          <span className="text-[10px] font-mono-tech uppercase text-[#777872] block">
            Next Action
          </span>
          <div className="flex gap-1.5 mt-0.5">
            <button
              onClick={() => onNavigateToAtsChecker && onNavigateToAtsChecker(content)}
              className="text-[11px] text-[#52664F] hover:underline font-medium"
            >
              ATS Match
            </button>
            <span className="text-[#777872]">•</span>
            <button
              onClick={() => onNavigateToCorrector && onNavigateToCorrector(content)}
              className="text-[11px] text-[#52664F] hover:underline font-medium"
            >
              Corrector
            </button>
          </div>
        </div>
      </div>

      {/* Editor & Live Rendered View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left: Input Text Editor */}
        <div className="space-y-2 no-print">
          {/* Quick Toolbar */}
          <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-[3px] bg-[#FAF9F6] border border-[#E8E6E0] text-xs">
            <button
              onClick={() => handleInsertSection("PROFESSIONAL SUMMARY")}
              className="px-2 py-1 bg-[#FFFFFF] border border-[#E8E6E0] rounded-[2px] hover:bg-[#F0EEE7]"
            >
              + Summary
            </button>
            <button
              onClick={() => handleInsertSection("PROFESSIONAL EXPERIENCE")}
              className="px-2 py-1 bg-[#FFFFFF] border border-[#E8E6E0] rounded-[2px] hover:bg-[#F0EEE7]"
            >
              + Experience
            </button>
            <button
              onClick={() => handleInsertSection("EDUCATION")}
              className="px-2 py-1 bg-[#FFFFFF] border border-[#E8E6E0] rounded-[2px] hover:bg-[#F0EEE7]"
            >
              + Education
            </button>
            <button
              onClick={() => handleInsertSection("TECHNICAL SKILLS")}
              className="px-2 py-1 bg-[#FFFFFF] border border-[#E8E6E0] rounded-[2px] hover:bg-[#F0EEE7]"
            >
              + Skills
            </button>
            <button
              onClick={() => handleInsertSection("KEY PROJECTS")}
              className="px-2 py-1 bg-[#FFFFFF] border border-[#E8E6E0] rounded-[2px] hover:bg-[#F0EEE7]"
            >
              + Project
            </button>
          </div>

          <textarea
            rows={30}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-4 rounded-[4px] border border-[#E8E6E0] bg-[#FFFFFF] text-xs text-[#20211F] font-mono-tech leading-relaxed focus:border-[#52664F] focus:outline-none transition shadow-sm"
          />
        </div>

        {/* Right: Live Rendered ATS Preview */}
        <div className="bg-[#FFFFFF] border border-[#E8E6E0] rounded-[4px] shadow-sm p-8 sm:p-12 text-[#20211F] min-h-[750px] leading-relaxed text-xs">
          <div className="whitespace-pre-line font-sans text-xs text-[#20211F] space-y-1">
            {content.split("\n\n").map((block, idx) => {
              const lines = block.split("\n");
              const firstLine = lines[0]?.trim();

              // Check if block is a section header
              const isHeader =
                firstLine === firstLine?.toUpperCase() &&
                firstLine.length > 3 &&
                !firstLine.includes("@") &&
                !firstLine.includes("|");

              if (idx === 0) {
                // Name & contact header
                return (
                  <div key={idx} className="border-b border-[#52664F] pb-3 mb-4">
                    <h1 className="text-xl font-bold tracking-tight text-[#20211F]">
                      {lines[0]}
                    </h1>
                    {lines.slice(1).map((l, lIdx) => (
                      <div key={lIdx} className="text-[11px] text-[#777872] mt-0.5">
                        {l}
                      </div>
                    ))}
                  </div>
                );
              }

              if (isHeader) {
                return (
                  <div key={idx} className="pt-2">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[#52664F] border-b border-[#E8E6E0] pb-1 mb-1.5">
                      {firstLine}
                    </h2>
                    <div className="text-xs text-[#333331] leading-relaxed">
                      {lines.slice(1).join("\n")}
                    </div>
                  </div>
                );
              }

              return (
                <div key={idx} className="text-xs text-[#333331] leading-relaxed">
                  {block}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
