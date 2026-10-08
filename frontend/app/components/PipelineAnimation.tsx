"use client";

import React, { useEffect, useState } from "react";
import { FileUp, Database, Cpu, CheckCircle2, ArrowRight, Shield, Zap } from "lucide-react";

interface PipelineAnimationProps {
  currentStage?: "idle" | "upload" | "storage" | "nlp" | "ats" | "complete";
}

export function PipelineAnimation({ currentStage = "complete" }: PipelineAnimationProps) {
  const [activeStep, setActiveStep] = useState(4);

  const steps = [
    { id: 0, label: "DOCUMENT INGESTION", sub: "PyMuPDF / DOCX Stream", icon: FileUp },
    { id: 1, label: "CLOUD STORAGE", sub: "AES-256 S3 Object Vault", icon: Database },
    { id: 2, label: "NLP EXTRACTION", sub: "Entity & Section Detection", icon: Cpu },
    { id: 3, label: "ATS ENGINE", sub: "Semantic Weight Vectorization", icon: Zap },
    { id: 4, label: "EXPLAINABLE AUDIT", sub: "Gap Analysis & 87% Score", icon: CheckCircle2 },
  ];

  useEffect(() => {
    if (currentStage === "complete") {
      setActiveStep(4);
      return;
    }
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [currentStage, steps.length]);

  return (
    <div className="w-full rounded-2xl border border-cyan-500/30 bg-[#090e1c]/90 p-5 backdrop-blur-xl shadow-[0_0_40px_rgba(0,210,255,0.06)] relative overflow-hidden">
      {/* Laser scan line overlay */}
      <div className="scanline-effect pointer-events-none opacity-40" />

      <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs font-mono font-semibold tracking-wider text-cyan-400 uppercase">
            CLOUD DOCUMENT PROCESSING PIPELINE
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
          <span className="rounded bg-slate-800/80 px-2 py-0.5 border border-slate-700">STATUS: REAL-TIME ASYNC</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 relative">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isDone = activeStep >= idx;
          const isCurrent = activeStep === idx;

          return (
            <div
              key={step.id}
              className={`relative rounded-xl border p-3 transition-all duration-500 ${
                isCurrent
                  ? "border-cyan-400 bg-cyan-950/40 shadow-[0_0_20px_rgba(0,210,255,0.25)] scale-[1.02]"
                  : isDone
                  ? "border-slate-800 bg-slate-900/60 text-slate-300"
                  : "border-slate-900 bg-slate-950/40 text-slate-600 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-1.5 rounded-lg ${
                  isCurrent 
                    ? "bg-cyan-500 text-slate-950" 
                    : isDone 
                    ? "bg-slate-800 text-cyan-400" 
                    : "bg-slate-900 text-slate-600"
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-500">0{idx + 1}</span>
              </div>
              <div className="text-[11px] font-bold tracking-tight text-white line-clamp-1">{step.label}</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5 line-clamp-1">{step.sub}</div>

              {idx < steps.length - 1 && (
                <div className="hidden sm:block absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 text-slate-600">
                  <ArrowRight className="h-3 w-3" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
