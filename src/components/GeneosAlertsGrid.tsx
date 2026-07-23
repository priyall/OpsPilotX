import React from 'react';
import { Activity, Loader2, PlayCircle } from 'lucide-react';
import { GeneosAlert } from '../types';
import { ServiceNowSearchModal } from './ServiceNowSearchModal';
import { useState } from 'react';

interface GeneosAlertsGridProps {
  geneosAlerts: GeneosAlert[];
  setActiveTab: (tab: 'alerts' | 'investigation' | 'history' | 'mcp') => void;
  handleLaunchAgent: (associatedAppId: string | undefined, alertId: string, alertObj?: GeneosAlert) => void;
  handleOpenIncident: (alertId: string, alertData: GeneosAlert) => void;
  addGeneosAlert: (alert: GeneosAlert) => void;
}

export default function GeneosAlertsGrid({ geneosAlerts, setActiveTab, handleLaunchAgent, handleOpenIncident, addGeneosAlert }: GeneosAlertsGridProps) {
  const [showSnowModal, setShowSnowModal] = useState(false);

  
  const activeGeneosAlerts = geneosAlerts.filter(a => a.status !== 'RESOLVED');

  const getSeverityBadge = (severity: 'CRITICAL' | 'WARNING' | 'OK' | 'high' | 'medium' | 'low') => {
    const s = severity.toUpperCase();
    if (s === 'CRITICAL' || s === 'HIGH') {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 border border-red-500/20 rounded">CRITICAL</span>;
    } else if (s === 'WARNING' || s === 'MEDIUM') {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-500/20 rounded">WARNING</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-500/20 rounded">HEALTHY</span>;
  };

  const getPlatformBadge = (source?: string) => {
    const p = (source || 'Geneos').trim();
    if (p.toLowerCase() === 'grafana') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 rounded-md shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Grafana
        </span>
      );
    }
    if (p.toLowerCase() === 'prometheus') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 rounded-md shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Prometheus
        </span>
      );
    }
    if (p.toLowerCase() === 'datadog') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300 rounded-md shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          Datadog
        </span>
      );
    }
    if (p.toLowerCase() === 'servicenow') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-300 rounded-md shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
          ServiceNow
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300 rounded-md shadow-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        {p}
      </span>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm text-left animate-fade-in">
      <div className="flex items-center justify-between border-b border-gray-300 pb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4.5 h-4.5 text-red-500" />
          <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Active Alerts Grid</h2>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowSnowModal(true)} className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors cursor-pointer">Search ServiceNow</button>
          <span className="text-[10px] text-gray-600 font-mono">Unified Monitoring Engine (Grafana, Prometheus, Geneos, Datadog)</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-300 text-gray-600 font-mono">
              <th className="py-2 px-3">Incident #</th>
              <th className="py-2 px-3">Platform</th>
              <th className="py-2 px-3">System Name</th>
              <th className="py-2 px-3">Rule Name</th>
              <th className="py-2 px-3">Severity</th>
              <th className="py-2 px-3">Metrics Parameter</th>
              <th className="py-2 px-3">Breach Value</th>
              <th className="py-2 px-3 text-right">OpsPilot Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850 font-mono text-xs">
            {activeGeneosAlerts.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-500 font-mono text-xs italic">
                  No active alerts in Active Alerts Grid. All incidents resolved or clear.
                </td>
              </tr>
            ) : (
              activeGeneosAlerts.map((alert) => (
              <tr key={alert.id} className="hover:bg-gray-100/40 transition-colors">
                <td className="py-3.5 px-3">
                  {alert.mock ? (
                    <a 
                      href="#"
                      onClick={(e) => { e.preventDefault(); window.alert("This is a mock incident created as a fallback."); }}
                      className="text-indigo-600 hover:text-indigo-800 font-bold underline text-[10px]"
                    >
                      {alert.incidentNumber}
                    </a>
                  ) : alert.incidentNumber ? (
                    <a 
                      href={`https://dev214684.service-now.com/nav_to.do?uri=incident.do?sys_id=${alert.incidentSysId || alert.id}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 font-bold underline text-[10px]"
                    >
                      {alert.incidentNumber}
                    </a>
                  ) : alert.source === 'ServiceNow' && alert.id.length > 20 ? (
                    <a 
                      href={`https://dev214684.service-now.com/nav_to.do?uri=incident.do?sys_id=${alert.id}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 font-bold underline text-[10px]"
                    >
                      SNOW-IMPORTED
                    </a>
                  ) : (
                    <span className="text-gray-400 text-[10px] italic">Not Opened</span>
                  )}
                </td>
                <td className="py-3.5 px-3">
                  {getPlatformBadge(alert.source)}
                </td>
                <td className="py-3.5 px-3 text-gray-900 font-display font-semibold">{alert.systemName}</td>
                <td className="py-3.5 px-3 text-gray-800 font-mono">{alert.ruleName}</td>
                <td className="py-3.5 px-3">{getSeverityBadge(alert.severity)}</td>
                <td className="py-3.5 px-3 text-gray-600">{alert.parameter}</td>
                <td className="py-3.5 px-3 text-red-600 font-bold">{alert.value}</td>
                <td className="py-3.5 px-3 text-right">
                  {alert.status === 'INVESTIGATING' ? (
                    <button
                      onClick={() => setActiveTab('investigation')}
                      className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 rounded cursor-pointer animate-pulse"
                    >
                      <Loader2 className="w-3 h-3 animate-spin" />
                      WATCH CHAT
                    </button>
                  ) : alert.status === 'OPENING_INCIDENT' ? (
                    <button
                      disabled
                      className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded opacity-70 cursor-not-allowed"
                    >
                      <Loader2 className="w-3 h-3 animate-spin" />
                      OPENING...
                    </button>
                  ) : alert.incidentNumber || alert.id.length > 20 ? (
                    <button
                      onClick={() => handleLaunchAgent(alert.associatedAppId, alert.id, alert)}
                      className="inline-flex items-center gap-1 bg-red-600 hover:bg-red-500 text-white font-display text-[10px] font-bold py-1 px-2.5 rounded cursor-pointer transition-colors"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      INVESTIGATE
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenIncident(alert.id, alert)}
                      className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white font-display text-[10px] font-bold py-1 px-2.5 rounded cursor-pointer transition-colors"
                    >
                      OPEN INCIDENT
                    </button>
                  )}
                </td>
              </tr>
            ))
            )}
          </tbody>
        </table>
      </div>

      {showSnowModal && (
        <ServiceNowSearchModal
          onClose={() => setShowSnowModal(false)}
          onImport={(inc) => {
            const newAlert: GeneosAlert = {
              id: inc.sys_id,
              systemName: "ServiceNow Import",
              severity: inc.priority === '1' || inc.urgency === '1' ? 'CRITICAL' : 'WARNING',
              status: 'ACTIVE',
              ruleName: inc.short_description,
              parameter: inc.category,
              value: `State: ${inc.state}`,
              timestamp: inc.sys_created_on || new Date().toISOString(),
              source: 'ServiceNow',
              incidentNumber: inc.number,
              incidentSysId: inc.sys_id
            };
            addGeneosAlert(newAlert);
            setShowSnowModal(false);
          }}
        />
      )}
    </div>
  );
}
