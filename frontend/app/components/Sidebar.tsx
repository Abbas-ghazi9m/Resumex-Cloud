"use client";

import React from "react";
import {
  LayoutDashboard,
  FileScan,
  Sparkles,
  Files,
  Briefcase,
  Layers,
  Users,
  FileText,
  Activity,
  Presentation,
  Terminal,
  Settings
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  hasLatestAnalysis: boolean;
}

export function Sidebar({ activeTab, setActiveTab, hasLatestAnalysis }: SidebarProps) {
  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "analyze", label: "Analyze Resume", icon: FileScan, badge: "CORE" },
    { 
      id: "results", 
      label: "ATS Intelligence", 
      icon: Sparkles, 
      highlight: hasLatestAnalysis,
      badge: hasLatestAnalysis ? "READY" : undefined 
    },
    { id: "resumes", label: "My Resumes", icon: Files },
    { id: "jobs", label: "Job Matches", icon: Briefcase },
    { id: "skills", label: "Skill Intelligence", icon: Layers },
    { id: "recruiter", label: "Recruiter Mode", icon: Users, badge: "HR" },
    { id: "reports", label: "Reports & Audit", icon: FileText },
    { id: "cloud", label: "Cloud Activity", icon: Activity, badge: "LOGS" },
    { id: "demo", label: "Presentation Demo", icon: Presentation, badge: "10-STEP" },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-slate-800 bg-[#090d16] p-4 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        {/* Navigation Group */}
        <div>
          <div className="px-3 mb-2 flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-medium">Platform Console</span>
            <span className="text-[10px] font-mono text-cyan-400/80">AWS / S3</span>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition ${
                    isActive
                      ? "bg-cyan-950/40 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(0,210,255,0.1)]"
                      : "text-slate-400 hover:bg-slate-900/80 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 ${isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                      isActive 
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                        : "bg-slate-800 text-slate-400"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Security / System Health Badge */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-medium mb-1">
            <Terminal className="h-3.5 w-3.5 text-cyan-400" />
            <span>Cloud Ingestion Node</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Worker queue initialized. PyMuPDF text stream extractor online.
          </p>
          <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              100% AIR-GAPPED
            </span>
            <span className="text-cyan-400">2026-PROD</span>
          </div>
        </div>
      </div>

      {/* User Session Profile Card */}
      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center text-xs font-bold text-white border border-cyan-400/30">
            AV
          </div>
          <div>
            <div className="text-xs font-medium text-slate-200">Alexander Vance</div>
            <div className="text-[10px] font-mono text-cyan-400">Sr. Cloud Architect</div>
          </div>
        </div>
        <button className="text-slate-500 hover:text-slate-300 transition">
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
