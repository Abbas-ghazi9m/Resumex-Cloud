"use client";

import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: "default" | "subtle" | "flat";
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({
  children,
  header,
  footer,
  variant = "default",
  padding = "md",
  className = "",
  ...props
}: CardProps) {
  const variantClasses = {
    default: "bg-[#FFFFFF] border border-[#E8E6E0] shadow-[0_1px_2px_rgba(0,0,0,0.03)]",
    subtle: "bg-[#FBFBFA] border border-[#E8E6E0]",
    flat: "bg-transparent border border-[#E8E6E0]",
  }[variant];

  const paddingClasses = {
    none: "",
    sm: "p-3",
    md: "p-5",
    lg: "p-6 sm:p-7",
  }[padding];

  return (
    <div
      className={`rounded-[4px] text-[#20211F] transition-all ${variantClasses} ${className}`}
      {...props}
    >
      {header && (
        <div className="px-5 py-3.5 border-b border-[#E8E6E0] flex items-center justify-between">
          {header}
        </div>
      )}
      <div className={paddingClasses}>{children}</div>
      {footer && (
        <div className="px-5 py-3 border-t border-[#E8E6E0] bg-[#FAF9F6] rounded-b-[4px] flex items-center justify-between">
          {footer}
        </div>
      )}
    </div>
  );
}
