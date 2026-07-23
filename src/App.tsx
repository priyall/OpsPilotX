import { ServiceNowTab } from './components/ServiceNowTab';
import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Activity, 
  Play, 
  Plus, 
  Layers, 
  Cpu, 
  Terminal, 
  Loader2, 
  Users, 
  AlertOctagon,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';
import { 
  ApplicationProfile, 
  SanityCheckRun, 
  AgentLog, 
  GeneosAlert, 
  AgentDialogueMessage 
} from './types';

// Modular Components
import Header from './components/Header';
import Footer from './components/Footer';
import AuthSection from './components/AuthSection';
import GeneosAlertsGrid from './components/GeneosAlertsGrid';
import IncidentLifecycle from './components/IncidentLifecycle';
import IncidentVault from './components/IncidentVault';
import ApplicationForm from './components/ApplicationForm';

export default function App() {
  const [applications, setApplications] = useState<ApplicationProfile[]>([]);
  const [history, setHistory] = useState<SanityCheckRun[]>([]);
  const [geneosAlerts, setGeneosAlerts] = useState<GeneosAlert[]>([]);
  
  const [selectedApp, setSelectedApp] = useState<ApplicationProfile | null>(null);
  const [activeRun, setActiveRun] = useState<SanityCheckRun | null>(null);
  
  // UI states
  const [showForm, setShowForm] = useState(false);
  const [editingApp, setEditingApp] = useState<ApplicationProfile | undefined>(undefined);
  const [isChecking, setIsChecking] = useState(false);
  const [activeTab, setActiveTab] = useState<'scopes' | 'alerts' | 'investigation' | 'history' | 'servicenow'>('alerts');
  const [backendError, setBackendError] = useState<string | null>(null);
  const [snowError, setSnowError] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [streamingDialogues, setStreamingDialogues] = useState<AgentDialogueMessage[]>([]);
  const [streamingLogs, setStreamingLogs] = useState<AgentLog[]>([]);
  const [executingRemediation, setExecutingRemediation] = useState<string | null>(null);
  
  // Time ticker state
  const [currentTime, setCurrentTime] = useState<string>(new Date().toISOString());

  // User Authentication state
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: string; avatar: string } | null>(() => {
    const saved = localStorage.getItem('opspilot_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleAuthSuccess = (user: { id: string; name: string; role: string; avatar: string }) => {
    localStorage.setItem('opspilot_user', JSON.stringify(user));
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('opspilot_user');
    setCurrentUser(null);
  };

  // Poll current time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toISOString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial data
  useEffect(() => {
    if (currentUser) {
      fetchApplications();
      fetchHistory();
      fetchGeneosAlerts();
    }
  }, [currentUser]);

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/applications');
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
        if (data.length > 0 && !selectedApp) {
          setSelectedApp(data[0]);
        }
        setBackendError(null);
      } else {
        setBackendError("Failed to fetch applications from server.");
      }
    } catch (err) {
      setBackendError("Server is unreachable. Ensure the backend server is running.");
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/sanity-checks/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
        setSnowError(null);
        if (data.length > 0 && !activeRun) {
          setActiveRun(data[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  };

  const fetchGeneosAlerts = async () => {
    try {
      const res = await fetch('/api/geneos/alerts');
      if (res.ok) {
        const data = await res.json();
        setGeneosAlerts(data);
      }
    } catch (err) {
      console.error("Failed to load Geneos alerts:", err);
    }
  };

  const handleSaveApp = async (appData: Partial<ApplicationProfile>) => {
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appData)
      });
      if (res.ok) {
        const saved = await res.json();
        fetchApplications();
        setSelectedApp(saved);
        setShowForm(false);
        setEditingApp(undefined);
      }
    } catch (err) {
      console.error("Error saving application profile:", err);
    }
  };

  const handleDeleteApp = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this target profile?")) return;
    try {
      const res = await fetch(`/api/applications/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchApplications();
        if (selectedApp?.id === id) {
          setSelectedApp(null);
          setActiveRun(null);
        }
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleDeleteHistory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this incident investigation history?")) return;
    try {
      const res = await fetch(`/api/sanity-checks/history/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchHistory();
        if (activeRun?.id === id) {
          setActiveRun(null);
        }
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // Launch the 10-step autonomous collaboration runner
  
  const handleOpenIncident = async (alertId: string, alertData: GeneosAlert) => {
    setGeneosAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'OPENING_INCIDENT' } : a));
    try {
      const res = await fetch('/api/servicenow/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          short_description: `Applet Incident: ${alertData.systemName} - ${alertData.severity}`,
          description: `Rule: ${alertData.ruleName}\nParameter: ${alertData.parameter}\nValue: ${alertData.value}`,
          category: 'Software',
          impact: alertData.severity === 'CRITICAL' ? '1' : '3',
          urgency: alertData.severity === 'CRITICAL' ? '1' : '3'
        })
      });
      if (!res.ok) throw new Error('Failed to create incident');
      const data = await res.json();
      const incidentNumber = data.result?.number || 'INC-NEW';
      const incidentSysId = data.result?.sys_id;
      
      await fetch(`/api/geneos/alerts/${alertId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE', incidentNumber, incidentSysId })
      });
      
      setGeneosAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'ACTIVE', incidentNumber, incidentSysId } : a));
    } catch (err: any) {
      console.warn("Failed to open incident. Falling back to mock incident...", err.message);
      const mockIncidentNumber = `MOCK-INC-${Math.floor(Math.random() * 100000)}`;
      const mockIncidentSysId = `mock-sys-id-${Date.now()}`;
      
      try {
        await fetch(`/api/geneos/alerts/${alertId}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'ACTIVE', incidentNumber: mockIncidentNumber, incidentSysId: mockIncidentSysId, mock: true })
        });
      } catch (statusErr) {
        console.error("Failed to update status for mock incident", statusErr);
      }
      
      setGeneosAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'ACTIVE', incidentNumber: mockIncidentNumber, incidentSysId: mockIncidentSysId, mock: true } : a));
    }
  };

  const handleLaunchAgent = async (targetAppId?: string, alertId?: string, alertObj?: GeneosAlert) => {
    const appToRun = targetAppId 
      ? applications.find(a => a.id === targetAppId) 
      : selectedApp;

    if (!appToRun) {
      alert("Please select a target application profile to investigate.");
      return;
    }

    setIsChecking(true);
    setActiveRun(null);
    setStreamingDialogues([]);
    setStreamingLogs([]);
    setCurrentStepIndex(1); // Start on step 1 immediately
    setActiveTab('investigation');

    const stepDelays = [
      0,      // Index 0 dummy
      3000,   // Wait 3s before Step 2 (Identify)
      3000,   // Wait 3s before Step 3 (Evidence)
      3000,   // Wait 3s before Step 4 (Infra/DB)
      4500,   // Wait 4.5s before Step 5 (Changes)
      2000,   // Wait 2s before Step 6 (Historical)
      2000,   // Wait 2s before Step 7 (Hypotheses)
      2000,   // Wait 2s before Step 8 (Recommend)
      2000    // Wait 2s before Step 9 (Approve)
    ];

    let accumulatedDelay = 0;
    let timelineCompleted = false;
    let currentStageInternal = 1;

    for (let i = 1; i < stepDelays.length; i++) {
      accumulatedDelay += stepDelays[i];
      setTimeout(() => {
        setIsChecking((currentlyChecking) => {
          if (currentlyChecking) {
             setCurrentStepIndex(i + 1);
             currentStageInternal = i + 1;
          }
          return currentlyChecking;
        });
      }, accumulatedDelay);
    }
    
    setTimeout(() => {
      timelineCompleted = true;
    }, accumulatedDelay);

    if (alertId) {
      // Update local alert status instantly to INVESTIGATING
      setGeneosAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'INVESTIGATING' } : a));
    }

    // Setup instant warm-up queues for maximum responsiveness
    const logQueue: AgentLog[] = [
      { timestamp: new Date().toISOString(), level: 'info', message: `[System] Bootstrapping OpsPilot X autonomous agent workgroup...`, step: 'recon' },
      { timestamp: new Date().toISOString(), level: 'success', message: `✓ Spawning 5 specialized co-operating agents: Alice, Bob, Charlie, David, and Ethan`, step: 'recon' },
      { timestamp: new Date().toISOString(), level: 'info', message: `[System] Activating model: gemini-3.5-flash for real-time GCP incident reasoning`, step: 'recon' },
      { timestamp: new Date().toISOString(), level: 'info', message: `[System] Securing connection channels and mounting MCP telemetry servers...`, step: 'recon' },
      { timestamp: new Date().toISOString(), level: 'info', message: `[Step 1: Detect Anomaly] Fetching alert contexts and target system topology for: "${appToRun.name}"...`, step: 'recon' },
    ];

    const dialogueQueue: AgentDialogueMessage[] = [
      {
        id: "bootstrap-d1",
        agentId: "alice",
        agentName: "Alice (SRE Recon)",
        avatar: "SRE",
        role: "SRE",
        content: `Workgroup initialized. Alice here. I'm establishing the MCP tunnel to "${appToRun.name}" and loading cluster metadata. Bob, Charlie, David, Ethan — let's lock in.`,
        timestamp: new Date().toISOString(),
        step: "recon"
      }
    ];

    // Spawn the background fetch asynchronously (non-blocking)
    let finalRunResult: SanityCheckRun | null = null;
    let fetchCompleted = false;
    let fetchError: string | null = null;

    fetch('/api/sanity-checks/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        applicationId: appToRun.id,
        geneosAlertId: alertId,
        triggeredBy: currentUser ? `${currentUser.name} (${currentUser.role})` : 'System Operator'
      })
    })
    .then(async (res) => {
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Internal Agent Error");
      }
      return res.json();
    })
    .then((runResult: SanityCheckRun) => {
      finalRunResult = runResult;
      fetchCompleted = true;
      fetchHistory();
    })
    .catch((err) => {
      fetchError = err.message;
      fetchCompleted = true;
    });

    // Initiate the live-streaming loop
    let currentLogs: AgentLog[] = [];
    let currentDialogues: AgentDialogueMessage[] = [];
    let holdingIndex = 0;
    let ticksSinceLastHolding = 0;
    let backendAppended = false;

    const holdingPool = [
      { level: 'info' as const, message: `[System] Bob (Database) is analyzing SQL active locks and connection pools...`, step: 'recon' as const },
      { level: 'info' as const, message: `[System] Charlie (Code Archeology) is scanning recent Git commits for configuration drift...`, step: 'recon' as const },
      { level: 'info' as const, message: `[System] Ethan (Incident History) is querying the SRE Incident History Database for similar past outages...`, step: 'recon' as const },
      { level: 'info' as const, message: `[System] David (RegOps) is verifying compliance bounds and GCP resource IAM roles...`, step: 'recon' as const },
      { level: 'info' as const, message: `[System] Alice (SRE) is capturing GKE Pod logs and monitoring container restart logs...`, step: 'recon' as const },
      { level: 'info' as const, message: `[System] Active probing in progress: checking latency metrics and headers...`, step: 'recon' as const },
      { level: 'info' as const, message: `[System] Fetching audit trails and querying Cloud SQL cluster configurations...`, step: 'recon' as const }
    ];

    const getStageIndex = (item: any): number => {
      const txt = ((item.message || item.content || "") + "").toLowerCase();
      if (txt.includes("step 9") || txt.includes("approve") || txt.includes("pull request") || txt.includes("patch candidate") || txt.includes("drafting the fix pr")) return 9;
      if (txt.includes("step 8") || txt.includes("recommend") || txt.includes("fix") || txt.includes("patch")) return 8;
      if (txt.includes("step 7") || txt.includes("hypothes") || txt.includes("root cause") || txt.includes("diagnos") || txt.includes("anomalies detected") || txt.includes("audit completed")) return 7;
      if (txt.includes("step 6") || txt.includes("historical") || txt.includes("history") || txt.includes("past") || txt.includes("signature")) return 6;
      if (txt.includes("step 5") || txt.includes("git") || txt.includes("commit") || txt.includes("diff") || txt.includes("code") || txt.includes("repository")) return 5;
      if (txt.includes("step 4") || txt.includes("infra") || txt.includes("kubernetes") || txt.includes("db") || txt.includes("lock") || txt.includes("pool") || txt.includes("spid")) return 4;
      if (txt.includes("step 3") || txt.includes("telemetry") || txt.includes("mcp") || txt.includes("network") || txt.includes("ping") || txt.includes("ingress") || txt.includes("failed on matching") || txt.includes("nack") || txt.includes("rejection")) return 3;
      if (txt.includes("step 2") || txt.includes("tunnel") || txt.includes("metadata") || txt.includes("topology") || txt.includes("route")) return 2;
      if (txt.includes("step 1") || txt.includes("anomaly") || txt.includes("bootstrap") || txt.includes("workgroup") || txt.includes("initiating")) return 1;
      
      if (item.step === 'ping') return 3;
      if (item.step === 'infra') return 4;
      if (item.step === 'changes') return 5;
      if (item.step === 'historical') return 6;
      if (item.step === 'diagnosis') return 7;
      if (item.step === 'pr_create') return 9;
      return 2; // Default to 2 if recon or unknown
    };

    const streamProcess = () => {
      let madeProgress = false;
      const currentStage = currentStageInternal;

      // Handle unified streaming (interleaved)
      const logIdx = logQueue.findIndex(l => getStageIndex(l) <= currentStage);
      const dialIdx = dialogueQueue.findIndex(d => getStageIndex(d) <= currentStage);
      
      if (logIdx !== -1 && dialIdx !== -1) {
         // Both are available. Pick one randomly or alternate, let's alternate based on length or just pick log first then dialogue
         // Actually, let's pick log 60% of time if both are available to keep them mixed
         if (Math.random() > 0.4) {
            const nextLog = logQueue.splice(logIdx, 1)[0];
            currentLogs = [...currentLogs, nextLog];
            setStreamingLogs(currentLogs);
         } else {
            const nextDial = dialogueQueue.splice(dialIdx, 1)[0];
            currentDialogues = [...currentDialogues, nextDial];
            setStreamingDialogues(currentDialogues);
         }
         madeProgress = true;
      } else if (logIdx !== -1) {
         const nextLog = logQueue.splice(logIdx, 1)[0];
         currentLogs = [...currentLogs, nextLog];
         setStreamingLogs(currentLogs);
         madeProgress = true;
      } else if (dialIdx !== -1) {
         const nextDial = dialogueQueue.splice(dialIdx, 1)[0];
         currentDialogues = [...currentDialogues, nextDial];
         setStreamingDialogues(currentDialogues);
         madeProgress = true;
      }

      // Append backend data as soon as fetch completes (so they can be streamed according to currentStage)
      if (fetchCompleted && !backendAppended && finalRunResult) {
        const backendLogs = (finalRunResult as any).logs || [];
        const backendDialogues = (finalRunResult as any).agentDialogues || [];
        const remainingLogs = backendLogs.filter((log: any) => 
           !log.message.includes("Detect Anomaly") && 
           !log.message.includes("Detecting anomaly") &&
          !log.message.includes("Bootstrapping OpsPilot")
        );
        const remainingDialogues = backendDialogues.filter((dial: any) => 
           dial.id !== 'bootstrap-d1' && 
           dial.content !== dialogueQueue[0]?.content
        );
        if (remainingLogs.length > 0 || remainingDialogues.length > 0) {
          logQueue.push(...remainingLogs);
          dialogueQueue.push(...remainingDialogues);
        }
        backendAppended = true;
        // Attempt to process again immediately now that queues are populated
        if (!madeProgress && logQueue.findIndex(l => getStageIndex(l) <= currentStageInternal) !== -1) {
           setTimeout(streamProcess, 0);
           return;
        }
      }

      // If queues are currently empty (or nothing is ready for this stage) but timeline/fetch is still running, inject holding logs
      if (!madeProgress && (!fetchCompleted || !timelineCompleted)) {
        ticksSinceLastHolding++;
        if (ticksSinceLastHolding >= 4) {
          const nextHolding = holdingPool[holdingIndex % holdingPool.length];
          holdingIndex++;
          currentLogs = [...currentLogs, {
            timestamp: new Date().toISOString(),
            level: nextHolding.level,
            message: nextHolding.message,
            step: nextHolding.step
          }];
          setStreamingLogs(currentLogs);
          ticksSinceLastHolding = 0;
        }
        setTimeout(streamProcess, 100);
        return;
      }

      if (madeProgress) {
        setTimeout(streamProcess, 100);
        return;
      }

      // If queues are empty and fetch is completed:
      if (logQueue.length === 0 && dialogueQueue.length === 0 && fetchCompleted) {
        if (fetchError) {
          currentLogs = [...currentLogs, {
            timestamp: new Date().toISOString(),
            level: 'error',
            message: `[System Error] OpsPilot investigation failed: ${fetchError}`,
            step: 'recon'
          }];
          setStreamingLogs(currentLogs);
          setIsChecking(false);
          if (alertId) {
            setGeneosAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'ACTIVE' } : a));
          }
          alert(`OpsPilot execution failed: ${fetchError}`);
          return;
        }

        if (finalRunResult) {
          const backendLogs = (finalRunResult as SanityCheckRun).logs || [];
          const backendDialogues = (finalRunResult as SanityCheckRun).agentDialogues || [];

          // Filter out duplicates
          const remainingLogs = backendLogs.filter(log => 
            !log.message.includes("Detect Anomaly") && 
            !log.message.includes("Detecting anomaly") &&
            !log.message.includes("Bootstrapping OpsPilot")
          );

          const remainingDialogues = backendDialogues.filter(dial => 
            dial.id !== 'bootstrap-d1' && 
            dial.content !== dialogueQueue[0]?.content
          );

          if (!timelineCompleted) {
            setTimeout(streamProcess, 100);
          } else {
            setIsChecking(false);
            const completedRun = {
              ...(finalRunResult as SanityCheckRun),
              logs: currentLogs,
              agentDialogues: currentDialogues
            };

            if (alertId) {
              const hasSourceCodeChange = !!completedRun.jiraIssueKey || !!completedRun.pullRequest;
              const newStatus = hasSourceCodeChange ? 'INVESTIGATING' : 'RESOLVED';
              
              fetch(`/api/geneos/alerts/${alertId}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
              });
              
              if (alertObj && !alertObj.mock) {
                const sysIdToClose = alertObj.incidentSysId || (alertObj.source === 'ServiceNow' ? alertObj.id : null);
                if (sysIdToClose) {
                  if (hasSourceCodeChange) {
                    // Do not close, add activity log
                    fetch(`/api/servicenow/incidents/${sysIdToClose}/comment`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ comments: `OpsPilot Investigation complete.\nSource code change is required. \nJira Issue created: ${completedRun.jiraIssueLink || 'N/A'}\n\nSummary: ${completedRun.executiveSummary}` })
                    });
                  } else {
                    // Close the incident
                    fetch(`/api/servicenow/incidents/${sysIdToClose}/close`, { method: 'POST' });
                  }
                }
              } else if (alertObj && alertObj.mock) {
                 console.log("Mock incident investigation completed.");
              }
            }

            fetch(`/api/sanity-checks/history/${completedRun.id}/update-results`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                logs: currentLogs,
                agentDialogues: currentDialogues
              })
            }).then(() => {
              fetchHistory();
            }).catch(err => {
              console.error("Failed to persist final run logs and dialogues:", err);
            });

            setActiveRun(completedRun);
            fetchGeneosAlerts();
          }
        } else {
          setIsChecking(false);
          fetchHistory();
          fetchGeneosAlerts();
        }
      } else {
        setTimeout(streamProcess, 100);
      }
    };

    streamProcess();
  };

  const handleExecuteRemediation = async (remediation: any) => {
    if (!activeRun) return;
    setExecutingRemediation(remediation.title);
    try {
      const res = await fetch('/api/remediations/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: remediation.command,
          service: remediation.service,
          title: remediation.title,
          alertId: activeRun.geneosAlertId,
          runId: activeRun.id
        })
      });
      if (res.ok) {
        fetchHistory();
        fetchGeneosAlerts();
        setActiveRun(prev => {
          if (!prev) return null;
          const newLogs = [
            ...prev.logs,
            {
              timestamp: new Date().toISOString(),
              level: 'success' as const,
              message: `[RegOps Exec] Manual execution APPROVED for action: "${remediation.title}"`,
              step: 'remediation' as const
            },
            {
              timestamp: new Date().toISOString(),
              level: 'success' as const,
              message: `[RegOps Exec] Executed gcloud terminal command successfully on cluster network.`,
              step: 'remediation' as const
            },
            {
              timestamp: new Date().toISOString(),
              level: 'success' as const,
              message: `[RegOps Exec] Validation check: PASSED. Systems reconciled.`,
              step: 'verification' as const
            }
          ];
          return {
            ...prev,
            overallStatus: 'HEALTHY',
            overallHealthScore: 100,
            currentStep: 'completed',
            logs: newLogs
          };
        });
      }
    } catch (err) {
      console.error("Remediation execution failed:", err);
    } finally {
      setExecutingRemediation(null);
    }
  };

  
  const handleCreateJiraIssue = async () => {
    if (!activeRun || activeRun.jiraIssueKey) return;
    try {
      const res = await fetch(`/api/sanity-checks/run/${activeRun.id}/create-jira`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        fetchHistory();
        setActiveRun(prev => prev ? {
          ...prev,
          jiraIssueKey: data.key,
          jiraIssueLink: data.link
        } : null);
        if (data.link) {
          window.open(data.link, '_blank');
        }
      } else {
        const errData = await res.json();
        alert('Failed to create Jira issue: ' + (errData.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Network error while creating Jira issue');
    }
  };

  const handlePRAction = async (status: 'APPROVED' | 'DECLINED') => {
    if (!activeRun) return;
    try {
      const res = await fetch(`/api/pull-requests/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId: activeRun.id, status })
      });
      if (res.ok) {
        const data = await res.json();
        fetchHistory();
        fetchGeneosAlerts();
        setActiveRun(prev => prev ? { 
          ...prev, 
          pullRequest: data.pullRequest,
          overallStatus: status === 'APPROVED' ? 'HEALTHY' : prev.overallStatus,
          overallHealthScore: status === 'APPROVED' ? 100 : prev.overallHealthScore,
          currentStep: status === 'APPROVED' ? 'completed' : prev.currentStep
        } : null);
      }
    } catch (err) {
      console.error("Failed to approve Pull Request:", err);
    }
  };

  if (!currentUser) {
    return <AuthSection onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen hero-gradient text-black font-display antialiased selection:bg-indigo-600/30 selection:text-blue-200 flex flex-col justify-between">
      
      {/* HEADER Ticker & Logout controls */}
      <Header 
        currentUser={currentUser} 
        handleLogout={handleLogout} 
        currentTime={currentTime} 
        backendError={backendError} 
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        {backendError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-sm text-red-600">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
            <div className="text-left">
              <h4 className="font-semibold text-gray-900">Server Connection Error</h4>
              <p className="text-gray-600 mt-1">{backendError}</p>
              <button 
                onClick={() => { setBackendError(null); fetchApplications(); }}
                className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-red-700 hover:text-gray-900 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Connection
              </button>
            </div>
          </div>
        )}

        {/* TOP LEVEL NAVIGATION TABS */}
        <div className="flex border-b border-gray-200 mb-6 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('scopes')}
            className={`px-4 py-3 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'scopes'
                ? 'border-indigo-500 text-indigo-600 bg-indigo-500/5 font-bold'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Server className="w-4 h-4" />
            App Scopes
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-4 py-3 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'alerts'
                ? 'border-indigo-500 text-indigo-600 bg-indigo-500/5 font-bold'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            Active Alerts Grid
            {geneosAlerts.filter(a => a.status === 'ACTIVE').length > 0 && (
              <span className="px-1.5 py-0.2 bg-red-500/20 text-red-600 text-[10px] rounded-full border border-red-500/10 font-mono font-bold animate-pulse">
                {geneosAlerts.filter(a => a.status === 'ACTIVE').length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('investigation')}
            className={`px-4 py-3 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'investigation'
                ? 'border-indigo-500 text-indigo-600 bg-indigo-500/5 font-bold'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Terminal className="w-4 h-4" />
            OpsPilot Investigation Space
            {isChecking && <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />}
          </button>
          
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-3 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'history'
                ? 'border-indigo-500 text-indigo-600 bg-indigo-500/5 font-bold'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4" />
            Incident Vault ({history.length})
          </button>
          

        </div>

        {/* MAIN BODY LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT 4 COLS: TARGET CONFIGURATIONS */}
            {activeTab === 'scopes' && (
            <section className="lg:col-span-12 space-y-6 text-left">
              
              {/* Target App Profiles list */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-300 pb-2">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-gray-600" />
                    <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">RegOps App Scopes</h2>
                  </div>
                  <button
                    id="add-app-btn"
                    onClick={() => { setEditingApp(undefined); setShowForm(true); }}
                    className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-blue-700 transition-colors py-1 px-2 rounded-lg cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add App
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => {
                        setSelectedApp(app);
                        const latest = history.find(h => h.applicationId === app.id);
                        if (latest) setActiveRun(latest);
                      }}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-all duration-200 group flex items-start gap-3 ${
                        selectedApp?.id === app.id
                          ? 'bg-indigo-600/5 border-indigo-500/30'
                          : 'bg-white hover:bg-white/50 border-gray-200'
                      }`}
                    >
                      <div className={`p-1.5 rounded-md mt-0.5 ${selectedApp?.id === app.id ? 'bg-indigo-500/15 text-indigo-600' : 'bg-white text-gray-600'}`}>
                        <Layers className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0 font-mono text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                            {app.name}
                          </h3>
                        </div>
                        <p className="text-[10px] text-gray-600 truncate mt-0.5">{app.url}</p>
                        
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 text-[9px] text-gray-500">
                          <span>Platform: <strong className="text-gray-600 font-display">{app.deploymentPlatform || 'Unknown'}</strong></span>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingApp(app);
                                setShowForm(true);
                              }}
                              className="text-indigo-600 hover:text-gray-900 cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={(e) => handleDeleteApp(app.id, e)}
                              className="text-red-500 hover:text-red-600 cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedApp && (
                  <div className="pt-2 border-t border-gray-300 space-y-2">
                    <div className="bg-white p-3 rounded-lg border border-gray-200 text-xs font-mono space-y-2">
                      <div className="text-gray-600">
                        <strong>App URL:</strong> {selectedApp.url}
                      </div>
                      <div className="text-gray-600">
                        <strong>Deployment:</strong> {selectedApp.deploymentPlatform}
                      </div>
                      <div className="text-gray-600">
                        <strong>Probes configured:</strong> {selectedApp.checkEndpoints.length}
                      </div>
                      <p className="text-[11px] text-gray-500 border-t border-gray-200 pt-1.5 leading-relaxed font-display">{selectedApp.description}</p>
                    </div>



                    <button
                      onClick={() => handleLaunchAgent()}
                      disabled={isChecking || applications.length === 0}
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 active:scale-98 disabled:opacity-40 text-white cursor-pointer transition-all"
                    >
                      {isChecking ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Running Incident Workgroup...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current" />
                          Diagnose System Outage
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* SRE safety rules index guidelines card */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 text-xs font-mono space-y-3.5 shadow-md">
                <h3 className="font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-300 pb-2">
                  <AlertOctagon className="w-4 h-4 text-indigo-600" />
                  RegOps Safety Rules
                </h3>
                <div className="space-y-2 text-gray-600 leading-relaxed font-display">
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center font-mono font-bold text-[9px] shrink-0 mt-0.5">G</span>
                    <div>
                      <strong className="text-emerald-600">GREEN Class Rules:</strong> Automated recovery commands run without prompt.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded bg-amber-100 text-amber-700 flex items-center justify-center font-mono font-bold text-[9px] shrink-0 mt-0.5">A</span>
                    <div>
                      <strong className="text-amber-600">AMBER Class Rules:</strong> High-risk configurations. Requires explicit RegOps click approval.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded bg-red-100 text-red-700 flex items-center justify-center font-mono font-bold text-[9px] shrink-0 mt-0.5">R</span>
                    <div>
                      <strong className="text-red-600">RED Class Rules:</strong> Prohibited automation. Hard blocker. Requires senior DBA signature.
                    </div>
                  </div>
                </div>
              </div>
            </section>
            )}

            {/* RIGHT 8 COLS: ACTIVE TABS SWITCH */}
            <section className="lg:col-span-12 space-y-6">
              
              {activeTab === 'alerts' && (
                <GeneosAlertsGrid 
                  geneosAlerts={geneosAlerts}
                  setActiveTab={setActiveTab}
                  handleLaunchAgent={handleLaunchAgent}
                  handleOpenIncident={handleOpenIncident}
                  addGeneosAlert={(alert) => setGeneosAlerts(prev => [alert, ...prev])}
                />
              )}

              {activeTab === 'investigation' && (
                <IncidentLifecycle 
                  activeRun={activeRun}
                  isChecking={isChecking}
                  currentUser={currentUser}
                  currentStepIndex={currentStepIndex}
                  streamingDialogues={streamingDialogues}
                  streamingLogs={streamingLogs}
                  executingRemediation={executingRemediation}
                  handleExecuteRemediation={handleExecuteRemediation}
                  handlePRAction={handlePRAction}
                  handleCreateJiraIssue={handleCreateJiraIssue}
                />
              )}

              {activeTab === 'servicenow' && (
                <ServiceNowTab />
              )}
              {activeTab === 'history' && (
                <>
                  {snowError && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs mb-4 border border-red-200">
                      <strong>ServiceNow Sync Error:</strong> {snowError}
                      <br/>
                      <span className="text-[10px] opacity-80">Check your ServiceNow OAuth scopes. "Access to unscoped api is not allowed" means your token is restricted from accessing the global Incident table.</span>
                    </div>
                  )}
                <IncidentVault 
                  history={history}
                  applications={applications}
                  setSelectedApp={setSelectedApp}
                  setActiveRun={setActiveRun}
                  setActiveTab={setActiveTab}
                  handleDeleteHistory={handleDeleteHistory}
                />
                </>
              )}

            </section>
          </div>
      </main>

      {/* FOOTER */}
      <Footer />

      {/* MODAL CONFIG */}
      {showForm && (
        <ApplicationForm
          application={editingApp}
          onSave={handleSaveApp}
          onClose={() => setShowForm(false)}
        />
      )}

    </div>
  );
}
