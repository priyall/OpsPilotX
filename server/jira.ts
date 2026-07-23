import axios from 'axios';

let jiraToken: string | null = null;
let jiraCloudId: string | null = null;
let jiraCloudUrl: string | null = null;

export function buildAdfDoc(description: string, suggestions: string, pullRequest?: any) {
    const content: any[] = [];

    if (description && description.trim()) {
        content.push({
            type: "paragraph",
            content: [{ type: "text", text: description.trim() }]
        });
    }

    if (pullRequest) {
        content.push({
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "OpsPilot Suggested Code Changes" }]
        });

        const metaContent: any[] = [
            { type: "text", text: "Suggestion ID: ", marks: [{ type: "strong" }] },
            { type: "text", text: `#${pullRequest.id || 'N/A'}` }
        ];

        if (pullRequest.repository) {
            metaContent.push(
                { type: "hardBreak" },
                { type: "text", text: "Repository: ", marks: [{ type: "strong" }] },
                { type: "text", text: pullRequest.repository }
            );
        }

        if (pullRequest.title) {
            metaContent.push(
                { type: "hardBreak" },
                { type: "text", text: "Title: ", marks: [{ type: "strong" }] },
                { type: "text", text: pullRequest.title }
            );
        }

        if (pullRequest.description) {
            metaContent.push(
                { type: "hardBreak" },
                { type: "text", text: "Description: ", marks: [{ type: "strong" }] },
                { type: "text", text: pullRequest.description }
            );
        }

        content.push({
            type: "paragraph",
            content: metaContent
        });

        if (Array.isArray(pullRequest.filesChanged) && pullRequest.filesChanged.length > 0) {
            pullRequest.filesChanged.forEach((file: any) => {
                content.push({
                    type: "heading",
                    attrs: { level: 3 },
                    content: [{ type: "text", text: `File: ${file.filename || 'Code Change'} (+${file.additions || 0} / -${file.deletions || 0})` }]
                });

                if (file.originalCode) {
                    content.push({
                        type: "paragraph",
                        content: [{ type: "text", text: "Original Code (John Doe's Mistake):", marks: [{ type: "strong" }] }]
                    });
                    content.push({
                        type: "codeBlock",
                        attrs: { language: "text" },
                        content: [{ type: "text", text: file.originalCode }]
                    });
                }

                if (file.modifiedCode) {
                    content.push({
                        type: "paragraph",
                        content: [{ type: "text", text: "Corrected Code (David's Repair):", marks: [{ type: "strong" }] }]
                    });
                    content.push({
                        type: "codeBlock",
                        attrs: { language: "text" },
                        content: [{ type: "text", text: file.modifiedCode }]
                    });
                }
            });
        }
    }

    if (suggestions && suggestions.trim()) {
        content.push({
            type: "heading",
            attrs: { level: 3 },
            content: [{ type: "text", text: "Agent Notes & Guidance" }]
        });
        content.push({
            type: "paragraph",
            content: [{ type: "text", text: suggestions.trim() }]
        });
    }

    if (content.length === 0) {
        content.push({
            type: "paragraph",
            content: [{ type: "text", text: "OpsPilot Incident Ticket Created" }]
        });
    }

    return {
        type: "doc",
        version: 1,
        content
    };
}

