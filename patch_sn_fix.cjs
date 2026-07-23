const fs = require('fs');
let code = fs.readFileSync('src/components/ServiceNowTab.tsx', 'utf8');

const mockData = `
const mockIncidents = [
  { sys_id: 'mock1', number: 'INC0000001', short_description: 'Network timeout in zone A', category: 'network', priority: '1 - Critical', state: 'New', sys_created_on: new Date().toISOString() },
  { sys_id: 'mock2', number: 'INC0000002', short_description: 'Database deadlock in transaction processor', category: 'database', priority: '2 - High', state: 'In Progress', sys_created_on: new Date(Date.now() - 3600000).toISOString() },
  { sys_id: 'mock3', number: 'INC0000003', short_description: 'User login failures spiking', category: 'authentication', priority: '2 - High', state: 'New', sys_created_on: new Date(Date.now() - 7200000).toISOString() },
  { sys_id: 'mock4', number: 'INC0000004', short_description: 'API Gateway returning 502s', category: 'software', priority: '1 - Critical', state: 'In Progress', sys_created_on: new Date(Date.now() - 14400000).toISOString() }
];`;

if (!code.includes('mockIncidents = [')) {
  code = code.replace(`export function ServiceNowTab() {`, mockData + `\nexport function ServiceNowTab() {`);
}

fs.writeFileSync('src/components/ServiceNowTab.tsx', code);
