"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { TopBar } from "./components/layout/TopBar";
import { AuthScreen } from "./features/auth/AuthScreen";
import { DashboardView } from "./features/dashboard/DashboardView";
import { ReportsView } from "./features/reports/ReportsView";
import { RecruiterView } from "./features/recruiter/RecruiterView";
import { ResumeAnalyzer } from "./features/tools/ResumeAnalyzer";
import { ResumeBuilder } from "./features/tools/ResumeBuilder";
import { AtsChecker } from "./features/tools/AtsChecker";
import { ResumeCorrector } from "./features/tools/ResumeCorrector";
import { ResumeEditor } from "./features/tools/ResumeEditor";
import {
  fetchCurrentUser,
  logoutUser,
  fetchAnalyses,
  fetchResumes,
  fetchJobs,
  fetchCloudStats,
  fetchCloudEvents,
} from "./api";
import {
  User,
  AnalysisListItem,
  ResumeItem,
  JobItem,
  CloudStats,
  CloudEventItem,
} from "./types";

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Real Platform Data
  const [analyses, setAnalyses] = useState<AnalysisListItem[]>([]);
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [cloudStats, setCloudStats] = useState<CloudStats | null>(null);
  const [cloudEvents, setCloudEvents] = useState<CloudEventItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Cross-tool data relay
  const [relayText, setRelayText] = useState<string>("");
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);

  // Check current session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const user = await fetchCurrentUser();
      if (user) {
        setCurrentUser(user);
      } else {
        // Fallback default demo user to keep private workspace immediately accessible
        setCurrentUser({
          id: "37e5aa27-f0ea-4794-aeaf-79395dc73056",
          email: "demo@resumex.cloud",
          name: "Alexander Vance",
          role: "candidate",
        });
      }
      setAuthChecked(true);
    };
    checkAuth();
  }, []);

  // Fetch real platform data from backend
  const loadPlatformData = async () => {
    setLoadingData(true);
    try {
      const [anList, resList, jList, st, ev] = await Promise.all([
        fetchAnalyses().catch(() => []),
        fetchResumes().catch(() => []),
        fetchJobs().catch(() => []),
        fetchCloudStats().catch(() => null),
        fetchCloudEvents().catch(() => []),
      ]);
      setAnalyses(anList);
      setResumes(resList);
      setJobs(jList);
      setCloudStats(st);
      setCloudEvents(ev);
    } catch (e) {
      console.error("Data load error:", e);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadPlatformData();
    }
  }, [currentUser]);

  const handleSignOut = () => {
    logoutUser();
    setCurrentUser(null);
  };

  // If not authenticated, render strict minimal login/registration screen
  if (authChecked && !currentUser) {
    return <AuthScreen onAuthSuccess={(user) => setCurrentUser(user)} />;
  }

  const getPageMeta = () => {
    switch (activeTab) {
      case "dashboard":
        return { title: "Executive Dashboard", description: "Telemetry, aggregate scores, and audit activity" };
      case "reports":
        return { title: "Audit Reports", description: "Historical ATS compatibility records and PDF exports" };
      case "recruiter":
        return { title: "Recruiter Workspace", description: "Job requisition management and candidate evaluations" };
      case "analyzer":
        return { title: "Resume Analyzer", description: "Structural health, action verb density, and section audits" };
      case "builder":
        return { title: "Resume Builder", description: "Interactive builder with real-time ATS preview and print export" };
      case "ats_checker":
        return { title: "ATS Match Checker", description: "Keyword coverage scoring and semantic gap audit" };
      case "corrector":
        return { title: "Resume Bullet Corrector", description: "NLP-driven power verb replacement and XYZ formula polisher" };
      case "editor":
        return { title: "Live Resume Editor", description: "Distraction-free markdown editor with live ATS validation" };
      default:
        return { title: "Workspace", description: "Resumex-Cloud Platform" };
    }
  };

  const pageMeta = getPageMeta();

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#20211F] flex flex-col font-sans">
      <div className="flex flex-1 min-h-screen">
        {/* Minimal Luxury Collapsible Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if (tab === "reports") setSelectedAnalysisId(null);
            setActiveTab(tab);
          }}
          currentUser={currentUser}
          onSignOut={handleSignOut}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar
            title={pageMeta.title}
            description={pageMeta.description}
            currentUser={currentUser}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {activeTab === "dashboard" && (
              <DashboardView
                stats={cloudStats}
                analyses={analyses}
                resumes={resumes}
                jobs={jobs}
                events={cloudEvents}
                loading={loadingData}
                onRefresh={loadPlatformData}
                onNavigate={(tab) => setActiveTab(tab)}
                onSelectAnalysis={(id) => {
                  setSelectedAnalysisId(id);
                  setActiveTab("reports");
                }}
              />
            )}

            {activeTab === "reports" && (
              <ReportsView
                analyses={analyses}
                onRefresh={loadPlatformData}
                selectedAnalysisId={selectedAnalysisId}
                onClearSelectedAnalysis={() => setSelectedAnalysisId(null)}
              />
            )}

            {activeTab === "recruiter" && <RecruiterView />}

            {activeTab === "analyzer" && (
              <ResumeAnalyzer
                onNavigateToBuilder={(text) => {
                  setRelayText(text || "");
                  setActiveTab("builder");
                }}
                onNavigateToAtsChecker={(text) => {
                  setRelayText(text);
                  setActiveTab("ats_checker");
                }}
                onNavigateToCorrector={(text) => {
                  setRelayText(text);
                  setActiveTab("corrector");
                }}
                onNavigateToEditor={(text) => {
                  setRelayText(text);
                  setActiveTab("editor");
                }}
              />
            )}

            {activeTab === "builder" && (
              <ResumeBuilder
                onSendToAtsChecker={(text) => {
                  setRelayText(text);
                  setActiveTab("ats_checker");
                }}
                onSendToCorrector={(text) => {
                  setRelayText(text);
                  setActiveTab("corrector");
                }}
                onSendToEditor={(text) => {
                  setRelayText(text);
                  setActiveTab("editor");
                }}
              />
            )}

            {activeTab === "ats_checker" && (
              <AtsChecker
                initialResumeText={relayText}
                onNavigateToCorrector={(text) => {
                  setRelayText(text);
                  setActiveTab("corrector");
                }}
                onNavigateToEditor={(text) => {
                  setRelayText(text);
                  setActiveTab("editor");
                }}
              />
            )}

            {activeTab === "corrector" && (
              <ResumeCorrector
                initialText={relayText}
                onNavigateToEditor={(text) => {
                  setRelayText(text);
                  setActiveTab("editor");
                }}
              />
            )}

            {activeTab === "editor" && (
              <ResumeEditor
                initialContent={relayText}
                onNavigateToAtsChecker={(text) => {
                  setRelayText(text);
                  setActiveTab("ats_checker");
                }}
                onNavigateToCorrector={(text) => {
                  setRelayText(text);
                  setActiveTab("corrector");
                }}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
