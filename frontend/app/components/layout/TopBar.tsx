"use client";

import React from "react";
import { User } from "../../types";
import { ShieldCheck, Database, Menu } from "lucide-react";

interface TopBarProps {
  title: string;
  description?: string;
  currentUser: User | null;
  onOpenMobileMenu?: () => void;
  actions?: React.ReactNode;
}

export function TopBar({
  title,
  description,
  currentUser,
  onOpenMobileMenu,
  actions,
}: TopBarProps) {
  return (
    <header className="h-14 border-b border-[#E8E6E0] bg-[#FFFFFF] px-4 sm:px-6 flex items-center justify-between z-10 sticky top-0">
      <div className="flex items-center gap-3">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-1.5 rounded-[4px] text-[#777872] hover:bg-[#F0EEE7]"
            aria-label="Toggle menu"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}
        <div>
          <h1 className="text-sm font-semibold text-[#20211F] tracking-tight flex items-center gap-2">
            {title}
          </h1>
          {description && (
            <p className="text-[11px] text-[#777872] hidden sm:block">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Environment / System health telemetry */}
        <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono-tech text-[#777872]">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-[3px] bg-[#FAF9F6] border border-[#E8E6E0]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#52664F]" />
            AIR-GAPPED ENGINE
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-[3px] bg-[#FAF9F6] border border-[#E8E6E0]">
            <Database className="h-3 w-3 text-[#52664F]" />
            DETERMINISTIC
          </span>
        </div>

        {actions}
      </div>
    </header>
  );
}
