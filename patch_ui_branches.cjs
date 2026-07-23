const fs = require('fs');
let code = fs.readFileSync('src/components/IncidentLifecycle.tsx', 'utf8');

const targetStr = `                  <div>
                    <strong className="text-gray-600">Target branch:</strong> <span className="text-indigo-600">{activeRun.pullRequest.targetBranch}</span>
                  </div>
                  <div>
                    <strong className="text-gray-600">Source branch:</strong> <span className="text-purple-400">{activeRun.pullRequest.branch}</span>
                  </div>`;

code = code.replace(targetStr, '');

fs.writeFileSync('src/components/IncidentLifecycle.tsx', code);
