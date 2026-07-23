const fs = require('fs');
let code = fs.readFileSync('server/jira.ts', 'utf8');

const targetStr = `jiraRouter.get("/auth", (req, res) => {`;
const newStr = `jiraRouter.get("/status", (req, res) => {
    res.json({ connected: !!jiraToken && !!jiraCloudId });
});

jiraRouter.get("/auth", (req, res) => {`;

code = code.replace(targetStr, newStr);

fs.writeFileSync('server/jira.ts', code);
