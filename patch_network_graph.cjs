const fs = require('fs');
let code = fs.readFileSync('src/components/IncidentLifecycle.tsx', 'utf8');

const targetStr = `function AgentNetworkGraph({ activeAgentId }: { activeAgentId: string | null }) {
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
            <div className={\`flex items-center gap-1.5 px-2.5 py-1.5 border rounded-lg text-[9px] uppercase tracking-wider font-bold transition-all duration-300 \${isActive ? n.bgClass + ' shadow-lg scale-110 ' + n.shadowClass : 'bg-white border-gray-200 text-gray-400 scale-100'}\`}>
              <n.icon className={\`w-3.5 h-3.5 \${isActive ? n.textClass : 'text-gray-400'}\`} />
              <span className={isActive ? n.textClass : ''}>{n.name}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}`;

const newStr = `function AgentNetworkGraph({ 
  activeAgentId, 
  logs, 
  dialogues 
}: { 
  activeAgentId: string | null;
  logs: AgentLog[];
  dialogues: AgentDialogueMessage[];
}) {
  const nodes = [
    { id: 'alice', name: 'Alice', role: 'Network & Routing', icon: Network, cx: 50, cy: 15, color: '#0ea5e9', textClass: 'text-sky-700', bgClass: 'bg-sky-50 border-sky-300', shadowClass: 'shadow-sky-500/40' },
    { id: 'bob', name: 'Bob', role: 'Database & Storage', icon: Database, cx: 12, cy: 45, color: '#f59e0b', textClass: 'text-amber-700', bgClass: 'bg-amber-50 border-amber-300', shadowClass: 'shadow-amber-500/40' },
    { id: 'charlie', name: 'Charlie', role: 'Code Archaeology', icon: Code, cx: 28, cy: 85, color: '#a855f7', textClass: 'text-purple-700', bgClass: 'bg-purple-50 border-purple-300', shadowClass: 'shadow-purple-500/40' },
    { id: 'david', name: 'David', role: 'Compliance & RegOps', icon: Shield, cx: 72, cy: 85, color: '#3b82f6', textClass: 'text-blue-700', bgClass: 'bg-blue-50 border-blue-300', shadowClass: 'shadow-blue-500/40' },
    { id: 'ethan', name: 'Ethan', role: 'History & Runbooks', icon: Book, cx: 88, cy: 45, color: '#10b981', textClass: 'text-emerald-700', bgClass: 'bg-emerald-50 border-emerald-300', shadowClass: 'shadow-emerald-500/40' }
  ];

  // Derive interaction sequence
  const combined: { type: string, agent: string, time: number, msg: string }[] = [];
  logs.forEach((l, idx) => {
     const match = l.message.match(/\\[(Alice|Bob|Charlie|David|Ethan)\\s/i);
     if (match) {
        combined.push({ type: 'log', agent: match[1].toLowerCase(), time: new Date(l.timestamp).getTime() + idx, msg: l.message.replace(/\\[.*?\\]\\s*/, '') });
     }
  });
  dialogues.forEach((d, idx) => {
    combined.push({ type: 'dial', agent: d.agentId, time: new Date(d.timestamp).getTime() + idx, msg: d.content });
  });
  combined.sort((a, b) => a.time - b.time);

  const edges = [];
  let recentMsgObj = null;
  
  if (combined.length > 0) {
    recentMsgObj = combined[combined.length - 1];
    
    // Create animated edges for recent interactions
    for (let i = Math.max(0, combined.length - 4); i < combined.length - 1; i++) {
       edges.push({ from: combined[i].agent, to: combined[i+1].agent });
    }
  }

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden flex items-center justify-center min-h-[300px]">
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        {nodes.map((n1, i) => 
          nodes.map((n2, j) => {
            if (i < j) {
              const isRecentEdge = edges.some(e => (e.from === n1.id && e.to === n2.id) || (e.from === n2.id && e.to === n1.id));
              const isActive = activeAgentId === n1.id || activeAgentId === n2.id;
              
              let strokeColor = '#f1f5f9';
              let strokeWidth = "0.3";
              let opacity = "0.4";
              let dasharray = "none";
              let animate = false;
              
              if (isRecentEdge) {
                strokeColor = n1.id === activeAgentId ? n1.color : (n2.id === activeAgentId ? n2.color : '#cbd5e1');
                strokeWidth = "0.6";
                opacity = "0.8";
                dasharray = "4 2";
                animate = true;
              } else if (isActive) {
                strokeColor = activeAgentId === n1.id ? n1.color : n2.color;
                strokeWidth = "0.4";
                opacity = "0.6";
              }

              return (
                <g key={n1.id + '-' + n2.id}>
                  <line x1={n1.cx} y1={n1.cy} x2={n2.cx} y2={n2.cy} stroke={strokeColor} strokeWidth={strokeWidth} opacity={opacity} strokeDasharray={dasharray} className="transition-all duration-500">
                    {animate && (
                      <animate attributeName="stroke-dashoffset" values="12;0" dur="1s" repeatCount="indefinite" />
                    )}
                  </line>
                </g>
              );
            }
            return null;
          })
        )}
      </svg>
      {nodes.map(n => {
        const isActive = activeAgentId === n.id;
        const isSpeaking = recentMsgObj && recentMsgObj.agent === n.id;
        
        return (
          <div key={n.id} className="absolute flex flex-col items-center justify-center transition-all duration-500 z-10" style={{ top: n.cy + '%', left: n.cx + '%', transform: 'translate(-50%, -50%)' }}>
            
            {/* Speech Bubble */}
            {isSpeaking && (
              <div className="absolute bottom-full mb-3 w-48 p-2 bg-gray-900 text-white text-[10px] leading-tight rounded-lg shadow-xl animate-fade-in-up pointer-events-none z-20">
                <div className="line-clamp-2">{recentMsgObj.msg}</div>
                <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-gray-900 rotate-45"></div>
              </div>
            )}

            <div className={\`flex flex-col items-center justify-center gap-1.5 px-3 py-2 border rounded-xl shadow-sm transition-all duration-300 \${isActive ? n.bgClass + ' shadow-xl scale-110 ' + n.shadowClass : 'bg-white border-gray-200 text-gray-500 scale-100 hover:scale-105'}\`}>
              <div className={\`p-1.5 rounded-full \${isActive ? 'bg-white shadow-sm' : 'bg-gray-50'}\`}>
                <n.icon className={\`w-4 h-4 \${isActive ? n.textClass : 'text-gray-400'}\`} />
              </div>
              <div className="flex flex-col items-center text-center">
                <span className={\`text-[10px] uppercase tracking-widest font-black \${isActive ? n.textClass : 'text-gray-600'}\`}>{n.name}</span>
                <span className={\`text-[8px] font-medium tracking-wide \${isActive ? n.textClass + ' opacity-80' : 'text-gray-400'}\`}>{n.role}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}`;

code = code.replace(targetStr, newStr);

const callerTarget = `<AgentNetworkGraph activeAgentId={activeAgentId} />`;
const callerNew = `<AgentNetworkGraph activeAgentId={activeAgentId} logs={logs} dialogues={dialogues} />`;
code = code.replace(callerTarget, callerNew);

fs.writeFileSync('src/components/IncidentLifecycle.tsx', code);
