const fs = require('fs');
let code = fs.readFileSync('src/components/IncidentLifecycle.tsx', 'utf8');

// Replace UI labels for Developer Mistake
code = code.replace(
  'OpsPilot Source Code Remediation Review',
  'OpsPilot Suggested Code Changes'
);

code = code.replace(
  /<strong className="text-gray-600">PR ID:<\/strong> <span className="text-gray-900 font-display font-semibold">#\{activeRun.pullRequest.id\}<\/span>/g,
  '<strong className="text-gray-600">Suggestion ID:</strong> <span className="text-gray-900 font-display font-semibold">#{activeRun.pullRequest.id}</span>'
);

code = code.replace(
  /⧖ PR WAITING FOR REVIEW/g,
  '⧖ WAITING FOR JIRA CREATION'
);

// We need to remove the PR action buttons if they exist, but the Jira button is replacing it anyway
// Let's check where handlePRAction is called.

fs.writeFileSync('src/components/IncidentLifecycle.tsx', code);