export const createJiraIssue = async (
    summary: string, 
    description: string, 
    suggestions: string,
    pullRequest?: any
) => {
    console.log("Creating Jira issue using actual Jira credentials.");
    const adfDoc = buildAdfDoc(description, suggestions, pullRequest);
    
    // First, try basic auth which works out of the box with an API token
    const clientId = process.env.JIRA_CLIENT_ID;
    const clientSecret = process.env.JIRA_SECRET;
    
    if (clientId && clientId.includes('@') && clientSecret) {
        // Likely basic auth (email + api token)
        try {
            const domain = process.env.JIRA_DOMAIN || 'your-domain.atlassian.net';
            const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
            const response = await axios.post(`https://${domain}/rest/api/3/issue`, {
                fields: {
                    project: { key: process.env.JIRA_PROJECT_KEY || "OPSPILOT" },
                    summary: summary,
                    description: adfDoc,
                    issuetype: { name: "Task" }
                }
            }, {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json'
                }
            });
            return {
                id: response.data.id,
                key: response.data.key,
                self: response.data.self,
                link: `https://${domain}/browse/${response.data.key}`
            };
        } catch (e: any) {
            console.log("Jira API Exception (handled)");
            throw e;
        }
    }
    
    // If we have an OAuth token
    if (jiraToken && jiraCloudId) {
        try {
            let projectKey = "OPSPILOT";
            try {
                const pRes = await axios.get(`https://api.atlassian.com/ex/jira/${jiraCloudId}/rest/api/3/project`, {
                    headers: { 'Authorization': `Bearer ${jiraToken}` }
                });
                if (pRes.data && pRes.data.length > 0) {
                    const opsProject = pRes.data.find(p => p.name && p.name.toLowerCase().includes('ops pilot'));
                    if (opsProject) {
                        projectKey = opsProject.key;
                    } else {
                        projectKey = pRes.data[0].key;
                    }
                }
            } catch (pe) {
                console.log("Failed to fetch projects:", pe.message);
            }

            const response = await axios.post(`https://api.atlassian.com/ex/jira/${jiraCloudId}/rest/api/3/issue`, {
                fields: {
                    project: { key: projectKey },
                    summary: summary,
                    description: adfDoc,
                    issuetype: { name: "Task" }
                }
            }, {
                headers: {
                    'Authorization': `Bearer ${jiraToken}`,
                    'Content-Type': 'application/json'
                }
            });
            return {
                id: response.data.id,
                key: response.data.key,
                self: response.data.self,
                link: `${jiraCloudUrl || "https://" + (process.env.JIRA_DOMAIN || "your-domain.atlassian.net")}/browse/${response.data.key}`
            };
        } catch (e: any) {
            console.log("Jira OAuth API Exception (handled)");
            throw e;
        }
    }

    console.warn("No valid Jira credentials or OAuth token found, falling back to mock.");
    const randomId = Math.floor(Math.random() * 1000);
    return { 
        id: "ENG-" + randomId, 
        key: "ENG-" + randomId, 
        self: `https://jira.atlassian.com/browse/ENG-${randomId}`,
        link: `https://jira.atlassian.com/browse/ENG-${randomId}`
    };
}

import { Router } from 'express';
export const jiraRouter = Router();

jiraRouter.get("/status", (req, res) => {
    res.json({ connected: !!jiraToken && !!jiraCloudId });
});

jiraRouter.get("/auth", (req, res) => {
    const clientId = process.env.JIRA_CLIENT_ID;
    if (!clientId) {
        return res.status(400).send("JIRA_CLIENT_ID not configured");
    }
    const host = req.get('host');
    const protocol = req.protocol === 'http' && host.includes('localhost') ? 'http' : 'https';
    // For AI Studio proxy, it's always https for external URL. Wait, the frontend might be running behind proxy.
    // We'll trust X-Forwarded-Host if available.
    const fwdHost = req.get('x-forwarded-host') || host;
    const baseAppUrl = process.env.APP_URL || `${protocol}://${fwdHost}`;
    const redirectUri = encodeURIComponent(`${baseAppUrl}/api/jira/callback`);
    
    const scope = "read%3Ajira-work%20write%3Ajira-work%20read%3Ajira-user";
    const authUrl = `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${clientId}&scope=${scope}&redirect_uri=${redirectUri}&state=xyz123&response_type=code&prompt=consent`;
    
    res.redirect(authUrl);
});

jiraRouter.get("/callback", async (req, res) => {
    const { code, state, error } = req.query;
    if (error) {
        return res.status(400).send(`Auth failed: ${error}`);
    }
    
    const clientId = process.env.JIRA_CLIENT_ID;
    const clientSecret = process.env.JIRA_SECRET;
    
    const host = req.get('host');
    const protocol = req.protocol === 'http' && host.includes('localhost') ? 'http' : 'https';
    const fwdHost = req.get('x-forwarded-host') || host;
    const baseAppUrl = process.env.APP_URL || `${protocol}://${fwdHost}`;
    const redirectUri = `${baseAppUrl}/api/jira/callback`;
    
    try {
        const tokenRes = await axios.post('https://auth.atlassian.com/oauth/token', {
            grant_type: 'authorization_code',
            client_id: clientId,
            client_secret: clientSecret,
            code: code,
            redirect_uri: redirectUri
        });
        
        jiraToken = tokenRes.data.access_token;
        
        // Get cloud id
        const resourceRes = await axios.get('https://api.atlassian.com/oauth/token/accessible-resources', {
            headers: { Authorization: `Bearer ${jiraToken}` }
        });
        
        if (resourceRes.data && resourceRes.data.length > 0) {
            jiraCloudId = resourceRes.data[0].id;
            jiraCloudUrl = resourceRes.data[0].url;
            res.send("Jira OAuth successful! You can close this window and the agent can now create tickets.");
        } else {
            res.status(400).send("No Jira sites accessible for this user.");
        }
        
    } catch (e: any) {
        console.log("Jira OAuth Exception (handled)");
        res.status(500).send("Failed to complete Jira OAuth.");
    }
});

