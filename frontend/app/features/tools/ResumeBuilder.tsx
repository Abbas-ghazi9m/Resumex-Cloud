"use client";

import React, { useState } from "react";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { ResumeData } from "../../types";
import {
  Download,
  Upload,
  Printer,
  Copy,
  Plus,
  Trash2,
  Check,
  Layers,
  FileCheck2,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface ResumeBuilderProps {
  onSendToAtsChecker?: (resumeText: string) => void;
  onSendToCorrector?: (resumeText: string) => void;
  onSendToEditor?: (resumeText: string) => void;
}

const DEFAULT_RESUME: ResumeData = {
  personal: {
    fullName: "Alexander Vance",
    title: "Senior Cloud & Backend Engineer",
    email: "alex.vance@cloudeng.io",
    phone: "(555) 234-5678",
    location: "San Francisco, CA",
    website: "https://avance.dev",
    linkedin: "linkedin.com/in/alexandervance",
    github: "github.com/avance-cloud",
  },
  summary:
    "Senior Backend Engineer with 5+ years of experience designing and deploying high-throughput distributed microservices, RESTful APIs, and cloud-native backend systems. Specialized in Java, Spring Boot, PostgreSQL, Docker, and Kubernetes. Scaled systems to 15M daily requests and reduced database query overhead by 42%.",
  experience: [
    {
      id: "exp-1",
      company: "FinTech Cloud Systems",
      role: "Senior Software Engineer",
      location: "San Francisco, CA",
      startDate: "2022",
      endDate: "Present",
      current: true,
      bullets: [
        "Architected and deployed Java Spring Boot microservices processing 12,000 requests/second with sub-40ms P99 latency.",
        "Engineered distributed caching layer using Redis and PostgreSQL, reducing database query overhead by 42%.",
        "Spearheaded containerization migration with Docker and Kubernetes, standardizing deployment across 8 microservices.",
        "Integrated automated CI/CD deployment pipelines using GitHub Actions, decreasing release cycle duration from 4 hours to 18 minutes.",
      ],
    },
    {
      id: "exp-2",
      company: "Nexus Digital Platforms",
      role: "Software Engineer",
      location: "San Jose, CA",
      startDate: "2019",
      endDate: "2022",
      current: false,
      bullets: [
        "Developed backend RESTful services and relational database schemas in Java and MySQL for enterprise portal.",
        "Refactored legacy monolithic services into modular Spring components, improving test coverage to 88%.",
        "Collaborated with frontend engineering teams to implement GraphQL and REST endpoints serving 500,000 active web users.",
      ],
    },
  ],
  education: [
    {
      id: "edu-1",
      school: "University of California, Berkeley",
      degree: "Bachelor of Science",
      field: "Computer Science",
      graduationYear: "2019",
      gpa: "3.85 / 4.0",
    },
  ],
  skills: {
    languages: ["Java", "Python", "SQL", "TypeScript", "Go", "Bash"],
    frameworks: ["Spring Boot", "FastAPI", "React", "Next.js", "Hibernate", "GraphQL"],
    databases: ["PostgreSQL", "Redis", "MySQL", "MongoDB"],
    cloudDevOps: ["AWS (EC2, S3, ECS)", "Docker", "Kubernetes", "CI/CD", "Terraform"],
    tools: ["Git", "GitHub Actions", "Prometheus", "Grafana", "Jira", "JUnit"],
  },
  projects: [
    {
      id: "proj-1",
      name: "High-Throughput Order Ingestion Engine",
      tech: "Java, Spring Boot, Kafka, Redis",
      description: "Low-latency financial trade execution pipeline with zero message loss guarantee.",
      bullets: [
        "Benchmarked throughput to 25,000 ops/sec with Redis cluster buffering.",
        "Engineered dead-letter queue recovery protocols for unprocessable orders.",
      ],
      link: "https://github.com/avance-cloud/trade-engine",
    },
  ],
  certifications: [
    {
      id: "cert-1",
      name: "AWS Certified Solutions Architect – Associate",
      issuer: "Amazon Web Services",
      date: "2023",
    },
  ],
};

export function ResumeBuilder({
  onSendToAtsChecker,
  onSendToCorrector,
  onSendToEditor,
}: ResumeBuilderProps) {
  const [resume, setResume] = useState<ResumeData>(DEFAULT_RESUME);
  const [template, setTemplate] = useState<"modern" | "executive" | "minimal">("modern");
  const [copied, setCopied] = useState(false);

  // Experience handlers
  const handleAddExperience = () => {
    const newExp = {
      id: `exp-${Date.now()}`,
      company: "New Company Inc.",
      role: "Software Engineer",
      location: "Remote",
      startDate: "2023",
      endDate: "Present",
      current: true,
      bullets: ["Architected key feature improving throughput by X%."],
    };
    setResume({ ...resume, experience: [newExp, ...resume.experience] });
  };

  const handleRemoveExperience = (id: string) => {
    setResume({
      ...resume,
      experience: resume.experience.filter((e) => e.id !== id),
    });
  };

  const handleUpdateExperience = (id: string, field: string, val: any) => {
    setResume({
      ...resume,
      experience: resume.experience.map((e) => (e.id === id ? { ...e, [field]: val } : e)),
    });
  };

  const handleAddBullet = (expId: string) => {
    setResume({
      ...resume,
      experience: resume.experience.map((e) =>
        e.id === expId ? { ...e, bullets: [...e.bullets, "Spearheaded initiative delivering measurable results."] } : e
      ),
    });
  };

  const handleUpdateBullet = (expId: string, bIdx: number, val: string) => {
    setResume({
      ...resume,
      experience: resume.experience.map((e) =>
        e.id === expId
          ? {
              ...e,
              bullets: e.bullets.map((b, i) => (i === bIdx ? val : b)),
            }
          : e
      ),
    });
  };

  const handleRemoveBullet = (expId: string, bIdx: number) => {
    setResume({
      ...resume,
      experience: resume.experience.map((e) =>
        e.id === expId
          ? { ...e, bullets: e.bullets.filter((_, i) => i !== bIdx) }
          : e
      ),
    });
  };

  // Convert to Plain Text
  const formatAsPlainText = () => {
    let out = `${resume.personal.fullName}\n${resume.personal.title}\n`;
    out += `${resume.personal.email} | ${resume.personal.phone} | ${resume.personal.location}\n\n`;
    out += `SUMMARY\n${resume.summary}\n\n`;
    out += `EXPERIENCE\n`;
    resume.experience.forEach((e) => {
      out += `${e.role} | ${e.company} | ${e.startDate} - ${e.endDate}\n`;
      e.bullets.forEach((b) => (out += `• ${b}\n`));
      out += `\n`;
    });
    out += `EDUCATION\n`;
    resume.education.forEach((ed) => {
      out += `${ed.degree} in ${ed.field} - ${ed.school} (${ed.graduationYear})\n`;
    });
    out += `\nSKILLS\n`;
    Object.entries(resume.skills).forEach(([cat, list]) => {
      out += `${cat}: ${list.join(", ")}\n`;
    });
    return out;
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(formatAsPlainText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(resume, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `resume_${resume.personal.fullName.replace(/\s+/g, "_")}.json`);
    dlAnchor.click();
  };

  const handleUploadJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.personal && parsed.experience) {
          setResume(parsed);
        } else {
          alert("Invalid resume JSON format.");
        }
      } catch {
        alert("Failed to parse resume JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E6E0] no-print">
        <div>
          <h2 className="text-base font-semibold text-[#20211F]">
            Resume Builder & Live ATS Styler
          </h2>
          <p className="text-xs text-[#777872] mt-0.5">
            Deterministic field validation, instant layout engine, and zero-loss ATS print export.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Template Switcher */}
          <div className="flex items-center rounded-[3px] border border-[#E8E6E0] bg-[#FFFFFF] p-0.5 text-xs">
            <button
              onClick={() => setTemplate("modern")}
              className={`px-2.5 py-1 rounded-[2px] transition ${
                template === "modern"
                  ? "bg-[#52664F] text-white font-medium"
                  : "text-[#777872] hover:text-[#20211F]"
              }`}
            >
              Modern ATS
            </button>
            <button
              onClick={() => setTemplate("executive")}
              className={`px-2.5 py-1 rounded-[2px] transition ${
                template === "executive"
                  ? "bg-[#52664F] text-white font-medium"
                  : "text-[#777872] hover:text-[#20211F]"
              }`}
            >
              Executive
            </button>
            <button
              onClick={() => setTemplate("minimal")}
              className={`px-2.5 py-1 rounded-[2px] transition ${
                template === "minimal"
                  ? "bg-[#52664F] text-white font-medium"
                  : "text-[#777872] hover:text-[#20211F]"
              }`}
            >
              Minimal Tech
            </button>
          </div>

          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Copy className="h-3.5 w-3.5" />}
            onClick={handleCopyText}
          >
            {copied ? "Copied" : "Copy Text"}
          </Button>

          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Download className="h-3.5 w-3.5" />}
            onClick={handleDownloadJson}
          >
            Export JSON
          </Button>

          <label className="cursor-pointer">
            <span className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium bg-[#FAF9F6] text-[#20211F] border border-[#E8E6E0] rounded-[4px] hover:bg-[#F0EEE7] transition">
              <Upload className="h-3.5 w-3.5 mr-1 text-[#52664F]" />
              Import JSON
            </span>
            <input
              type="file"
              accept=".json"
              onChange={handleUploadJson}
              className="hidden"
            />
          </label>

          <Button
            size="sm"
            variant="primary"
            leftIcon={<Printer className="h-3.5 w-3.5" />}
            onClick={handlePrint}
          >
            Print / Save ATS PDF
          </Button>
        </div>
      </div>

      {/* Two Column Layout: Editor on Left, Live Document on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-4 no-print max-h-[85vh] overflow-y-auto pr-1">
          {/* Personal Info Section */}
          <Card
            header={<span className="text-xs font-semibold text-[#20211F]">Personal Information</span>}
            padding="sm"
          >
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[#777872] mb-0.5">Full Name</label>
                <input
                  type="text"
                  value={resume.personal.fullName}
                  onChange={(e) =>
                    setResume({
                      ...resume,
                      personal: { ...resume.personal, fullName: e.target.value },
                    })
                  }
                  className="w-full p-1.5 rounded-[3px] border border-[#E8E6E0] bg-[#FAF9F6] text-[#20211F] text-xs focus:border-[#52664F] focus:bg-[#FFFFFF] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[#777872] mb-0.5">Professional Title</label>
                <input
                  type="text"
                  value={resume.personal.title}
                  onChange={(e) =>
                    setResume({
                      ...resume,
                      personal: { ...resume.personal, title: e.target.value },
                    })
                  }
                  className="w-full p-1.5 rounded-[3px] border border-[#E8E6E0] bg-[#FAF9F6] text-[#20211F] text-xs focus:border-[#52664F] focus:bg-[#FFFFFF] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[#777872] mb-0.5">Email</label>
                <input
                  type="email"
                  value={resume.personal.email}
                  onChange={(e) =>
                    setResume({
                      ...resume,
                      personal: { ...resume.personal, email: e.target.value },
                    })
                  }
                  className="w-full p-1.5 rounded-[3px] border border-[#E8E6E0] bg-[#FAF9F6] text-[#20211F] text-xs focus:border-[#52664F] focus:bg-[#FFFFFF] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[#777872] mb-0.5">Phone</label>
                <input
                  type="text"
                  value={resume.personal.phone}
                  onChange={(e) =>
                    setResume({
                      ...resume,
                      personal: { ...resume.personal, phone: e.target.value },
                    })
                  }
                  className="w-full p-1.5 rounded-[3px] border border-[#E8E6E0] bg-[#FAF9F6] text-[#20211F] text-xs focus:border-[#52664F] focus:bg-[#FFFFFF] focus:outline-none"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[#777872] mb-0.5">Location & Links</label>
                <input
                  type="text"
                  value={resume.personal.location}
                  onChange={(e) =>
                    setResume({
                      ...resume,
                      personal: { ...resume.personal, location: e.target.value },
                    })
                  }
                  className="w-full p-1.5 rounded-[3px] border border-[#E8E6E0] bg-[#FAF9F6] text-[#20211F] text-xs focus:border-[#52664F] focus:bg-[#FFFFFF] focus:outline-none"
                />
              </div>
            </div>
          </Card>

          {/* Professional Summary */}
          <Card
            header={<span className="text-xs font-semibold text-[#20211F]">Professional Summary</span>}
            padding="sm"
          >
            <textarea
              rows={4}
              value={resume.summary}
              onChange={(e) => setResume({ ...resume, summary: e.target.value })}
              className="w-full p-2 text-xs rounded-[3px] border border-[#E8E6E0] bg-[#FAF9F6] text-[#20211F] focus:border-[#52664F] focus:bg-[#FFFFFF] focus:outline-none leading-relaxed"
            />
          </Card>

          {/* Work Experience Entries */}
          <Card
            header={
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-semibold text-[#20211F]">Work Experience</span>
                <Button size="sm" variant="ghost" onClick={handleAddExperience}>
                  <Plus className="h-3.5 w-3.5 text-[#52664F]" /> Add Role
                </Button>
              </div>
            }
            padding="sm"
          >
            <div className="space-y-4">
              {resume.experience.map((exp, idx) => (
                <div
                  key={exp.id}
                  className="p-3 rounded-[3px] border border-[#E8E6E0] bg-[#FBFBFA] space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#20211F]">
                      Role #{idx + 1}
                    </span>
                    <button
                      onClick={() => handleRemoveExperience(exp.id)}
                      className="text-[#9E2B23] hover:underline text-[11px]"
                    >
                      Delete Role
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Role Title"
                      value={exp.role}
                      onChange={(e) => handleUpdateExperience(exp.id, "role", e.target.value)}
                      className="p-1.5 rounded-[3px] border border-[#E8E6E0] bg-[#FFFFFF] text-xs text-[#20211F]"
                    />
                    <input
                      type="text"
                      placeholder="Company Name"
                      value={exp.company}
                      onChange={(e) => handleUpdateExperience(exp.id, "company", e.target.value)}
                      className="p-1.5 rounded-[3px] border border-[#E8E6E0] bg-[#FFFFFF] text-xs text-[#20211F]"
                    />
                    <input
                      type="text"
                      placeholder="Start Date"
                      value={exp.startDate}
                      onChange={(e) => handleUpdateExperience(exp.id, "startDate", e.target.value)}
                      className="p-1.5 rounded-[3px] border border-[#E8E6E0] bg-[#FFFFFF] text-xs text-[#20211F]"
                    />
                    <input
                      type="text"
                      placeholder="End Date or Present"
                      value={exp.endDate}
                      onChange={(e) => handleUpdateExperience(exp.id, "endDate", e.target.value)}
                      className="p-1.5 rounded-[3px] border border-[#E8E6E0] bg-[#FFFFFF] text-xs text-[#20211F]"
                    />
                  </div>

                  {/* Bullet Points */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-[11px] text-[#777872]">
                      <span>Accomplishment Bullets</span>
                      <button
                        onClick={() => handleAddBullet(exp.id)}
                        className="text-[#52664F] hover:underline"
                      >
                        + Add Bullet
                      </button>
                    </div>
                    {exp.bullets.map((bullet, bIdx) => (
                      <div key={bIdx} className="flex items-start gap-1.5">
                        <textarea
                          rows={2}
                          value={bullet}
                          onChange={(e) => handleUpdateBullet(exp.id, bIdx, e.target.value)}
                          className="flex-1 p-1.5 rounded-[3px] border border-[#E8E6E0] bg-[#FFFFFF] text-xs text-[#20211F] focus:border-[#52664F] focus:outline-none"
                        />
                        <button
                          onClick={() => handleRemoveBullet(exp.id, bIdx)}
                          className="p-1 text-[#777872] hover:text-[#9E2B23]"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Live Styled ATS Printable Document Preview (7 cols) */}
        <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#E8E6E0] rounded-[4px] shadow-sm p-8 sm:p-12 text-[#20211F] min-h-[900px] leading-relaxed">
          {/* Printable Layout Container */}
          <div className="space-y-6">
            {/* Header / Name & Contact */}
            <div
              className={`border-b pb-4 ${
                template === "executive"
                  ? "border-[#20211F] text-center"
                  : template === "minimal"
                  ? "border-[#E8E6E0] font-mono-tech"
                  : "border-[#52664F]"
              }`}
            >
              <h1
                className={`text-2xl font-bold tracking-tight text-[#20211F] ${
                  template === "executive" ? "font-serif text-3xl" : ""
                }`}
              >
                {resume.personal.fullName || "YOUR NAME"}
              </h1>
              <div
                className={`text-xs text-[#52664F] font-semibold mt-0.5 ${
                  template === "executive" ? "font-serif italic" : ""
                }`}
              >
                {resume.personal.title || "Target Professional Title"}
              </div>
              <div className="text-[11px] text-[#777872] mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 justify-start">
                <span>{resume.personal.email}</span>
                <span>•</span>
                <span>{resume.personal.phone}</span>
                <span>•</span>
                <span>{resume.personal.location}</span>
                {resume.personal.linkedin && (
                  <>
                    <span>•</span>
                    <span>{resume.personal.linkedin}</span>
                  </>
                )}
              </div>
            </div>

            {/* Professional Summary */}
            {resume.summary && (
              <div>
                <h2
                  className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${
                    template === "executive"
                      ? "font-serif border-b border-[#E8E6E0] pb-0.5 text-[#20211F]"
                      : "text-[#52664F]"
                  }`}
                >
                  Professional Summary
                </h2>
                <p className="text-xs text-[#333331] leading-relaxed">
                  {resume.summary}
                </p>
              </div>
            )}

            {/* Work Experience */}
            {resume.experience.length > 0 && (
              <div>
                <h2
                  className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                    template === "executive"
                      ? "font-serif border-b border-[#E8E6E0] pb-0.5 text-[#20211F]"
                      : "text-[#52664F]"
                  }`}
                >
                  Professional Experience
                </h2>
                <div className="space-y-4">
                  {resume.experience.map((exp) => (
                    <div key={exp.id} className="text-xs space-y-1">
                      <div className="flex items-center justify-between font-semibold text-[#20211F]">
                        <span>
                          {exp.role} <span className="font-normal text-[#777872]">| {exp.company}</span>
                        </span>
                        <span className="font-mono-tech text-[11px] text-[#777872] font-normal">
                          {exp.startDate} – {exp.endDate}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#777872]">
                        {exp.location}
                      </div>
                      <ul className="list-disc list-inside space-y-1 pt-1 text-[#333331] text-xs">
                        {exp.bullets.map((b, i) => (
                          <li key={i} className="leading-relaxed">
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {resume.education.length > 0 && (
              <div>
                <h2
                  className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${
                    template === "executive"
                      ? "font-serif border-b border-[#E8E6E0] pb-0.5 text-[#20211F]"
                      : "text-[#52664F]"
                  }`}
                >
                  Education
                </h2>
                <div className="space-y-2">
                  {resume.education.map((edu) => (
                    <div key={edu.id} className="text-xs flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-[#20211F]">
                          {edu.degree} in {edu.field}
                        </span>{" "}
                        <span className="text-[#777872]">• {edu.school}</span>
                      </div>
                      <span className="font-mono-tech text-[11px] text-[#777872]">
                        {edu.graduationYear}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Skills */}
            <div>
              <h2
                className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${
                  template === "executive"
                    ? "font-serif border-b border-[#E8E6E0] pb-0.5 text-[#20211F]"
                    : "text-[#52664F]"
                }`}
              >
                Skills & Technical Competencies
              </h2>
              <div className="text-xs space-y-1">
                {Object.entries(resume.skills).map(([cat, list]) => (
                  <div key={cat}>
                    <span className="font-semibold text-[#20211F] capitalize">
                      {cat.replace(/([A-Z])/g, " $1")}:{" "}
                    </span>
                    <span className="text-[#555650]">{list.join(", ")}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
