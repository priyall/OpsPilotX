import React, { useState, useEffect } from 'react';
import { X, Search, Activity, Loader2 } from 'lucide-react';

interface ServiceNowSearchModalProps {
  onClose: () => void;
  onImport: (incident: any) => void;
}

export function ServiceNowSearchModal({ onClose, onImport }: ServiceNowSearchModalProps) {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/servicenow/incidents?limit=50');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setIncidents(data.result || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch incidents');
    } finally {
      setLoading(false);
    }
  };

  const filtered = incidents.filter(inc => 
    inc.short_description?.toLowerCase().includes(search.toLowerCase()) ||
    inc.number?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in font-mono">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-900">Search ServiceNow Incidents</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by ID or description..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-2">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-xs">Loading incidents...</span>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-8 text-xs">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="text-gray-500 text-center py-8 text-xs">No incidents found.</div>
          ) : (
            <div className="space-y-2">
              {filtered.map(inc => (
                <div key={inc.sys_id} className="bg-white p-3 rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-indigo-600">{inc.number}</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                        {inc.state === '7' ? 'Closed' : inc.state === '6' ? 'Resolved' : 'Active'}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        inc.priority === '1' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        P{inc.priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-800 font-semibold">{inc.short_description}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{inc.category} • {inc.sys_created_on}</p>
                  </div>
                  <button 
                    onClick={() => onImport(inc)}
                    className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded text-xs font-bold cursor-pointer"
                  >
                    Import Alert
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
