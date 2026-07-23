const fs = require('fs');
let code = fs.readFileSync('src/components/IncidentLifecycle.tsx', 'utf8');

const targetStr = `{!activeRun.jiraIssueKey && !!activeRun.pullRequest && (!activeRun.remediations || activeRun.remediations.length === 0) && (`;
const newStr = `{!activeRun.jiraIssueKey && !!activeRun.pullRequest && (`;

code = code.replace(targetStr, newStr);

fs.writeFileSync('src/components/IncidentLifecycle.tsx', code);
console.log("Replaced successfully!");
