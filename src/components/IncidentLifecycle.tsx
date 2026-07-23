import React, { useEffect, useRef, useState } from 'react';
import { 
  Users,
  Network, 
  Terminal, 
  AlertTriangle, 
  Code, 
  Loader2, 
  Play, 
  ShieldAlert, 
  GitPullRequest, 
  CheckCircle 
, Search, Database, Book, Shield } from 'lucide-react';
import { SanityCheckRun, AgentDialogueMessage, AgentLog } from '../types';

interface IncidentLifecycleProps {
  activeRun: SanityCheckRun | null;
  isChecking: boolean;
  currentUser: { id: string; name: string; role: string; avatar: string } | null;
  currentStepIndex: number;
  streamingDialogues: AgentDialogueMessage[];
  streamingLogs: AgentLog[];
  executingRemediation: string | null;
  handleExecuteRemediation: (remediation: any) => Promise<void>;
  handlePRAction: (status: 'APPROVED' | 'DECLINED') => Promise<void>;
  handleCreateJiraIssue: () => Promise<void>;
}


function AgentNetworkGraph({ activeAgentId }: { activeAgentId: string | null }) {
  const nodes = [
    { id: 'alice', name: 'Alice (Recon)', icon: Search, cx: 50, cy: 15, color: '#06b6d4', textClass: 'text-indigo-600', bgClass: 'bg-cyan-50 border-cyan-200', shadowClass: 'shadow-indigo-500/20' },
    { id: 'bob', name: 'Bob (DB)', icon: Database, cx: 15, cy: 45, color: '#ca8a04', textClass: 'text-amber-600', bgClass: 'bg-amber-50 border-amber-200', shadowClass: 'shadow-amber-500/20' },
    { id: 'charlie', name: 'Charlie (Code)', icon: GitPullRequest, cx: 28, cy: 85, color: '#9333ea', textClass: 'text-purple-600', bgClass: 'bg-purple-50 border-purple-200', shadowClass: 'shadow-purple-500/20' },
    { id: 'david', name: 'David (RegOps)', icon: Shield, cx: 72, cy: 85, color: '#2563eb', textClass: 'text-indigo-600', bgClass: 'bg-indigo-50 border-indigo-200', shadowClass: 'shadow-indigo-500/20' },
    { id: 'ethan', name: 'Ethan (KB)', icon: Book, cx: 85, cy: 45, color: '#16a34a', textClass: 'text-emerald-600', bgClass: 'bg-emerald-50 border-emerald-200', shadowClass: 'shadow-emerald-500/20' }
  ];

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden flex items-center justify-center min-h-[300px]">
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        {nodes.map((n1, i) => 
          nodes.map((n2, j) => {
            if (i < j) {
              const isActive = activeAgentId === n1.id || activeAgentId === n2.id;
              const activeColor = activeAgentId === n1.id ? n1.color : (activeAgentId === n2.id ? n2.color : '#e5e7eb');
              return (
                <line key={n1.id + '-' + n2.id} x1={n1.cx} y1={n1.cy} x2={n2.cx} y2={n2.cy} stroke={isActive ? activeColor : '#f3f4f6'} strokeWidth={isActive ? "0.6" : "0.3"} opacity={isActive ? "0.8" : "0.5"} className="transition-all duration-500" />
              );
            }
            return null;
          })
        )}
      </svg>
      {nodes.map(n => {
        const isActive = activeAgentId === n.id;
        return (
          <div key={n.id} className="absolute flex flex-col items-center justify-center transition-all duration-500 z-10" style={{ top: n.cy + '%', left: n.cx + '%', transform: 'translate(-50%, -50%)' }}>
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded-lg text-[9px] uppercase tracking-wider font-bold transition-all duration-300 ${isActive ? n.bgClass + ' shadow-lg scale-110 ' + n.shadowClass : 'bg-white border-gray-200 text-gray-400 scale-100'}`}>
              <n.icon className={`w-3.5 h-3.5 ${isActive ? n.textClass : 'text-gray-400'}`} />
              <span className={isActive ? n.textClass : ''}>{n.name}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const LIFECYCLE_STEPS = [
  { title: "Anomaly", desc: "Detect anomaly via Geneos alerts" },
  { title: "Identify", desc: "Identify service and route topology" },
  { title: "Evidence", desc: "Collect logs & telemetry via MCP" },
  { title: "Infra/DB", desc: "Query cluster metrics & DB locks" },
  { title: "Changes", desc: "Compare recent Git modifications" },
  { title: "Historical", desc: "Search incident runbook archives" },
  { title: "Hypotheses", desc: "Validate root cause hypotheses" },
  { title: "Recommend", desc: "Formulate fix & validation plan" },
  { title: "Approve", desc: "Operator review & PR submissions" },
  { title: "Resolved", desc: "Fix executed & verified" }
];

export default function IncidentLifecycle({
  activeRun,
  isChecking,
  currentUser,
  currentStepIndex,
  streamingDialogues,
  streamingLogs,
  executingRemediation,
  handleExecuteRemediation,
  handlePRAction,
  handleCreateJiraIssue
}: IncidentLifecycleProps) {
  
  const [showLogsWhenCompleted, setShowLogsWhenCompleted] = useState(false);
  const [isCreatingJira, setIsCreatingJira] = useState(false);

  const onJiraClick = async () => {
    if (isCreatingJira) return;
    setIsCreatingJira(true);
    try {
      await handleCreateJiraIssue();
    } finally {
      setIsCreatingJira(false);
    }
  };

  const localChatEndRef = useRef<HTMLDivElement>(null);
  const localTerminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chats
  useEffect(() => {
    if (localChatEndRef.current) {
      const parent = localChatEndRef.current.parentElement;
      if (parent) {
        parent.scrollTop = parent.scrollHeight;
      }
    }
  }, [streamingDialogues, isChecking, activeRun]);

  // Auto-scroll terminals
  useEffect(() => {
    if (localTerminalEndRef.current) {
      const parent = localTerminalEndRef.current.parentElement;
      if (parent) {
        parent.scrollTop = parent.scrollHeight;
      }
    }
  }, [streamingLogs, isChecking, activeRun]);

  const isResolved = !isChecking && (
    activeRun?.overallStatus === 'HEALTHY' ||
    activeRun?.currentStep === 'completed' ||
    !!activeRun?.remediationTaken ||
    activeRun?.pullRequest?.status === 'APPROVED'
  );

  return (
    <div className="space-y-6 animate-fade-in text-left">
      
      {/* Active Application Incident Header Banner */}
      {(isChecking || activeRun) && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm text-left space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
                isResolved 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                  : 'bg-indigo-50 border-indigo-200 text-indigo-600'
              }`}>
                {isResolved ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <ShieldAlert className="w-5 h-5 animate-pulse" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
                    Application: {activeRun?.applicationName || 'MIFID RATES GATEWAY'}
                  </span>
                  {activeRun?.applicationId && (
                    <span className="text-[10px] font-mono text-gray-500 font-semibold">
                      [{activeRun.applicationId}]
                    </span>
                  )}
                </div>
                <h2 className="text-sm font-bold text-gray-900 mt-1">
                  Incident: {activeRun?.issues?.[0]?.title || activeRun?.executiveSummary || 'Geneos Threshold Breach & Network Socket Exhaustion'}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isChecking ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 rounded-full animate-pulse shadow-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                  INVESTIGATING INCIDENT
                </span>
              ) : isResolved ? (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full shadow-xs">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  INCIDENT RESOLVED
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 rounded-full shadow-xs">
                  ⧖ OPEN / PENDING RESOLUTION
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
            <div>
              <span className="text-gray-500 font-medium">Target Application:</span>{' '}
              <strong className="text-gray-900">{activeRun?.applicationName || 'MIFID RATES GATEWAY'}</strong>
            </div>
            <div>
              <span className="text-gray-500 font-medium">Incident ID:</span>{' '}
              <strong className="text-gray-800">{activeRun?.id || 'RUN-CURRENT'}</strong>
            </div>
            <div>
              <span className="text-gray-500 font-medium">Triggered By:</span>{' '}
              <strong className="text-indigo-600">{isChecking ? (currentUser ? `${currentUser.name} (${currentUser.role})` : 'System Operator') : (activeRun?.triggeredBy || 'System Operator')}</strong>
            </div>
          </div>
        </div>
      )}
      
      {/* 10-Step Progress track flowchart */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-md overflow-x-auto">
        <div className="flex items-center gap-1 min-w-[850px] justify-between text-center select-none font-mono">
          {LIFECYCLE_STEPS.map((step, idx) => {
            const stepNum = idx + 1;
            let isActive = false;
            let isCompleted = false;

            if (isChecking) {
              isActive = currentStepIndex === stepNum;
              isCompleted = currentStepIndex > stepNum;
            } else if (activeRun) {
              const isRemediationDone = !!activeRun.remediationTaken || activeRun.overallStatus === 'HEALTHY';
              
              if (stepNum < 9) {
                isCompleted = true;
                isActive = false;
              } else if (stepNum === 9) {
                isCompleted = isRemediationDone;
                isActive = !isRemediationDone;
              } else if (stepNum === 10) {
                isCompleted = isRemediationDone;
                isActive = false;
              }
            }

            return (
              <div key={idx} className="flex-1 flex items-center gap-1">
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                    isActive ? 'bg-indigo-500 text-white ring-4 ring-indigo-500/20 animate-pulse' :
                    isCompleted ? 'bg-emerald-500 text-white' :
                    'bg-gray-100 text-gray-500 border border-gray-300'
                  }`}>
                    {isCompleted ? '✓' : stepNum}
                  </div>
                  <span className={`text-[9px] uppercase tracking-wider font-bold mt-1.5 ${
                    isActive ? 'text-indigo-600' : isCompleted ? 'text-emerald-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </span>
                </div>
                {idx < 9 && (
                  <div className={`flex-1 h-0.5 rounded transition-all ${
                    isCompleted ? 'bg-emerald-500/40' : 'bg-gray-100'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Collaborative Agent Dialogue Board */}
      {(!activeRun || isChecking || showLogsWhenCompleted) && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in-up">
        {(() => {
          const dialogues = isChecking ? streamingDialogues : (activeRun?.agentDialogues || []);
          const logs = isChecking ? streamingLogs : (activeRun?.logs || []);
          
          let activeAgentId = null;
          
          // We want the most recently mentioned agent in the streams.
          // Since the streams are ordered by time of addition, we can just look backwards in logs.
          let lastLogAgent = null;
          for (let i = logs.length - 1; i >= 0; i--) {
             const match = logs[i].message.match(/\[(Alice|Bob|Charlie|David|Ethan)\s/i);
             if (match) {
                lastLogAgent = match[1].toLowerCase();
                break;
             }
          }
          
          let lastDialAgent = dialogues.length > 0 ? dialogues[dialogues.length - 1].agentId : null;
          
          // Just pick the log agent if it exists, otherwise the dialogue agent.
          // (Since logs are usually more frequent and come alongside dialogues).
          activeAgentId = lastLogAgent || lastDialAgent || null;
          return (
            <>
              {/* Agent Swarm Topology Graph */}
              <div className="lg:col-span-3 bg-white border border-gray-200 rounded-xl p-4 flex flex-col h-[400px] shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Network className="w-4 h-4 text-purple-600" />
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Swarm Topology</h3>
                  </div>
                </div>
                <div className="flex-1 relative">
                  <AgentNetworkGraph activeAgentId={activeAgentId} />
                </div>
              </div>

              {/* Middle part: SRE Agent Dialogues */}
              <div className="lg:col-span-5 bg-white border border-gray-200 rounded-xl p-4 flex flex-col h-[400px] shadow-md">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Collaborative Dialogues</h3>
                  </div>
                  <span className="text-[10px] font-mono text-gray-600 bg-white px-2 py-0.5 rounded">5 Co-operating Agents</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 font-mono text-xs max-h-[310px]">
                  {(!isChecking && (!activeRun || !activeRun.agentDialogues || activeRun.agentDialogues.length === 0)) && (
                    <div className="text-center py-12 text-gray-500 leading-relaxed font-display">
                      No active collaborative chats. Trigger an outage diagnosis or select an alert to spin up agents.
                    </div>
                  )}
                  {/* Render Dialogues */}
                  {(isChecking ? streamingDialogues : (activeRun?.agentDialogues || [])).map((msg) => {
                    const isCharlie = msg.agentId === 'charlie';
                    const isBob = msg.agentId === 'bob';
                    const isAlice = msg.agentId === 'alice';
                    const isEthan = msg.agentId === 'ethan';
                    
                    let badgeColor = 'bg-indigo-600/10 text-indigo-600 border-indigo-500/10';
                    if (isCharlie) badgeColor = 'bg-purple-600/10 text-purple-400 border-purple-500/10';
                    if (isBob) badgeColor = 'bg-amber-600/10 text-amber-600 border-amber-500/10';
                    if (isAlice) badgeColor = 'bg-indigo-600/10 text-indigo-400 border-indigo-500/10';
                    if (isEthan) badgeColor = 'bg-emerald-600/10 text-emerald-600 border-emerald-500/10';

                    return (
                      <div key={msg.id} className="space-y-1 text-left border-l border-gray-300 pl-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {isAlice && <Search className="w-3 h-3 text-indigo-500" />}
                            {isBob && <Database className="w-3 h-3 text-amber-500" />}
                            {isCharlie && <GitPullRequest className="w-3 h-3 text-purple-500" />}
                            {isEthan && <Book className="w-3 h-3 text-emerald-500" />}
                            {(!isAlice && !isBob && !isCharlie && !isEthan) && <Shield className="w-3 h-3 text-indigo-500" />}
                            <span className="text-[10px] font-bold text-gray-900">{msg.agentName}</span>
                            <span className={`text-[9px] uppercase tracking-wide border px-1.5 rounded-full ${badgeColor}`}>
                              {msg.role}
                            </span>
                          </div>
                          <span className="text-[9px] text-gray-500">{(msg.timestamp || new Date().toISOString()).substring(11, 19)}</span>
                        </div>
                        <p className="text-xs text-gray-800 font-display leading-relaxed">{msg.content}</p>
                      </div>
                    );
                  })}
                  <div ref={localChatEndRef} />
                </div>
              </div>

              {/* Right part: Running Telemetry MCP Logs */}
              <div className="lg:col-span-4 bg-white border border-gray-200 rounded-xl p-4 flex flex-col h-[400px] shadow-md font-mono text-xs">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">MCP Telemetry Logs</h3>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                </div>
                <div className="flex-1 bg-white rounded-lg p-3 overflow-y-auto space-y-2 text-[10.5px] max-h-[310px] text-left">
                  {(isChecking ? streamingLogs : (activeRun?.logs || [])).map((log, idx) => (
                    <div key={idx} className="leading-normal">
                      <span className="text-gray-500">[{ (log.timestamp || new Date().toISOString()).substring(11, 19) }]</span>{' '}
                      <span className={`text-[9px] uppercase px-1 rounded ${
                        log.level === 'error' ? 'text-red-600' :
                        log.level === 'warn' ? 'text-amber-600' :
                        log.level === 'success' ? 'text-emerald-600' :
                        'text-indigo-400'
                      }`}>
                        {log.level}
                      </span>{' '}
                      <span className="text-gray-800">{log.message}</span>
                    </div>
                  ))}
                  <div ref={localTerminalEndRef} />
                </div>
              </div>
            </>
          );
        })()}
      </div>
      )}
      {activeRun && !isChecking && !showLogsWhenCompleted && (
        <div className="text-center animate-fade-in-up">
          <button
            onClick={() => setShowLogsWhenCompleted(true)}
            className="inline-flex items-center gap-2 py-2.5 px-6 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-lg border border-gray-300 shadow-sm transition-all cursor-pointer hover:shadow"
          >
            <Terminal className="w-4 h-4 text-indigo-500" />
            View MCP Telemetry & Swarm Dialogues
          </button>
        </div>
      )}
      {activeRun && !isChecking && showLogsWhenCompleted && (
        <div className="text-center animate-fade-in-up">
          <button
            onClick={() => setShowLogsWhenCompleted(false)}
            className="inline-flex items-center gap-2 py-2.5 px-6 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-lg border border-gray-300 shadow-sm transition-all cursor-pointer hover:shadow"
          >
            <Terminal className="w-4 h-4 text-indigo-500" />
            Hide MCP Telemetry & Swarm Dialogues
          </button>
        </div>
      )}

      {activeRun && !isChecking && (
        <div className="space-y-6 animate-fade-in-up">
          
          {/* Discovered Issues and Playbook Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left: Discovered Issues */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3.5 shadow-sm text-left">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-300 pb-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Discovered Anomaly details
              </h3>
              {(activeRun.issues || []).map((issue) => (
                <div key={issue.id} className="p-3.5 bg-white border border-gray-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between gap-2 border-b border-gray-200 pb-1.5">
                    <h4 className="text-xs font-bold text-gray-900">{issue.title}</h4>
                    <span className="text-[10px] font-mono text-gray-500 bg-white px-1.5 py-0.2 rounded">{issue.endpoint}</span>
                  </div>
                  <p className="text-xs text-gray-800 font-display leading-relaxed">{issue.description}</p>
                  <div className="text-[11px] text-gray-600 font-display bg-white p-2 rounded">
                    <strong className="text-gray-800">Possible Cause:</strong> {issue.possibleCause}
                  </div>
                </div>
              ))}
            </div>

            {/* Right: GCP Remediation Playbook */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3.5 shadow-sm text-left">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-300 pb-2">
                <Code className="w-4 h-4 text-indigo-400" />
                GCP Actionable Playbook
              </h3>
              {(activeRun.remediations || []).map((step, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col font-mono text-xs">
                  <div className="px-3.5 py-2 bg-white border-b border-gray-200 flex items-center justify-between">
                    <span className="font-semibold text-gray-900 text-[11px]">{step.title}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                      step.riskClassification === 'GREEN' ? 'bg-emerald-100 text-emerald-700 border border-emerald-500/10' :
                      step.riskClassification === 'AMBER' ? 'bg-amber-100 text-amber-700 border border-amber-500/10' :
                      'bg-red-100 text-red-700 border border-red-500/10'
                    }`}>
                      Risk: {step.riskClassification}
                    </span>
                  </div>
                  <div className="p-3.5 space-y-2.5">
                    <p className="text-[11px] text-gray-800 font-display leading-relaxed">{step.explanation}</p>
                    <div className="relative">
                      <pre className="p-2.5 bg-white rounded text-[10.5px] text-cyan-300 overflow-x-auto select-all leading-normal whitespace-pre">
                        {step.command}
                      </pre>
                    </div>

                    {activeRun.overallStatus !== 'HEALTHY' && (
                      <button
                        onClick={() => handleExecuteRemediation(step)}
                        disabled={executingRemediation !== null}
                        className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded text-[11px] font-bold transition-all cursor-pointer ${
                          step.riskClassification === 'RED' 
                            ? 'bg-white text-gray-500 cursor-not-allowed border border-gray-300'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        {executingRemediation === step.title ? (
                          <>
                            <Loader2 className="w-3 animate-spin" />
                            Executing command...
                          </>
                        ) : step.riskClassification === 'RED' ? (
                          <>
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Auto-Execution Prohibited (Manual signature needed)
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 fill-current" />
                            Approve & Execute Fix via MCP
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Jira Issue Tracking */}
          {activeRun.jiraIssueKey && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm text-left">
              <div className="flex items-center gap-2 border-b border-gray-300 pb-2">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Associated Jira Tracking
                </h3>
              </div>
              <div className="text-xs font-mono text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p><strong>Issue Key:</strong> {activeRun.jiraIssueKey}</p>
                <p className="mt-1">
                  <a href={activeRun.jiraIssueLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer font-sans font-semibold">Go to that issue</a>
                </p>
                <p className="mt-2 text-gray-500 italic">This issue was autonomously logged by OpsPilot because a source code change was determined to be necessary.</p>
              </div>
            </div>
          )}
          
          {/* Developer Mistake Pull Request Section */}
          {activeRun.pullRequest && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-300 pb-2.5 gap-2">
                <div className="flex items-center gap-2">
                  <GitPullRequest className="w-4.5 h-4.5 text-purple-400 animate-pulse" />
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    OpsPilot Suggested Code Changes
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full font-bold">
                  Developer Code Mistake Found
                </span>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs font-mono border-b border-gray-200 pb-3">
                  <div>
                    <strong className="text-gray-600">Suggestion ID:</strong> <span className="text-gray-900 font-display font-semibold">#{activeRun.pullRequest.id}</span>
                  </div>

                  <div>
                    <strong className="text-gray-600">Repository:</strong> <span className="text-gray-800 text-[11px] underline cursor-pointer">{activeRun.pullRequest.repository}</span>
                  </div>
                </div>

                <div className="space-y-1 font-display">
                  <h4 className="text-xs font-bold text-gray-900">{activeRun.pullRequest.title}</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">{activeRun.pullRequest.description}</p>
                </div>

                {/* Code Diff Display */}
                <div className="space-y-2">
                  {(activeRun.pullRequest?.filesChanged || []).map((file, fileIdx) => (
                    <div key={fileIdx} className="border border-gray-200 rounded-lg overflow-hidden text-xs font-mono">
                      <div className="bg-white px-3 py-1.5 border-b border-gray-200 text-[11px] text-gray-600 flex justify-between">
                        <span>{file.filename}</span>
                        <span className="text-[10px] text-gray-500">+{file.additions} insertions, -{file.deletions} deletions</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-850 bg-white">
                        {/* Original Block */}
                        <div className="p-3">
                          <span className="block text-[10px] text-red-500 font-display uppercase font-bold tracking-wider mb-2 select-none">Original Code (John Doe's Mistake)</span>
                          <pre className="text-[11px] overflow-x-auto p-2.5 bg-red-50 border border-red-200 rounded text-red-700 leading-relaxed whitespace-pre">
                            {file.originalCode}
                          </pre>
                        </div>
                        
                        {/* Corrected Block */}
                        <div className="p-3">
                          <span className="block text-[10px] text-emerald-600 font-display uppercase font-bold tracking-wider mb-2 select-none">Corrected Code (David's Repair)</span>
                          <pre className="text-[11px] overflow-x-auto p-2.5 bg-emerald-50 border border-emerald-200 rounded text-emerald-700 leading-relaxed whitespace-pre">
                            {file.modifiedCode}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Approval Actions or Create Jira Actions */}
                <div className="pt-3 border-t border-gray-200 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Review status:</span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 font-bold border rounded-full text-[10.5px] ${
                      activeRun.jiraIssueKey ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'
                    }`}>
                      {activeRun.jiraIssueKey ? '✓ JIRA TICKET CREATED' : '⧖ WAITING FOR JIRA CREATION'}
                    </span>
                  </div>
                  
                  {!activeRun.jiraIssueKey && !!activeRun.pullRequest && (
                    <button
                      onClick={onJiraClick}
                      disabled={isCreatingJira}
                      className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-70 rounded-lg shadow-md hover:shadow-blue-500/10 active:scale-95 transition-all cursor-pointer"
                    >
                      {isCreatingJira ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Creating Jira Issue...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          Create Jira Issue for these changes
                        </>
                      )}
                    </button>
                  )}
                </div>

              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
