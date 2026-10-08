"use client";

import React, { useState } from "react";
import { AnalysisData } from "../types";
import { ScoreGauge } from "./ScoreGauge";
import { generateReport, askAssistant, requestRewrite } from "../api";
import {
  CheckCircle2, AlertTriangle, AlertCircle, Sparkles, Download, 
  Share2, ArrowRight, MessageSquare, RefreshCw, Layers, ShieldCheck,
  Check, FileText, Bot, HelpCircle
} from "lucide-react";

interface AnalysisResultsViewProps {
  data: AnalysisData;
}

export function AnalysisResultsView({ data }: AnalysisResultsViewProps) {
  const [activeTab, setActiveTab] = useState<"breakdown" | "keywords" | "gaps" | "bullets" | "ats_risks" | "roadmap" | "assistant" | "rewrite">("breakdown");
  const [downloading, setDownloading] = useState(false);
  const [reportDownloadUrl, setReportDownloadUrl] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  // Assistant State
  const [userQuery, setUserQuery] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string; actions?: string[] }>>([
    {
      sender: "ai",
      text: `Hello! I am your ATS Intelligence Assistant. I've audited your resume for '${data.job_title}'. Your overall score is ${data.overall_score}%. How can I assist you with your gaps or phrasing?`,
      actions: ["Why is my score low?", "What skills am I missing?", "Which section should I fix first?", "What does the recruiter care about?"]
    }
  ]);
  const [isQuerying, setIsQuerying] = useState(false);

  // Rewrite state
  const [rewriteSection, setRewriteSection] = useState("summary");
  const [rewriteContent, setRewriteContent] = useState(
    "Senior software developer with 4+ years of experience working on web applications and microservices. Handled backend systems."
  );
  const [rewriteResult, setRewriteResult] = useState<any | null>(null);
  const [isRewriting, setIsRewriting] = useState(false);

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      const res = await generateReport(data.id);
      setReportDownloadUrl(`http://127.0.0.1:8000${res.download_url}`);
      setShareUrl(res.share_url);
      window.open(`http://127.0.0.1:8000${res.download_url}`, "_blank");
    } catch (e) {
      alert("Failed to compile PDF report. Ensure backend is running.");
    } finally {
      setDownloading(false);
    }
  };

  const handleAsk = async (question: string) => {
    if (!question.trim()) return;
    const q = question.trim();
    setChatMessages((prev) => [...prev, { sender: "user", text: q }]);
    setUserQuery("");
    setIsQuerying(true);
    try {
      const res = await askAssistant(data.id, q);
      setChatMessages((prev) => [...prev, { sender: "ai", text: res.answer, actions: res.suggested_actions }]);
    } catch (e) {
      setChatMessages((prev) => [...prev, { sender: "ai", text: "Unable to query assistant at this moment. Deterministic analysis remains available in the Breakdown tab." }]);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleTriggerRewrite = async () => {
    setIsRewriting(true);
    try {
      const res = await requestRewrite(data.id, rewriteSection, rewriteContent);
      setRewriteResult(res);
    } catch (e) {
      alert("Failed to compute section suggestion.");
    } finally {
      setIsRewriting(false);
    }
  };

  const b = data.breakdown;

  const scoreDimensions = [
    { key: "keyword_match", label: "Keyword Match", weight: "30%", item: b.keyword_match },
    { key: "skills_match", label: "Skills Match", weight: "20%", item: b.skills_match },
    { key: "experience_relevance", label: "Experience Relevance", weight: "15%", item: b.experience_relevance },
    { key: "education_match", label: "Education Match", weight: "10%", item: b.education_match },
    { key: "job_title_alignment", label: "Job Title Alignment", weight: "10%", item: b.job_title_alignment },
    { key: "resume_structure", label: "Resume Structure", weight: "10%", item: b.resume_structure },
    { key: "ats_formatting", label: "ATS Formatting", weight: "5%", item: b.ats_formatting },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Intelligence Banner */}
      <div className="rounded-2xl border border-slate-800 bg-[#0a0f1d] p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl text-center lg:text-left">
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
              <span className="rounded-md border border-cyan-500/40 bg-cyan-950/40 px-2 py-0.5 text-xs font-mono font-medium text-cyan-300">
                AUDIT COMPLETE
              </span>
              <span className="text-xs font-mono text-slate-400">
                PROCESSED IN {data.processing_duration_ms}ms
              </span>
              {data.is_demo && (
                <span className="rounded-md bg-amber-950/40 border border-amber-500/40 px-2 py-0.5 text-xs font-mono text-amber-300">
                  DEMO ANALYSIS
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {data.job_title}
            </h1>
            <p className="text-sm text-slate-400">
              Target Organization: <span className="text-slate-200 font-medium">{data.company || "Target Enterprise"}</span> &nbsp;|&nbsp;
              Candidate: <span className="text-slate-200 font-medium">{data.candidate_name || "Applicant"}</span>
            </p>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
              <span className="font-semibold text-cyan-400">Executive Summary: </span>
              {data.executive_summary}
            </div>
          </div>

          {/* Overall Match Ring */}
          <div className="flex flex-col items-center">
            <ScoreGauge score={data.overall_score} size={160} />
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={handleDownloadPdf}
                disabled={downloading}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-medium text-white shadow-lg hover:from-cyan-400 hover:to-blue-500 transition disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                <span>{downloading ? "Compiling..." : "Download ATS Report"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 text-xs">
        {[
          { id: "breakdown", label: "Score Breakdown (70/100)", count: "7 Factors" },
          { id: "keywords", label: "Matched Keywords", count: `${data.matched_keywords.length}` },
          { id: "gaps", label: "Critical Skill Gaps", count: `${data.missing_keywords.length}` },
          { id: "bullets", label: "Bullet Point Impact", count: `${data.bullet_analysis.length}` },
          { id: "ats_risks", label: "ATS Formatting Risks", count: `${data.formatting_risks.length}` },
          { id: "roadmap", label: "Optimization Roadmap", count: `${data.recommendations.length}` },
          { id: "assistant", label: "AI Career Assistant", count: "Interactive" },
          { id: "rewrite", label: "Before / After Rewriter", count: "Live" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap font-medium transition ${
              activeTab === tab.id
                ? "bg-cyan-950/50 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(0,210,255,0.1)]"
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            }`}
          >
            <span>{tab.label}</span>
            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab 1: Transparent 7-Dimension Score Breakdown */}
      {activeTab === "breakdown" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-300">
              TRANSPARENT ATS SCORING WEIGHTS & FACTORS
            </h3>
            <span className="text-xs text-slate-500 font-mono">100% EXPLAINABLE — NO BLACK BOX</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scoreDimensions.map((dim) => {
              const score = dim.item?.score || 0;
              const isHigh = score >= 80;
              const isMid = score >= 60;

              return (
                <div
                  key={dim.key}
                  className="rounded-xl border border-slate-800/90 bg-[#090e1c] p-4 flex flex-col justify-between hover:border-slate-700 transition"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white">{dim.label}</span>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                        WEIGHT: {dim.weight}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2 mb-2">
                      <span className={`text-2xl font-mono font-extrabold ${isHigh ? "text-emerald-400" : isMid ? "text-cyan-400" : "text-amber-400"}`}>
                        {Math.round(score)}%
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        ({dim.item?.weighted_score || 0} pts)
                      </span>
                    </div>

                    {/* Mini progress bar */}
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mb-3">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isHigh ? "bg-emerald-400" : isMid ? "bg-cyan-400" : "bg-amber-400"
                        }`}
                        style={{ width: `${Math.min(100, score)}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {dim.item?.explanation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Matched Keywords */}
      {activeTab === "keywords" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-300">
              MATCHED TECHNICAL & DOMAIN KEYWORDS ({data.matched_keywords.length})
            </h3>
            <span className="text-xs text-slate-500 font-mono">CONFIDENCE THRESHOLD &gt;= 80%</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.matched_keywords.map((kw, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-800 bg-[#090e1c] p-3.5 flex items-start justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{kw.keyword}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/50 border border-emerald-500/40 text-emerald-400">
                      {kw.match_type}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">{kw.category}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-2">
                    Resume: {kw.resume_occurrences}x &nbsp;|&nbsp; JD: {kw.job_occurrences}x
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {Math.round(kw.confidence * 100)}%
                  </span>
                  <div className="text-[9px] text-slate-500 font-mono uppercase mt-1">
                    {kw.suggested_section || "Verified"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Critical Skill Gaps */}
      {activeTab === "gaps" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-300">
              SKILL GAPS & DEFICITS DETECTED ({data.missing_keywords.length})
            </h3>
            <span className="text-xs text-amber-400 font-mono">AVOID FABRICATION — ADD ONLY IF EXPERIENCED</span>
          </div>

          <div className="space-y-2.5">
            {data.missing_keywords.map((item, idx) => {
              const isCrit = item.importance === "Critical";
              return (
                <div
                  key={idx}
                  className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isCrit 
                      ? "border-rose-900/60 bg-rose-950/20" 
                      : "border-slate-800 bg-[#090e1c]"
                  }`}
                >
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{item.keyword}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        isCrit ? "bg-rose-900/60 text-rose-300 border border-rose-700" : "bg-slate-800 text-slate-400"
                      }`}>
                        {item.importance}
                      </span>
                      <span className="text-[11px] text-slate-500">({item.category})</span>
                    </div>
                    <p className="text-xs text-slate-300">{item.recommendation}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-[10px] font-mono text-slate-500">JD OCCURRENCES</div>
                      <div className="text-xs font-mono font-bold text-white">{item.job_occurrences} mentions</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-mono text-slate-500">TARGET SECTION</div>
                      <div className="text-xs font-mono text-cyan-400">{item.suggested_section}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Bullet Point Impact Analyzer */}
      {activeTab === "bullets" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-300">
              BULLET POINT IMPACT AUDITOR ({data.bullet_analysis.length} ASSESSED)
            </h3>
            <span className="text-xs text-slate-500 font-mono">GOOGLE XYZ IMPACT METRICS</span>
          </div>

          <div className="space-y-3">
            {data.bullet_analysis.map((bullet, idx) => (
              <div key={idx} className="rounded-xl border border-slate-800 bg-[#090e1c] p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-amber-400 uppercase font-semibold">
                      ISSUE: {bullet.issue}
                    </span>
                    <p className="text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 font-mono">
                      &quot;{bullet.original_bullet}&quot;
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3" />
                    RECOMMENDED HIGH-IMPACT REFORMULATION:
                  </span>
                  <p className="text-xs text-cyan-200 bg-cyan-950/30 p-2.5 rounded-lg border border-cyan-500/30 font-medium">
                    {bullet.suggested_bullet}
                  </p>
                </div>

                <div className="text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300">Impact Analysis: </span>
                  {bullet.impact}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: ATS Formatting Risks */}
      {activeTab === "ats_risks" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-300">
              ATS PARSER COMPATIBILITY & STRUCTURAL RISKS
            </h3>
            <span className="text-xs text-slate-500 font-mono">WORKDAY / TALEO / LEVER COMPLIANCE</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.formatting_risks.map((risk, idx) => {
              const isRisk = risk.severity === "RISK";
              const isWarn = risk.severity === "WARNING";
              const Icon = isRisk ? AlertCircle : isWarn ? AlertTriangle : CheckCircle2;
              const color = isRisk ? "text-rose-400 border-rose-900/60 bg-rose-950/20" : isWarn ? "text-amber-400 border-amber-900/60 bg-amber-950/20" : "text-emerald-400 border-emerald-900/60 bg-emerald-950/20";

              return (
                <div key={idx} className={`rounded-xl border p-4 space-y-2 ${color}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="text-xs font-bold text-white">{risk.title}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase">{risk.severity}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{risk.description}</p>
                  <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
                    <span className="font-semibold text-slate-300">Action: </span>
                    {risk.recommendation}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 6: Optimization Roadmap */}
      {activeTab === "roadmap" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-300">
              PRIORITIZED ACTIONABLE OPTIMIZATION ROADMAP
            </h3>
            <span className="text-xs text-cyan-400 font-mono">SORTED BY ESTIMATED SCORE GAIN</span>
          </div>

          <div className="space-y-3">
            {data.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-800 bg-[#090e1c] p-4 space-y-2 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/30">
                      {rec.priority_label}
                    </span>
                    <span className="text-sm font-bold text-white">{rec.title}</span>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-bold">{rec.expected_impact}</span>
                </div>

                <div className="text-xs text-slate-300">
                  <span className="text-slate-400 font-medium">Problem: </span> {rec.problem}
                </div>
                <div className="text-xs text-slate-300">
                  <span className="text-slate-400 font-medium">Reason: </span> {rec.reason}
                </div>
                <div className="text-xs text-cyan-300 bg-cyan-950/20 p-2.5 rounded-lg border border-cyan-900/40 font-medium">
                  <span className="font-bold text-cyan-400">Action: </span> {rec.suggested_action}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 7: AI Career Assistant */}
      {activeTab === "assistant" && (
        <div className="rounded-xl border border-slate-800 bg-[#090e1c] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-bold text-white">RESUMEX INTELLIGENCE CONVERSATION</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">GROUNDED STRICTLY ON ANALYSIS RECORD</span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl text-xs leading-relaxed max-w-2xl ${
                  msg.sender === "user"
                    ? "ml-auto bg-cyan-950/60 border border-cyan-500/30 text-cyan-200"
                    : "bg-slate-900/80 border border-slate-800 text-slate-200"
                }`}
              >
                <div className="font-mono text-[10px] text-slate-500 uppercase mb-1">
                  {msg.sender === "user" ? "YOU" : "RESUMEX ASSISTANT"}
                </div>
                <div>{msg.text}</div>
                {msg.actions && (
                  <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/80">
                    {msg.actions.map((act, i) => (
                      <button
                        key={i}
                        onClick={() => handleAsk(act)}
                        className="rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] text-cyan-300 hover:bg-slate-700 transition"
                      >
                        {act}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isQuerying && (
              <div className="p-3 rounded-xl bg-slate-900 text-xs text-slate-400 animate-pulse">
                Auditing candidate vector representations...
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
            <input
              type="text"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk(userQuery)}
              placeholder="Ask why a score was awarded or how to address gaps..."
              className="flex-1 rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={() => handleAsk(userQuery)}
              disabled={isQuerying || !userQuery.trim()}
              className="rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition disabled:opacity-50"
            >
              Ask
            </button>
          </div>
        </div>
      )}

      {/* Tab 8: Before / After Section Rewriter */}
      {activeTab === "rewrite" && (
        <div className="rounded-xl border border-slate-800 bg-[#090e1c] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-xs font-bold text-white uppercase font-mono">BEFORE / AFTER SECTION OPTIMIZATION</h3>
              <p className="text-[11px] text-slate-400">Infuse target job keywords into existing statements without fabricating facts.</p>
            </div>
            <select
              value={rewriteSection}
              onChange={(e) => setRewriteSection(e.target.value)}
              className="rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1.5 text-xs text-slate-200"
            >
              <option value="summary">Summary Section</option>
              <option value="experience">Experience Bullets</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-mono text-slate-400 uppercase font-semibold">BEFORE (CURRENT VERSION)</label>
              <textarea
                value={rewriteContent}
                onChange={(e) => setRewriteContent(e.target.value)}
                rows={5}
                className="w-full rounded-xl bg-slate-900/80 border border-slate-800 p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleTriggerRewrite}
                disabled={isRewriting}
                className="w-full rounded-xl bg-cyan-500/20 border border-cyan-500/40 px-4 py-2 text-xs font-medium text-cyan-300 hover:bg-cyan-500/30 transition disabled:opacity-50"
              >
                {isRewriting ? "Optimizing Phrasing..." : "Generate AI Reformulation"}
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-mono text-emerald-400 uppercase font-semibold flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                AFTER (ATS OPTIMIZED PROPOSAL)
              </label>
              <div className="h-36 rounded-xl bg-emerald-950/20 border border-emerald-900/60 p-3 text-xs text-emerald-200 font-mono overflow-y-auto">
                {rewriteResult ? rewriteResult.after : "Click 'Generate AI Reformulation' to preview enhanced version."}
              </div>
              <p className="text-[10px] text-slate-500 italic">
                AI suggestion — verify accuracy before using. Do not claim technologies you lack hands-on experience with.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
