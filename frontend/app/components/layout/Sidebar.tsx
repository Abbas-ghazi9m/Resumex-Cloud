"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Users,
  Search,
  Wrench,
  CheckCircle,
  Edit3,
  FileCheck2,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers
} from "lucide-react";
import { User } from "../../types";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  onSignOut: () => void;
}

export function Sidebar({
  activeTab,
  setActiveTab,
  currentUser,
  onSignOut,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const primaryNav = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "recruiter", label: "Recruiter Workspace", icon: Users },
  ];

  const toolsNav = [
    { id: "analyzer", label: "Resume Analyzer", icon: Search },
    { id: "builder", label: "Resume Builder", icon: Layers },
    { id: "ats_checker", label: "ATS Checker", icon: FileCheck2 },
    { id: "corrector", label: "Resume Corrector", icon: CheckCircle },
    { id: "editor", label: "Resume Editor", icon: Edit3 },
  ];

  return (
    <aside
      className={`shrink-0 border-r border-[#E8E6E0] bg-[#FAF9F6] flex flex-col justify-between transition-all duration-200 z-20 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      <div className="p-3.5 space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E8E6E0]">
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-[4px] bg-[#52664F] flex items-center justify-center text-white text-xs font-semibold">
                R
              </div>
              <div>
                <span className="text-xs font-bold tracking-tight text-[#20211F] font-mono-tech uppercase">
                  RESUMEX
                </span>
                <span className="text-[10px] block text-[#777872] -mt-0.5">
                  Scan. Match. Optimize.
                </span>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="mx-auto h-7 w-7 rounded-[4px] bg-[#52664F] flex items-center justify-center text-white text-xs font-semibold">
              R
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-[3px] text-[#777872] hover:text-[#20211F] hover:bg-[#F0EEE7] transition"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {/* Primary Workspace Navigation */}
        <div className="space-y-1">
          {!collapsed && (
            <div className="px-2 mb-1.5 text-[10px] font-mono-tech uppercase tracking-wider text-[#9E9F99] font-medium">
              Workspace
            </div>
          )}
          {primaryNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[4px] text-xs font-medium transition ${
                  isActive
                    ? "bg-[#EDF1EC] text-[#2D3A2B] font-semibold border-l-2 border-[#52664F]"
                    : "text-[#555650] hover:bg-[#F0EEE7] hover:text-[#20211F]"
                } ${collapsed ? "justify-center px-0" : ""}`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive ? "text-[#52664F]" : "text-[#777872]"
                  }`}
                />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>

        {/* Intelligence Tools */}
        <div className="space-y-1 pt-2 border-t border-[#E8E6E0]">
          {!collapsed && (
            <div className="px-2 mb-1.5 text-[10px] font-mono-tech uppercase tracking-wider text-[#9E9F99] font-medium">
              Intelligence Tools
            </div>
          )}
          {toolsNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[4px] text-xs font-medium transition ${
                  isActive
                    ? "bg-[#EDF1EC] text-[#2D3A2B] font-semibold border-l-2 border-[#52664F]"
                    : "text-[#555650] hover:bg-[#F0EEE7] hover:text-[#20211F]"
                } ${collapsed ? "justify-center px-0" : ""}`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive ? "text-[#52664F]" : "text-[#777872]"
                  }`}
                />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer / User Profile & Sign Out */}
      <div className="p-3 border-t border-[#E8E6E0] space-y-2 bg-[#FBFBFA]">
        {!collapsed && currentUser && (
          <div className="px-1 py-1">
            <div className="text-xs font-semibold text-[#20211F] truncate">
              {currentUser.name}
            </div>
            <div className="text-[11px] text-[#777872] truncate">
              {currentUser.email}
            </div>
          </div>
        )}
        <button
          onClick={onSignOut}
          title={collapsed ? "Sign Out" : undefined}
          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[4px] text-xs text-[#777872] hover:text-[#B9382F] hover:bg-[#FDF2F1] transition ${
            collapsed ? "justify-center px-0" : ""
          }`}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
