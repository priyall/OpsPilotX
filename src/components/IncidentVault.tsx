import React from "react";
import {
  Activity,
  ArrowRight,
  Trash2,
  CloudUpload,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";
import { SanityCheckRun, ApplicationProfile } from "../types";

interface IncidentVaultProps {
  history: SanityCheckRun[];
  applications: ApplicationProfile[];
  setSelectedApp: (app: ApplicationProfile) => void;
  setActiveRun: (run: SanityCheckRun) => void;
  setActiveTab: (tab: "alerts" | "investigation" | "history" | "mcp") => void;
  handleDeleteHistory: (id: string, e: React.MouseEvent) => void;
}

export default function IncidentVault({
  history,
  applications,
  setSelectedApp,
  setActiveRun,
  setActiveTab,
  handleDeleteHistory,
}: IncidentVaultProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'resolved'>('all');

  const isResolved = (run: SanityCheckRun) => {
    return run.overallStatus === 'HEALTHY' || run.currentStep === 'completed' || run.pullRequest?.status === 'APPROVED';
  };

  const openCount = history.filter(r => !isResolved(r)).length;
  const resolvedCount = history.filter(r => isResolved(r)).length;

  const displayedHistory = history.filter(run => {
    if (filterStatus === 'open') return !isResolved(run);
    if (filterStatus === 'resolved') return isResolved(run);
    return true;
  });

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm text-left animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-300 pb-3 gap-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4.5 h-4.5 text-gray-600" />
          <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            Historical Incident Records
          </h2>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg border border-gray-200 font-mono text-[11px]">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-white text-gray-900 shadow-xs font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All ({history.length})
          </button>
          <button
            onClick={() => setFilterStatus('open')}
            className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              filterStatus === 'open'
                ? 'bg-amber-500 text-white shadow-xs font-bold'
                : 'text-amber-700 hover:bg-amber-100/60'
            }`}
          >
            Open ({openCount})
          </button>
          <button
            onClick={() => setFilterStatus('resolved')}
            className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              filterStatus === 'resolved'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-emerald-700 hover:bg-emerald-100/60'
            }`}
          >
            Resolved ({resolvedCount})
          </button>
        </div>
      </div>
      
      <div className="space-y-3">
        {displayedHistory.length === 0 ? (
          <div className="text-center py-12 text-gray-500 border border-dashed border-gray-300 rounded-xl">
            <p className="text-xs font-mono">
              {filterStatus === 'all'
                ? "No operations history logged yet."
                : filterStatus === 'open'
                ? "No open incidents in Vault."
                : "No resolved incidents in Vault."}
            </p>
          </div>
        ) : (
          displayedHistory.map((run) => (
            <div
              key={run.id}
              onClick={() => {
                const app = applications.find(
                  (a) => a.id === run.applicationId,
                );
                if (app) setSelectedApp(app);
                setActiveRun(run);
                setActiveTab("investigation");
              }}
              className="p-4 bg-white border border-gray-200 hover:border-indigo-500/40 rounded-xl cursor-pointer transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group shadow-xs hover:shadow-sm"
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isResolved(run)
                        ? "bg-emerald-500"
                        : "bg-amber-500 animate-ping"
                    }`}
                  />
                  <h4 className="text-xs font-bold text-gray-900 truncate">
                    {run.applicationName}
                  </h4>
                  <span className="text-[10px] font-mono text-gray-500 font-medium">
                    Score: {run.overallHealthScore}%
                  </span>

                  {/* Open vs Resolved Status Badge */}
                  {isResolved(run) ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full">
                      ✓ RESOLVED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 rounded-full animate-pulse">
                      ⧖ OPEN / IN PROGRESS
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 line-clamp-1 leading-relaxed font-display pr-4">
                  "{run.executiveSummary}"
                </p>
                <div className="flex items-center gap-3 text-[10px] text-gray-500 font-mono pt-1 flex-wrap">
                  <span>ID: {run.id}</span>
                  {run.applicationId === "snow-imported" && (
                    <>
                      <span>•</span>
                      <a
                        href={`https://dev214684.service-now.com/nav_to.do?uri=incident.do?sys_id=${run.id}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-indigo-600 font-semibold bg-indigo-500/5 px-1.5 py-0.5 rounded border border-indigo-500/10 flex items-center gap-1 hover:bg-indigo-500/10 transition-colors"
                      >
                        View in ServiceNow <ExternalLink className="w-3 h-3" />
                      </a>
                    </>
                  )}
                  <span>•</span>
                  <span>{new Date(run.timestamp).toLocaleString()}</span>
                  <span>•</span>
                  <span>{run.endpointsCheckedCount} Probes checked</span>
                  <span>•</span>
                  <span className="text-indigo-600 font-semibold bg-indigo-500/5 px-1.5 py-0.5 rounded border border-indigo-500/10">
                    Triggered By: {run.triggeredBy || "System Operator"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 border-t md:border-t-0 pt-2.5 md:pt-0 border-gray-200 justify-between shrink-0">
                {/* Prominent Jira Link if present */}
                {(run.jiraIssueKey || run.jiraIssueLink) && (
                  <a
                    href={run.jiraIssueLink || `https://atlassian.net/browse/${run.jiraIssueKey}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition-all shadow-xs cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 text-blue-600 fill-current" viewBox="0 0 24 24">
                      <path d="M11.53 2c0 2.4 1.97 4.35 4.35 4.35h1.78v1.78c0 2.38 1.95 4.35 4.34 4.35V2.01L11.53 2zM6.77 6.8c0 2.39 1.95 4.35 4.34 4.35h1.78v1.78c0 2.39 1.95 4.35 4.34 4.35V6.8H6.77zM2 11.6c0 2.39 1.95 4.35 4.34 4.35h1.78v1.78c0 2.39 1.95 4.35 4.34 4.35V11.6H2z"/>
                    </svg>
                    Jira: {run.jiraIssueKey || 'Ticket'} <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 group-hover:underline">
                  Open diagnostics <ArrowRight className="w-3 h-3" />
                </span>
                <button
                  onClick={(e) => handleDeleteHistory(run.id, e)}
                  className="p-1.5 hover:bg-red-500/15 text-gray-500 hover:text-red-600 rounded-md transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
