"use client";

import React from "react";
import { Cloud, Cpu, Activity, ShieldCheck, Search, Play, Sparkles } from "lucide-react";

interface NavbarProps {
  onOpenCommandPalette: () => void;
  onLaunchDemo: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Navbar({ onOpenCommandPalette, onLaunchDemo, activeTab, setActiveTab }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#070b14]/90 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand identity */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("overview")}>
          <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(0,210,255,0.2)]">
            <Cloud className="h-5 w-5" />
            <div className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#070b14] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white text-base sm:text-lg">RESUMEX<span className="text-cyan-400">-CLOUD</span></span>
              <span className="hidden sm:inline-block rounded border border-cyan-500/30 bg-cyan-950/40 px-1.5 py-0.5 text-[10px] font-mono text-cyan-300 font-medium">
                v1.0 CLOUD-NATIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Scan. Match. Optimize.</p>
          </div>
        </div>

        {/* System telemetry pills */}
        <div className="hidden lg:flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-xs text-slate-300 font-mono-tech">
            <Cpu className="h-3.5 w-3.5 text-cyan-400" />
            <span>NLP: DETERMINISTIC + HYBRID</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-xs text-slate-300 font-mono-tech">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>SOC2 AIR-GAP: SAFE</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-xs text-slate-300 font-mono-tech">
            <Activity className="h-3.5 w-3.5 text-sky-400 animate-pulse" />
            <span>PIPELINE: ACTIVE</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Command Palette Trigger */}
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-400 hover:border-slate-700 hover:text-slate-200 transition"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Command Palette</span>
            <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">Ctrl+K</kbd>
          </button>

          {/* Quick Demo Mode CTA */}
          <button
            onClick={onLaunchDemo}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-[0_0_15px_rgba(0,210,255,0.25)] hover:from-cyan-400 hover:to-blue-500 transition"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Live Demo</span>
          </button>
        </div>
      </div>
    </header>
  );
}
