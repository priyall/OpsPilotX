const fs = require('fs');
let code = fs.readFileSync('src/components/IncidentLifecycle.tsx', 'utf8');

const targetStr = `                  {!activeRun.jiraIssueKey && (activeRun.jiraIssueDraft || activeRun.pullRequest) && (
                    <button
                      onClick={() => handleCreateJiraIssue()}
                      className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md hover:shadow-blue-500/10 active:scale-95 transition-all cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Create Jira Issue for these changes
                    </button>
                  )}`;

const newStr = `                  {!activeRun.jiraIssueKey && !!activeRun.pullRequest && (!activeRun.remediations || activeRun.remediations.length === 0) && (
                    <button
                      onClick={() => handleCreateJiraIssue()}
                      className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md hover:shadow-blue-500/10 active:scale-95 transition-all cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Create Jira Issue for these changes
                    </button>
                  )}`;

code = code.replace(targetStr, newStr);

fs.writeFileSync('src/components/IncidentLifecycle.tsx', code);
