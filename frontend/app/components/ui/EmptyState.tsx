"use client";

import React from "react";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-[4px] border border-dashed border-[#D9D7CE] bg-[#FAF9F6] p-8 text-center flex flex-col items-center justify-center max-w-md mx-auto ${className}`}
    >
      {icon && (
        <div className="h-10 w-10 rounded-[4px] bg-[#F0EEE7] border border-[#E8E6E0] flex items-center justify-center text-[#52664F] mb-3.5">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-[#20211F]">{title}</h3>
      <p className="text-xs text-[#777872] mt-1.5 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-4">
          <Button size="sm" variant="outline" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
