"use client";

import React, { useEffect, useState } from "react";
import { Search, X, FileScan, Files, Briefcase, Users, FileText, Activity, Sparkles, LayoutDashboard } from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (tabId: string) => void;
}

export function CommandPalette({ isOpen, onClose, onSelectAction }: CommandPaletteProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else onSelectAction("open_palette");
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onSelectAction]);

  if (!isOpen) return null;

  const commands = [
    { id: "analyze", label: "Analyze Resume", icon: FileScan, description: "Upload PDF/DOCX and run ATS matching against JD" },
    { id: "overview", label: "System Overview", icon: LayoutDashboard, description: "View ATS dashboard, metrics, and throughput" },
    { id: "demo", label: "Launch Live Demo", icon: Sparkles, description: "Instant 10-step end-to-end presentation demo" },
    { id: "resumes", label: "My Resumes", icon: Files, description: "Access encrypted resume vault and parsed sections" },
    { id: "jobs", label: "Job Matches", icon: Briefcase, description: "Target roles and extracted mandatory skills" },
    { id: "recruiter", label: "Recruiter Intelligence", icon: Users, description: "Candidate batch ranking and meritocracy evaluation" },
    { id: "reports", label: "Audit Reports", icon: FileText, description: "Download ATS executive PDF reports and share tokens" },
    { id: "cloud", label: "Cloud Observability", icon: Activity, description: "Monitor telemetry, ingestion latency, and cloud events" },
  ];

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.description.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl border border-cyan-500/40 bg-[#0a0f1d] shadow-[0_0_50px_rgba(0,210,255,0.15)] overflow-hidden">
        {/* Search header */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800">
          <Search className="h-4 w-4 text-cyan-400 mr-3 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or jump to view..."
            autoFocus
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Command list */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">No matching commands found.</div>
          ) : (
            filtered.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  onClick={() => {
                    onSelectAction(cmd.id);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs hover:bg-slate-900/90 hover:border-slate-800 border border-transparent transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 group-hover:bg-cyan-950/40 group-hover:border-cyan-500/30">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-200 group-hover:text-cyan-300">{cmd.label}</div>
                      <div className="text-[11px] text-slate-500">{cmd.description}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-600 group-hover:text-slate-400">SELECT</span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Navigation Shortcuts</span>
          <span>[ESC] to dismiss</span>
        </div>
      </div>
    </div>
  );
}
