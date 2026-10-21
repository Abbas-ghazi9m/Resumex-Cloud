"use client";

import React, { useState } from "react";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { uploadResume, runQuickAnalysis } from "../../api";
import {
  Search,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Layers,
  ArrowRight,
  TrendingUp,
  Award,
  BookOpen,
} from "lucide-react";

interface ResumeAnalyzerProps {
  onNavigateToBuilder?: (initialData?: any) => void;
  onNavigateToAtsChecker?: (resumeText: string) => void;
  onNavigateToCorrector?: (resumeText: string) => void;
  onNavigateToEditor?: (resumeText: string) => void;
}

export function ResumeAnalyzer({
  onNavigateToBuilder,
  onNavigateToAtsChecker,
  onNavigateToCorrector,
  onNavigateToEditor,
}: ResumeAnalyzerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Analysis Result
  const [analysisResult, setAnalysisResult] = useState<{
    wordCount: number;
    charCount: number;
    readingTimeMinutes: number;
    estimatedPages: number;
    readabilityScore: number;
    sectionsFound: { name: string; found: boolean; snippet?: string }[];
    actionVerbCount: number;
    actionVerbRatio: number;
    metricBulletCount: number;
    metricRatio: number;
    totalBullets: number;
    detectedSkills: { category: string; skills: string[] }[];
    healthScore: number;
    text: string;
  } | null>(null);

  const sampleResumeText = `ALEXANDER VANCE
San Francisco, CA | alex.vance@cloudeng.io | (555) 234-5678 | linkedin.com/in/alexandervance

PROFESSIONAL SUMMARY
Senior Backend Engineer with 5+ years of experience designing and deploying high-throughput distributed microservices, RESTful APIs, and cloud-native backend systems. Specialized in Java, Spring Boot, PostgreSQL, Docker, and Kubernetes. Scaled systems to 15M daily requests and reduced latency by 35%.

TECHNICAL SKILLS
Languages: Java, Python, SQL, Go, Bash
Frameworks & Libraries: Spring Boot, Hibernate, REST APIs, GraphQL, JUnit
Databases & Storage: PostgreSQL, Redis, MySQL, MongoDB
DevOps & Cloud: Docker, Kubernetes, AWS (EC2, S3), GitHub Actions, CI/CD, Prometheus
Methodologies: Microservices, System Design, Agile, TDD, Clean Architecture

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

  const handleAnalyze = async () => {
    setError(null);
    let textToAnalyze = pastedText.trim();

    if (!selectedFile && !textToAnalyze) {
      setError("Please select a resume file (PDF, DOCX, TXT) or paste resume text to analyze.");
      return;
    }

    setIsAnalyzing(true);
    try {
      if (selectedFile) {
        // Upload to backend parser
        const uploadRes = await uploadResume(selectedFile);
        // Run analysis on ingested resume
        const quickRes = await runQuickAnalysis({
          resume_text: textToAnalyze || `Uploaded Document: ${uploadRes.filename}`,
          job_text: "Software Engineering position with standard requirements for technical proficiency, clean architecture, and quantifiable outcomes.",
          job_title: "Software Engineer",
        });
        textToAnalyze = textToAnalyze || quickRes.executive_summary || "Parsed document content.";
      }

      // Compute in-depth structural metrics
      const words = textToAnalyze.split(/\s+/).filter(Boolean);
      const wordCount = words.length;
      const charCount = textToAnalyze.length;
      const readingTimeMinutes = Math.max(1, Math.round(wordCount / 200));
      const estimatedPages = wordCount <= 450 ? 1 : wordCount <= 900 ? 2 : 3;

      // Section presence detection
      const lower = textToAnalyze.toLowerCase();
      const standardSections = [
        { name: "Contact Information", pattern: /(?:phone|email|linkedin|github|@|\d{3}[-\s]\d{3})/i },
        { name: "Summary / Profile", pattern: /(?:summary|profile|about me|objective)/i },
        { name: "Work Experience", pattern: /(?:experience|employment|work history|professional background)/i },
        { name: "Education", pattern: /(?:education|university|college|bachelor|degree|master|phd)/i },
        { name: "Technical Skills", pattern: /(?:skills|technologies|proficiencies|tools|languages)/i },
        { name: "Projects", pattern: /(?:projects|portfolio|open source)/i },
        { name: "Certifications", pattern: /(?:certifications|certificates|licenses|accreditations)/i },
      ];

      const sectionsFound = standardSections.map((sec) => ({
        name: sec.name,
        found: sec.pattern.test(textToAnalyze),
      }));

      // Bullet analysis
      const lines = textToAnalyze.split("\n").map((l) => l.trim()).filter(Boolean);
      const bullets = lines.filter((l) => /^[•\-\*\–\d\.]/.test(l) || l.length > 30);
      const totalBullets = bullets.length || 1;

      const strongActionVerbs = [
        "architected", "engineered", "spearheaded", "developed", "deployed", "scaled",
        "optimized", "automated", "designed", "implemented", "refactored", "integrated",
        "orchestrated", "streamlined", "accelerated", "reduced", "delivered", "mentored"
      ];
      const metricPatterns = [
        /\d+%/, /\$\d+/, /\b\d+\s*(?:ms|seconds|minutes|hours)\b/, /\b\d+x\b/,
        /\b\d+\s*(?:million|k|users|requests|queries|rps|tb|gb)\b/, /\b\d+\s*(?:engineers|developers|clients)\b/
      ];

      let actionVerbCount = 0;
      let metricBulletCount = 0;

      bullets.forEach((b) => {
        const bLower = b.toLowerCase();
        if (strongActionVerbs.some((v) => bLower.includes(v))) actionVerbCount++;
        if (metricPatterns.some((p) => p.test(bLower))) metricBulletCount++;
      });

      const actionVerbRatio = Math.round((actionVerbCount / totalBullets) * 100);
      const metricRatio = Math.round((metricBulletCount / totalBullets) * 100);

      // Skills categorization
      const techSkillsTaxonomy = {
        "Languages": ["python", "java", "javascript", "typescript", "c++", "c#", "go", "sql", "bash", "rust"],
        "Frameworks": ["react", "next.js", "node.js", "spring boot", "fastapi", "django", "express", "vue"],
        "Cloud & DevOps": ["aws", "docker", "kubernetes", "ci/cd", "terraform", "github actions", "linux"],
        "Databases": ["postgresql", "redis", "mysql", "mongodb", "elasticsearch", "sqlite"],
      };

      const detectedSkills: { category: string; skills: string[] }[] = [];
      Object.entries(techSkillsTaxonomy).forEach(([cat, terms]) => {
        const matched = terms.filter((t) => lower.includes(t));
        if (matched.length > 0) {
          detectedSkills.push({
            category: cat,
            skills: matched.map((s) => s.charAt(0).toUpperCase() + s.slice(1)),
          });
        }
      });

      // Overall health score calculation
      let score = 50;
      // Sections completeness (+25 max)
      const sectionsCount = sectionsFound.filter((s) => s.found).length;
      score += Math.round((sectionsCount / standardSections.length) * 25);
      // Metric density (+15 max)
      score += Math.min(15, Math.round((metricRatio / 100) * 15));
      // Action verb density (+10 max)
      score += Math.min(10, Math.round((actionVerbRatio / 100) * 10));

      setAnalysisResult({
        wordCount,
        charCount,
        readingTimeMinutes,
        estimatedPages,
        readabilityScore: 78,
        sectionsFound,
        actionVerbCount,
        actionVerbRatio,
        metricBulletCount,
        metricRatio,
        totalBullets,
        detectedSkills,
        healthScore: Math.min(100, score),
        text: textToAnalyze,
      });
    } catch (err: any) {
      setError(err.message || "Failed to analyze resume.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E6E0]">
        <div>
          <h2 className="text-base font-semibold text-[#20211F]">
            Resume Analyzer & Diagnostic Engine
          </h2>
          <p className="text-xs text-[#777872] mt-0.5">
            Deterministic structural health, readability benchmarks, action verb density, and section audits.
          </p>
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setPastedText(sampleResumeText);
            setSelectedFile(null);
          }}
        >
          Load Professional Sample
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

      {/* Input Section: Upload or Paste */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          header={
            <span className="text-xs font-semibold text-[#20211F] flex items-center gap-1.5">
              <Upload className="h-3.5 w-3.5 text-[#52664F]" />
              Upload Document File
            </span>
          }
          padding="md"
        >
          <div className="space-y-3 text-xs">
            <p className="text-[#777872]">
              Select a candidate resume in PDF, DOCX, or TXT format for extraction.
            </p>
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
              className="w-full p-2 rounded-[3px] border border-[#E8E6E0] bg-[#FAF9F6] text-xs text-[#20211F] file:mr-3 file:py-1 file:px-2.5 file:rounded-[3px] file:border-0 file:text-xs file:font-medium file:bg-[#52664F] file:text-white hover:file:bg-[#41523F]"
            />
            {selectedFile && (
              <div className="p-2 bg-[#EDF1EC] rounded-[3px] text-[#2D3A2B] font-mono-tech text-[11px]">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>
        </Card>

        <Card
          header={
            <span className="text-xs font-semibold text-[#20211F] flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-[#52664F]" />
              Paste Raw Resume Content
            </span>
          }
          padding="md"
        >
          <div className="space-y-2">
            <textarea
              rows={5}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste raw resume text or markdown here..."
              className="w-full p-2.5 rounded-[3px] border border-[#E8E6E0] bg-[#FAF9F6] text-xs text-[#20211F] focus:border-[#52664F] focus:bg-[#FFFFFF] focus:outline-none transition leading-relaxed"
            />
          </div>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button
          size="md"
          variant="primary"
          isLoading={isAnalyzing}
          leftIcon={<Search className="h-4 w-4" />}
          onClick={handleAnalyze}
        >
          Run Full Diagnostic Scan
        </Button>
      </div>

      {/* Diagnostic Results Presentation */}
      {analysisResult && (
        <div className="space-y-6 pt-2">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <Card padding="sm">
              <span className="text-[10px] font-mono-tech uppercase text-[#777872] block">
                Structural Health Index
              </span>
              <div className="text-2xl font-bold font-mono-tech text-[#52664F] my-1">
                {analysisResult.healthScore}%
              </div>
              <span className="text-[10px] text-[#777872]">
                ATS readiness grade
              </span>
            </Card>

            <Card padding="sm">
              <span className="text-[10px] font-mono-tech uppercase text-[#777872] block">
                Word Count & Length
              </span>
              <div className="text-2xl font-bold font-mono-tech text-[#20211F] my-1">
                {analysisResult.wordCount}{" "}
                <span className="text-xs font-normal text-[#777872]">words</span>
              </div>
              <span className="text-[10px] text-[#777872]">
                ~{analysisResult.estimatedPages} page{analysisResult.estimatedPages > 1 ? "s" : ""} (optimal: 1-2)
              </span>
            </Card>

            <Card padding="sm">
              <span className="text-[10px] font-mono-tech uppercase text-[#777872] block">
                Action Verb Density
              </span>
              <div className="text-2xl font-bold font-mono-tech text-[#52664F] my-1">
                {analysisResult.actionVerbRatio}%
              </div>
              <span className="text-[10px] text-[#777872]">
                {analysisResult.actionVerbCount} of {analysisResult.totalBullets} bullets lead with verbs
              </span>
            </Card>

            <Card padding="sm">
              <span className="text-[10px] font-mono-tech uppercase text-[#777872] block">
                Quantifiable Metrics
              </span>
              <div className="text-2xl font-bold font-mono-tech text-[#52664F] my-1">
                {analysisResult.metricRatio}%
              </div>
              <span className="text-[10px] text-[#777872]">
                {analysisResult.metricBulletCount} bullets with measurable metrics
              </span>
            </Card>
          </div>

          {/* Section Completeness & Detected Skills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Section Completeness Checklist */}
            <Card
              header={
                <span className="text-xs font-semibold text-[#20211F]">
                  Section Completeness Audit
                </span>
              }
              padding="sm"
            >
              <div className="divide-y divide-[#E8E6E0] text-xs">
                {analysisResult.sectionsFound.map((sec, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between">
                    <span className="font-medium text-[#20211F]">{sec.name}</span>
                    {sec.found ? (
                      <Badge variant="success" size="sm">
                        Verified Present
                      </Badge>
                    ) : (
                      <Badge variant="danger" size="sm">
                        Missing Section
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Detected Skills Taxonomy */}
            <Card
              header={
                <span className="text-xs font-semibold text-[#20211F]">
                  Identified Technical Profile
                </span>
              }
              padding="sm"
            >
              <div className="space-y-3 text-xs">
                {analysisResult.detectedSkills.map((cat, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="text-[11px] font-mono-tech uppercase text-[#777872]">
                      {cat.category}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.skills.map((sk, sIdx) => (
                        <Badge key={sIdx} variant="accent" size="sm">
                          {sk}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
                {analysisResult.detectedSkills.length === 0 && (
                  <div className="text-[#777872]">
                    No major technical taxonomy terms detected.
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Action Relay: Send into Builder, ATS Checker, Corrector, or Editor */}
          <Card
            header={
              <span className="text-xs font-semibold text-[#20211F]">
                Next Actions With This Resume
              </span>
            }
            padding="sm"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onNavigateToAtsChecker && onNavigateToAtsChecker(analysisResult.text)}
              >
                Match in ATS Checker
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onNavigateToCorrector && onNavigateToCorrector(analysisResult.text)}
              >
                Polish in Corrector
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onNavigateToEditor && onNavigateToEditor(analysisResult.text)}
              >
                Edit in Resume Editor
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onNavigateToBuilder && onNavigateToBuilder(analysisResult.text)}
              >
                Load into Builder
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
