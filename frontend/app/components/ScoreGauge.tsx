"use client";

import React from "react";

interface ScoreGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showGrade?: boolean;
}

export function ScoreGauge({ score, size = 180, strokeWidth = 12, showGrade = true }: ScoreGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeScore = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;

  let color = "#00d2ff"; // Cyan default
  let grade = "STRONG CONTENDER";
  let gradeColor = "text-cyan-400";

  if (safeScore >= 85) {
    color = "#10b981"; // Emerald
    grade = "EXCEPTIONAL MATCH";
    gradeColor = "text-emerald-400";
  } else if (safeScore >= 70) {
    color = "#00d2ff"; // Cyan / Blue
    grade = "STRONG CONTENDER";
    gradeColor = "text-cyan-400";
  } else if (safeScore >= 55) {
    color = "#f59e0b"; // Amber
    grade = "MODERATE ALIGNMENT";
    gradeColor = "text-amber-400";
  } else {
    color = "#f43f5e"; // Rose
    grade = "SIGNIFICANT GAPS";
    gradeColor = "text-rose-400";
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Background track circle */}
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated score indicator */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
            style={{
              filter: `drop-shadow(0 0 10px ${color}80)`,
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-extrabold tracking-tight text-white font-mono">
            {Math.round(safeScore)}
            <span className="text-xl text-slate-400 font-normal">%</span>
          </span>
          <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase mt-0.5">
            ATS MATCH
          </span>
        </div>
      </div>

      {showGrade && (
        <div className="mt-3 flex flex-col items-center">
          <span className={`text-xs font-mono font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border border-slate-800 bg-slate-900/80 ${gradeColor}`}>
            {grade}
          </span>
          <span className="text-[11px] text-slate-400 mt-1">
            Exceeds {Math.round(safeScore * 0.95)}% of applicants in pool
          </span>
        </div>
      )}
    </div>
  );
}
