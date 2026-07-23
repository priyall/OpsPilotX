const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `  const handleCreateJiraIssue = async () => {
    if (!activeRun) return;
    try {
      const res = await fetch(\`/api/sanity-checks/run/\${activeRun.id}/create-jira\`, {
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
      } else {
        const errData = await res.json();
        alert('Failed to create Jira issue: ' + (errData.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Network error while creating Jira issue');
    }
  };`;

const newStr = `  const handleCreateJiraIssue = async () => {
    if (!activeRun) return;
    try {
      const res = await fetch(\`/api/sanity-checks/run/\${activeRun.id}/create-jira\`, {
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
  };`;

code = code.replace(targetStr, newStr);

fs.writeFileSync('src/App.tsx', code);
