"use client";

import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "neutral" | "accent" | "success" | "warning" | "danger";
  size?: "sm" | "md";
  className?: string;
}

export function Badge({
  children,
  variant = "neutral",
  size = "md",
  className = "",
}: BadgeProps) {
  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-[10px] leading-tight",
    md: "px-2 py-0.5 text-[11px] leading-snug",
  }[size];

  const variantClasses = {
    neutral: "bg-[#F5F4EF] text-[#555650] border border-[#E8E6E0]",
    accent: "bg-[#EDF1EC] text-[#2D3A2B] border border-[#C5D4C3]",
    success: "bg-[#F0F6F2] text-[#285735] border border-[#C1DEC9]",
    warning: "bg-[#FEF7EE] text-[#9A5611] border border-[#F5DAC0]",
    danger: "bg-[#FDF2F1] text-[#9E2B23] border border-[#F5C7C3]",
  }[variant];

  return (
    <span
      className={`inline-flex items-center font-mono-tech uppercase font-medium rounded-[3px] ${sizeClasses} ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
}
