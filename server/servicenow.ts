import express from "express";
import axios from "axios";
import { loadHistory } from "./incidentsDb";

export const serviceNowRouter = express.Router();

const INSTANCE_URL = "https://dev214684.service-now.com";
const CLIENT_ID = "755f8d3137ac456ca10b8f90ac96ed98";

// Helper to get auth headers. 
// Uses Basic auth if admin password is provided (bypasses unscoped token issues),
// otherwise falls back to Bearer token.
const getAuthHeaders = () => {
    const adminPassword = process.env.SNOW_ADMIN_PASSWORD;
    const accessToken = process.env.SNOW_ACCESS_TOKEN;
    
    if (adminPassword) {
        const base64 = Buffer.from(`admin:${adminPassword}`).toString('base64');
        return {
            'Authorization': `Basic ${base64}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    } else if (accessToken) {
        return {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }
    return null;
};

// Log a New Incident
serviceNowRouter.post("/incidents", async (req, res) => {
    const headers = getAuthHeaders();
    if (!headers) {
        return res.status(400).json({ error: "ServiceNow credentials not configured in secrets." });
    }

    try {
        const payload = req.body;
        // Basic Incident format
        const response = await axios.post(`${INSTANCE_URL}/api/now/table/incident`, payload, {
            headers
        });
        return res.json(response.data);
    } catch (error: any) {
        
        return res.status(error.response?.status || 500).json({ error: "Failed to create incident in ServiceNow", details: error.response?.data || error.message });
    }
});

// Fetch Incidents
serviceNowRouter.get("/incidents", async (req, res) => {
    const headers = getAuthHeaders();
    if (!headers) {
        return res.status(400).json({ error: "ServiceNow credentials not configured in secrets." });
    }

    const { category, subcategory, active, priority, state, limit } = req.query;
    
    let queryParts = [];
    if (category) queryParts.push(`category=${category}`);
    if (subcategory) queryParts.push(`subcategory=${subcategory}`);
    if (active) queryParts.push(`active=${active}`);
    if (priority) queryParts.push(`priority=${priority}`);
    if (state) queryParts.push(`state=${state}`);

    const sysparm_query = queryParts.length > 0 ? queryParts.join('^') : 'ORDERBYDESCsys_created_on';
    
    try {
        const response = await axios.get(`${INSTANCE_URL}/api/now/table/incident`, {
            headers,
            params: {
                sysparm_query,
                sysparm_fields: "number,short_description,state,priority,category,subcategory,sys_created_on,sys_id,description,urgency,impact",
                sysparm_display_value: "true",
                sysparm_limit: limit || 50
            }
        });
        return res.json(response.data);
    } catch (error: any) {
        return res.status(error.response?.status || 500).json({ error: "Failed to fetch incidents from ServiceNow", details: error.response?.data || error.message });
    }
});

// Get Categories / Choices
serviceNowRouter.get("/choices", async (req, res) => {
    const headers = getAuthHeaders();
    if (!headers) {
        return res.status(400).json({ error: "ServiceNow credentials not configured in secrets." });
    }

    const { element } = req.query; // e.g. category, subcategory
    
    try {
        const response = await axios.get(`${INSTANCE_URL}/api/now/table/sys_choice`, {
            headers,
            params: {
                sysparm_query: `name=incident^element=${element || 'category'}`,
                sysparm_fields: "value,label"
            }
        });
        return res.json(response.data);
    } catch (error: any) {
        return res.status(error.response?.status || 500).json({ error: "Failed to fetch choices from ServiceNow", details: error.response?.data || error.message });
    }
});

// Route to export local history to ServiceNow
serviceNowRouter.post("/export", async (req, res) => {
    const headers = getAuthHeaders();
    if (!headers) {
        return res.status(400).json({ error: "ServiceNow credentials not configured in secrets." });
    }

    try {
        const history = loadHistory();
        const exported = [];

        for (const incident of history) {
            const payload = {
                short_description: `Applet Incident: ${incident.applicationName} - ${incident.overallStatus}`,
                description: `Executive Summary: ${incident.executiveSummary || 'N/A'}\n\nID: ${incident.id}\nScore: ${incident.overallHealthScore}\n\nLogs:\n${incident.logs?.map((l: any) => l.message).join('\n') || ''}`,
                state: "7", // Closed
                category: "Software",
                close_notes: incident.remediationTaken || "Closed by System",
                close_code: "Solution provided"
            };

            const snowRes = await axios.post(`${INSTANCE_URL}/api/now/table/incident`, payload, {
                headers
            });
            exported.push(snowRes.data.result);
        }

        return res.json({ success: true, count: exported.length, exported });
    } catch (error: any) {
        return res.status(error.response?.status || 500).json({ error: "Failed to export incidents", details: error.response?.data || error.message });
    }
});

// Route to fetch closed incidents for vault
serviceNowRouter.get("/fetch-closed-incidents", async (req, res) => {
    const headers = getAuthHeaders();
    
    if (!headers) {
        // Fallback to local history if ServiceNow is not configured
        return res.json(loadHistory());
    }

    const query = `state=7^short_descriptionLIKEApplet Incident`;
    const fields = "number,short_description,description,state,priority,assigned_to,resolved_at,close_code,close_notes,category,subcategory,sys_id,sys_created_on";
    
    try {
        const response = await axios.get(`${INSTANCE_URL}/api/now/table/incident`, {
            headers,
            params: {
                sysparm_query: query,
                sysparm_fields: fields,
                sysparm_display_value: "true",
                sysparm_limit: 100
            }
        });

        const incidents = response.data.result || [];
        
        // Map ServiceNow incidents to our SanityCheckRun format
        const mappedHistory = incidents.map((inc: any) => {
            // Extract info from description if possible
            const idMatch = inc.description?.match(/ID:\s*(.+)/);
            const scoreMatch = inc.description?.match(/Score:\s*(\d+)/);
            const execMatch = inc.description?.match(/Executive Summary:\s*(.+)/);
            
            return {
                id: inc.sys_id || (idMatch ? idMatch[1] : inc.number),
                applicationId: "snow-imported",
                applicationName: inc.short_description?.replace('Applet Incident: ', '').split(' - ')[0] || "Unknown App",
                applicationUrl: INSTANCE_URL,
                timestamp: inc.sys_created_on || inc.resolved_at || new Date().toISOString(),
                overallHealthScore: scoreMatch ? parseInt(scoreMatch[1]) : 100,
                overallStatus: inc.short_description?.includes('CRITICAL') ? 'CRITICAL' : (inc.short_description?.includes('WARNING') ? 'WARNING' : 'HEALTHY'),
                latencyAvg: 0,
                endpointsCheckedCount: 0,
                endpointsPassedCount: 0,
                logs: [],
                results: [],
                executiveSummary: execMatch ? execMatch[1] : inc.description,
                remediationTaken: inc.close_notes || '',
                triggeredBy: 'ServiceNow Import'
            };
        });

        return res.json(mappedHistory);

    } catch (error: any) {
        return res.status(error.response?.status || 500).json({ error: "Failed to fetch from ServiceNow" });
    }
});


serviceNowRouter.post("/incidents/:sys_id/close", async (req, res) => {
    const headers = getAuthHeaders();
    if (!headers) {
        return res.status(400).json({ error: "ServiceNow credentials not configured in secrets." });
    }
    try {
        const { sys_id } = req.params;
        const payload = {
            state: "7", // Closed
            close_notes: "Closed by OpsPilot investigation",
            close_code: "Solution provided"
        };
        const response = await axios.put(`${INSTANCE_URL}/api/now/table/incident/${sys_id}`, payload, {
            headers
        });
        return res.json(response.data);
    } catch (error: any) {
        return res.status(error.response?.status || 500).json({ error: "Failed to close incident in ServiceNow", details: error.response?.data || error.message });
    }
});

serviceNowRouter.post("/incidents/:sys_id/comment", async (req, res) => {
    const headers = getAuthHeaders();
    if (!headers) {
        return res.status(400).json({ error: "ServiceNow credentials not configured in secrets." });
    }
    try {
        const { sys_id } = req.params;
        const { comments } = req.body;
        const payload = {
            work_notes: comments
        };
        const response = await axios.put(`${INSTANCE_URL}/api/now/table/incident/${sys_id}`, payload, {
            headers
        });
        return res.json(response.data);
    } catch (error: any) {
        return res.status(error.response?.status || 500).json({ error: "Failed to comment on incident", details: error.response?.data || error.message });
    }
});
