'use client';
import { useState, useEffect } from 'react';

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    fetch('/api/logs')
      .then(res => res.json())
      .then(d => {
        setLogs(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const filteredLogs = filter === 'ALL' ? logs : logs.filter(l => l.action.includes(filter));

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-6 min-h-[calc(100vh-6rem)] relative">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[var(--color-primary)]">System Activity Logs</h1>
        
        <select 
          className="input-field max-w-[200px]" 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="ALL">All Actions</option>
          <option value="ASSET">Assets</option>
          <option value="ALLOCATED">Allocations</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="AUDIT">Audits</option>
        </select>
      </div>

      <div className="card p-0 flex flex-col flex-1 bg-white overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading logs...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="p-4 font-semibold text-gray-700">Timestamp</th>
                  <th className="p-4 font-semibold text-gray-700">User</th>
                  <th className="p-4 font-semibold text-gray-700">Action</th>
                  <th className="p-4 font-semibold text-gray-700">Details</th>
                  <th className="p-4 font-semibold text-gray-700">Target ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-400">No activity logs found.</td>
                  </tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-sm text-gray-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4 font-medium text-gray-800">
                        {log.user ? log.user.name : <span className="text-gray-400 italic">System</span>}
                      </td>
                      <td className="p-4">
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold font-mono">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600 text-sm">{log.details}</td>
                      <td className="p-4 text-gray-400 text-xs font-mono">{log.target}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
