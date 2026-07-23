import React, { useState, useEffect } from 'react';
import { RefreshCw, ExternalLink, Activity, PlusCircle, AlertOctagon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';


const mockIncidents = [
  { sys_id: 'mock1', number: 'INC0000001', short_description: 'Network timeout in zone A', category: 'network', priority: '1 - Critical', state: 'New', sys_created_on: new Date().toISOString() },
  { sys_id: 'mock2', number: 'INC0000002', short_description: 'Database deadlock in transaction processor', category: 'database', priority: '2 - High', state: 'In Progress', sys_created_on: new Date(Date.now() - 3600000).toISOString() },
  { sys_id: 'mock3', number: 'INC0000003', short_description: 'User login failures spiking', category: 'authentication', priority: '2 - High', state: 'New', sys_created_on: new Date(Date.now() - 7200000).toISOString() },
  { sys_id: 'mock4', number: 'INC0000004', short_description: 'API Gateway returning 502s', category: 'software', priority: '1 - Critical', state: 'In Progress', sys_created_on: new Date(Date.now() - 14400000).toISOString() }
];
export function ServiceNowTab() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // New Incident Form State
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newIncident, setNewIncident] = useState({
    short_description: '',
    description: '',
    category: 'network',
    subcategory: '',
    urgency: '3',
    impact: '3'
  });

  const fetchIncidents = async () => {
    setLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch('/api/servicenow/incidents?limit=20', { signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setIncidents(data.result || []);
    } catch (err: any) {
      setError('ServiceNow unavailable (fallback mock data displayed)');
      setIncidents(mockIncidents);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/servicenow/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIncident)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setShowForm(false);
      setNewIncident({
        short_description: '',
        description: '',
        category: 'network',
        subcategory: '',
        urgency: '3',
        impact: '3'
      });
      fetchIncidents();
    } catch (err: any) {
      setError(err.message || 'Failed to create incident');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 font-mono flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            ServiceNow Incidents
          </h2>
          <p className="text-xs text-gray-500 font-mono mt-1">Live sync from dev214684.service-now.com</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md transition-colors border border-indigo-200 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Log Incident
          </button>
          <button
            onClick={fetchIncidents}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md transition-colors border border-gray-300 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-xs border border-red-200 font-mono">
          <strong className="flex items-center gap-2 text-sm mb-1"><AlertOctagon className="w-4 h-4" /> Sync Error</strong>
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm font-mono text-xs">
          <h3 className="font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Create New Incident</h3>
          <form onSubmit={handleCreateIncident} className="space-y-4">
            <div>
              <label className="block text-gray-600 font-semibold mb-1">Short Description</label>
              <input
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                value={newIncident.short_description}
                onChange={e => setNewIncident({...newIncident, short_description: e.target.value})}
                placeholder="e.g. Database connection failing"
              />
            </div>
            
            <div>
              <label className="block text-gray-600 font-semibold mb-1">Detailed Description</label>
              <textarea
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none transition-colors min-h-[80px]"
                value={newIncident.description}
                onChange={e => setNewIncident({...newIncident, description: e.target.value})}
                placeholder="Provide details about the issue..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-600 font-semibold mb-1">Category</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:bg-white"
                  value={newIncident.category}
                  onChange={e => setNewIncident({...newIncident, category: e.target.value})}
                >
                  <option value="network">Network</option>
                  <option value="software">Software</option>
                  <option value="hardware">Hardware</option>
                  <option value="database">Database</option>
                  <option value="inquiry">Inquiry</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-600 font-semibold mb-1">Subcategory</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:bg-white"
                  value={newIncident.subcategory}
                  onChange={e => setNewIncident({...newIncident, subcategory: e.target.value})}
                  placeholder="e.g. email, vpn, oracle"
                />
              </div>
              <div>
                <label className="block text-gray-600 font-semibold mb-1">Urgency</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:bg-white"
                  value={newIncident.urgency}
                  onChange={e => setNewIncident({...newIncident, urgency: e.target.value})}
                >
                  <option value="1">1 - High</option>
                  <option value="2">2 - Medium</option>
                  <option value="3">3 - Low</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-600 font-semibold mb-1">Impact</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:bg-white"
                  value={newIncident.impact}
                  onChange={e => setNewIncident({...newIncident, impact: e.target.value})}
                >
                  <option value="1">1 - High</option>
                  <option value="2">2 - Medium</option>
                  <option value="3">3 - Low</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <button 
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2 cursor-pointer"
              >
                {submitting ? 'Creating...' : 'Submit Incident'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && incidents.length === 0 ? (
        <div className="py-12 text-center text-gray-500 font-mono text-sm flex flex-col items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          Loading incidents from ServiceNow...
        </div>
      ) : incidents.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm font-mono text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase tracking-wider text-[10px]">
                  <th className="p-3 font-semibold w-24">Number</th>
                  <th className="p-3 font-semibold">Short Description</th>
                  <th className="p-3 font-semibold w-24">State</th>
                  <th className="p-3 font-semibold w-24">Priority</th>
                  <th className="p-3 font-semibold w-32">Category</th>
                  <th className="p-3 font-semibold w-32">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {incidents.map((inc, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-3 font-bold text-indigo-600">
                      <a href={`https://dev214684.service-now.com/nav_to.do?uri=incident.do?sys_id=${inc.sys_id}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:underline">
                        {inc.number} <ExternalLink className="w-3 h-3 opacity-50" />
                      </a>
                    </td>
                    <td className="p-3 text-gray-900 truncate max-w-[200px]" title={inc.short_description}>
                      {inc.short_description}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inc.state === '7' ? 'bg-emerald-100 text-emerald-700' :
                        inc.state === '6' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {inc.state === '1' ? 'New' : 
                         inc.state === '2' ? 'In Progress' :
                         inc.state === '3' ? 'On Hold' :
                         inc.state === '6' ? 'Resolved' :
                         inc.state === '7' ? 'Closed' : `State: ${inc.state}`}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inc.priority === '1' ? 'bg-red-100 text-red-700' :
                        inc.priority === '2' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        P{inc.priority}
                      </span>
                    </td>
                    <td className="p-3 text-gray-500 capitalize">{inc.category} {inc.subcategory && `> ${inc.subcategory}`}</td>
                    <td className="p-3 text-gray-400">
                      {inc.sys_created_on ? formatDistanceToNow(new Date(inc.sys_created_on), { addSuffix: true }) : 'Unknown'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : !error && (
        <div className="py-12 text-center text-gray-500 font-mono text-sm border border-dashed border-gray-300 rounded-xl bg-gray-50">
          No incidents found in ServiceNow.
        </div>
      )}
    </div>
  );
}
