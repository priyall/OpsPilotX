import fs from 'fs';
import path from 'path';
import axios from 'axios';

const SNOW_INSTANCE_URL = "https://dev214684.service-now.com";
const ACCESS_TOKEN = process.env.SNOW_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error("SNOW_ACCESS_TOKEN is not set.");
  process.exit(1);
}

const dbFile = path.join(process.cwd(), "db_incidents.json");
const data = JSON.parse(fs.readFileSync(dbFile, 'utf8'));

async function exportIncidents() {
  for (const incident of data) {
    const payload = {
      short_description: `Applet Incident: ${incident.applicationName} - ${incident.overallStatus}`,
      description: `Executive Summary: ${incident.executiveSummary || 'N/A'}\n\nID: ${incident.id}\nScore: ${incident.overallHealthScore}\n\nLogs:\n${incident.logs.map((l: any) => l.message).join('\n')}`,
      state: "7", // Closed
      category: "Software",
      close_notes: incident.remediationTaken || "Closed by System",
      close_code: "Solved (Permanently)"
    };
    try {
      const res = await axios.post(`${SNOW_INSTANCE_URL}/api/now/table/incident`, payload, {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      console.log(`Exported ${incident.id} -> ${res.data.result.number}`);
    } catch (e: any) {
      console.error(`Failed to export ${incident.id}: ${e.response?.status} - ${JSON.stringify(e.response?.data)}`);
    }
  }
}

exportIncidents();
