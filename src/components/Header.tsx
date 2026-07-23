import React, { useState, useEffect } from 'react';
import { Terminal, Clock } from 'lucide-react';

interface HeaderProps {
  currentUser: { id: string; name: string; role: string; avatar: string } | null;
  handleLogout: () => void;
  currentTime: string;
  backendError: string | null;
}

export default function Header({ currentUser, handleLogout, currentTime, backendError }: HeaderProps) {
  const [jiraConnected, setJiraConnected] = useState(false);
  
  useEffect(() => {
    const checkJira = async () => {
      try {
        const res = await fetch('/api/jira/status');
        const data = await res.json();
        setJiraConnected(data.connected);
      } catch (e) {
        // ignore
      }
    };
    
    checkJira();
    const interval = setInterval(checkJira, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600/10 border border-indigo-500/20 rounded-xl">
            <Terminal className="w-6 h-6 text-indigo-600 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-left">
              <span className="font-mono text-xs font-bold tracking-widest text-gray-500 uppercase">Enterprise</span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
              <h1 className="text-sm font-bold tracking-wider text-gray-900 uppercase">OpsPilot X</h1>
              <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 rounded uppercase">RegOps AI Suite</span>
            </div>
            <p className="text-xs text-gray-600 font-mono mt-0.5 text-left">Autonomous Production Support Engineer • Interconnected Agents</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <button
            onClick={() => { if (!jiraConnected) window.open('/api/jira/auth', '_blank') }}
            disabled={jiraConnected}
            className={`flex items-center gap-1.5 px-3 py-1.5 ${jiraConnected ? 'bg-green-600 cursor-default' : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'} text-white rounded-lg transition-colors shadow-sm ${jiraConnected ? 'shadow-green-500/20' : 'shadow-blue-500/20'} font-sans font-semibold`}
            title="Authenticate Jira (3LO) to enable OpsPilot to create tickets autonomously"
          >
            {jiraConnected ? 'Jira Connected' : 'Connect Jira'}
          </button>
          {currentUser && (
            <div className="flex items-center gap-2 px-2 py-1 bg-white border border-gray-200 rounded-lg">
              <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                {currentUser.avatar}
              </div>
              <div className="flex flex-col text-[10px] text-left">
                <span className="font-semibold text-gray-900 leading-tight">{currentUser.name}</span>
                <span className="text-[8px] text-gray-600 leading-none truncate max-w-[120px]">{currentUser.role}</span>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 pl-2 border-l border-gray-300 text-[10px] text-gray-500 hover:text-red-600 font-display cursor-pointer transition-colors"
              >
                Logout
              </button>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-800">
            <Clock className="w-3.5 h-3.5 text-gray-600" />
            <span>UTC: {currentTime.replace('T', ' ').substring(0, 19)}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg">
            <div className={`w-2 h-2 rounded-full ${backendError ? 'bg-red-500 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
            <span className="text-gray-800">{backendError ? 'Offline' : 'Ready'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
