const fs = require('fs');
let code = fs.readFileSync('src/components/Header.tsx', 'utf8');

const importTarget = `import React from 'react';`;
const importNew = `import React, { useState, useEffect } from 'react';`;
code = code.replace(importTarget, importNew);

const funcTarget = `export default function Header({ currentUser, handleLogout, currentTime, backendError }: HeaderProps) {`;
const funcNew = `export default function Header({ currentUser, handleLogout, currentTime, backendError }: HeaderProps) {
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
`;
code = code.replace(funcTarget, funcNew);

const btnTarget = `          <button
            onClick={() => window.open('/api/jira/auth', '_blank')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer shadow-sm shadow-blue-500/20 font-sans font-semibold"
            title="Authenticate Jira (3LO) to enable OpsPilot to create tickets autonomously"
          >
            Connect Jira
          </button>`;
          
const btnNew = `          <button
            onClick={() => window.open('/api/jira/auth', '_blank')}
            className={\`flex items-center gap-1.5 px-3 py-1.5 \${jiraConnected ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg transition-colors cursor-pointer shadow-sm \${jiraConnected ? 'shadow-green-500/20' : 'shadow-blue-500/20'} font-sans font-semibold\`}
            title="Authenticate Jira (3LO) to enable OpsPilot to create tickets autonomously"
          >
            {jiraConnected ? 'Jira Connected' : 'Connect Jira'}
          </button>`;
          
code = code.replace(btnTarget, btnNew);

fs.writeFileSync('src/components/Header.tsx', code);
