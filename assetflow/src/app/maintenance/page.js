'use client';
import { useState, useEffect } from 'react';

export default function MaintenancePage() {
  const [requests, setRequests] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/maintenance').then(res => res.json()),
      fetch('/api/assets').then(res => res.json()),
      fetch('/api/auth/me').then(res => res.json())
    ])
    .then(([requestsData, assetsData, userData]) => {
      setRequests(Array.isArray(requestsData) ? requestsData : []);
      setAssets(Array.isArray(assetsData) ? assetsData : []);
      setUserRole(userData?.role || 'EMPLOYEE');
      setLoading(false);
    })
    .catch(console.error);
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch('/api/maintenance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      if (res.ok) {
        setRequests(requests.map(r => r.id === id ? { ...r, status: newStatus } : r));
      } else {
        alert('Failed to update status');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRaiseRequest = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      assetId: formData.get('assetId'),
      description: formData.get('description'),
      priority: formData.get('priority')
    };

    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      // Need to attach asset object for UI immediately
      const assetObj = assets.find(a => a.id === data.assetId);
      setRequests([{ ...data, asset: assetObj }, ...requests]);
      setShowModal(false);
      alert('Maintenance request raised successfully!');
    } catch (err) {
      alert(err.message || 'Failed to raise request');
    }
  };

  const columns = ['PENDING', 'APPROVED', 'IN_PROGRESS', 'RESOLVED'];

  return (
    <div className="p-8 max-w-[1600px] mx-auto h-[calc(100vh-6rem)] flex flex-col relative">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-primary)]">Maintenance Kanban</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">Raise Request</button>
      </div>
      
      {loading ? (
        <p className="text-gray-500">Loading board...</p>
      ) : (
        <div className="flex gap-6 flex-1 overflow-x-auto pb-4 items-start">
          {columns.map(col => (
            <div key={col} className="flex flex-col min-w-[320px] w-full max-w-[400px] bg-gray-50 border border-gray-200 rounded-lg p-4 h-full">
              <h3 className="font-semibold text-lg mb-4 text-gray-700 border-b border-gray-200 pb-2">{col.replace('_', ' ')}</h3>
              
              <div className="flex flex-col gap-4 overflow-y-auto pr-2 pb-2">
                {requests.filter(r => r.status === col).map(req => (
                  <div key={req.id} className="card p-4 shadow-sm border-l-4 bg-white" style={{ borderLeftColor: col === 'RESOLVED' ? 'var(--color-success)' : col === 'PENDING' ? 'var(--color-warning)' : 'var(--color-primary)' }}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-gray-800">{req.asset?.name || req.asset?.tag || 'Unknown Asset'}</span>
                      <span className={`text-[10px] px-2 py-1 rounded-sm font-bold tracking-wider ${req.priority === 'HIGH' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                        {req.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{req.description}</p>
                    
                    {/* Action buttons based on current column */}
                    {(userRole === 'ADMIN' || userRole === 'ASSET_MANAGER') && (
                      <div className="flex gap-2 mt-auto">
                        {col === 'PENDING' && (
                          <button onClick={() => handleStatusChange(req.id, 'APPROVED')} className="btn-primary text-xs flex-1 py-1.5">Approve</button>
                        )}
                        {col === 'APPROVED' && (
                          <button onClick={() => handleStatusChange(req.id, 'IN_PROGRESS')} className="btn-secondary text-xs flex-1 py-1.5 bg-gray-100 text-gray-800 border border-gray-300 rounded hover:bg-gray-200">Start Work</button>
                        )}
                        {col === 'IN_PROGRESS' && (
                          <button onClick={() => handleStatusChange(req.id, 'RESOLVED')} className="btn-primary text-xs flex-1 py-1.5" style={{ backgroundColor: 'var(--color-success)' }}>Resolve</button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {requests.filter(r => r.status === col).length === 0 && (
                  <div className="text-center p-6 text-sm text-gray-400 border border-dashed border-gray-200 rounded">
                    No requests
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Raise Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">✕</button>
            <h2 className="text-xl font-bold mb-4 text-[var(--color-primary)]">Raise Maintenance Request</h2>
            <form onSubmit={handleRaiseRequest} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Select Asset</label>
                {assets.length === 0 ? (
                  <div className="text-sm text-red-500">No assets available.</div>
                ) : (
                  <select name="assetId" className="input-field" required>
                    <option value="">-- Choose an Asset --</option>
                    {assets.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.tag})</option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Issue Description</label>
                <textarea name="description" className="input-field min-h-[100px]" placeholder="Describe the issue in detail..." required></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select name="priority" className="input-field">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High (Urgent)</option>
                </select>
              </div>
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary w-full bg-gray-100 text-gray-700 py-2 rounded">Cancel</button>
                <button type="submit" className="btn-primary w-full" disabled={assets.length === 0}>Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
