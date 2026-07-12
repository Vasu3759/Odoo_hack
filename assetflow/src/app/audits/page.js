'use client';
import { useState, useEffect } from 'react';

export default function AuditsPage() {
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Verification UI State
  const [selectedCycle, setSelectedCycle] = useState(null);

  useEffect(() => {
    fetchAudits();
  }, []);

  const fetchAudits = async () => {
    try {
      const res = await fetch('/api/audits');
      const data = await res.json();
      setCycles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCycle = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      const res = await fetch('/api/audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          scope: formData.get('scope'),
          startDate: formData.get('startDate'),
          endDate: formData.get('endDate'),
        })
      });
      if (res.ok) {
        setShowModal(false);
        fetchAudits();
      } else alert('Failed to create audit cycle');
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloseCycle = async (id) => {
    if (!confirm('Are you sure you want to close this audit? Discrepancies (Missing assets) will be permanently marked as LOST in the registry.')) return;
    try {
      const res = await fetch(`/api/audits/${id}`, { method: 'PUT' });
      if (res.ok) {
        setSelectedCycle(null);
        fetchAudits();
      } else alert('Failed to close audit');
    } catch (err) {
      console.error(err);
    }
  };

  const updateItemStatus = async (itemId, status) => {
    try {
      const res = await fetch(`/api/audits/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        // Optimistic UI update
        const updatedItems = selectedCycle.items.map(item => 
          item.id === itemId ? { ...item, status } : item
        );
        setSelectedCycle({ ...selectedCycle, items: updatedItems });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-8 min-h-[calc(100vh-6rem)] relative">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[var(--color-primary)]">Audit Cycles</h1>
        {!selectedCycle && (
          <button onClick={() => setShowModal(true)} className="btn-primary">New Audit Cycle</button>
        )}
      </div>

      {selectedCycle ? (
        // VERIFICATION INTERFACE
        <div className="card p-0 flex flex-col flex-1 bg-white overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div>
              <button onClick={() => setSelectedCycle(null)} className="text-gray-500 hover:text-gray-800 text-sm mb-2 flex items-center gap-1">
                ← Back to Cycles
              </button>
              <h2 className="text-xl font-bold text-[var(--color-primary)]">{selectedCycle.name} <span className="text-sm font-normal text-gray-500">({selectedCycle.scope})</span></h2>
            </div>
            {selectedCycle.status === 'OPEN' && (
              <button onClick={() => handleCloseCycle(selectedCycle.id)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-semibold transition-colors">
                Complete & Close Audit
              </button>
            )}
          </div>
          
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 font-semibold text-gray-700">Asset Tag</th>
                <th className="p-4 font-semibold text-gray-700">Asset Name</th>
                <th className="p-4 font-semibold text-gray-700">Verification Status</th>
                <th className="p-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {selectedCycle.items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-mono text-sm">{item.asset.tag}</td>
                  <td className="p-4 font-medium">{item.asset.name}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      item.status === 'VERIFIED' ? 'bg-green-100 text-green-800' :
                      item.status === 'MISSING' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-4 flex gap-2">
                    {selectedCycle.status === 'OPEN' && (
                      <>
                        <button onClick={() => updateItemStatus(item.id, 'VERIFIED')} className="text-xs px-3 py-1 bg-gray-100 hover:bg-green-100 text-green-700 border border-transparent hover:border-green-300 rounded transition-colors">Verify</button>
                        <button onClick={() => updateItemStatus(item.id, 'DAMAGED')} className="text-xs px-3 py-1 bg-gray-100 hover:bg-orange-100 text-orange-700 border border-transparent hover:border-orange-300 rounded transition-colors">Flag Damaged</button>
                        <button onClick={() => updateItemStatus(item.id, 'MISSING')} className="text-xs px-3 py-1 bg-gray-100 hover:bg-red-100 text-red-700 border border-transparent hover:border-red-300 rounded transition-colors">Mark Missing</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        // CYCLE LIST INTERFACE
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <p className="text-gray-500">Loading cycles...</p>
          ) : cycles.length === 0 ? (
            <div className="col-span-full p-12 text-center border border-dashed rounded-lg text-gray-400 bg-white">
              No audit cycles created yet.
            </div>
          ) : (
            cycles.map(cycle => (
              <div key={cycle.id} className="card p-6 border-t-4 hover:shadow-md cursor-pointer transition-shadow" style={{ borderTopColor: cycle.status === 'OPEN' ? 'var(--color-primary)' : 'var(--color-success)' }} onClick={() => setSelectedCycle(cycle)}>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg text-gray-800">{cycle.name}</h3>
                  <span className={`px-2 py-1 text-xs font-bold rounded ${cycle.status === 'OPEN' ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-600'}`}>
                    {cycle.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">Scope: <strong>{cycle.scope}</strong></p>
                <p className="text-sm text-gray-600 mb-4">
                  {new Date(cycle.startDate).toLocaleDateString()} - {new Date(cycle.endDate).toLocaleDateString()}
                </p>
                
                {/* Progress bar logic (naive) */}
                <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                  <span>{cycle.items.length} Assets in scope</span>
                  {cycle.status === 'CLOSED' && (
                     <span className="text-red-500 ml-auto">{cycle.items.filter(i => i.status === 'MISSING').length} Missing</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Cycle Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">✕</button>
            <h2 className="text-xl font-bold mb-4 text-[var(--color-primary)]">Initiate Audit Cycle</h2>
            <form onSubmit={handleCreateCycle} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Cycle Name</label>
                <input name="name" type="text" className="input-field" placeholder="e.g. Q3 Organization-wide Audit" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Scope</label>
                <input name="scope" type="text" className="input-field" placeholder="e.g. All Departments" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <input name="startDate" type="date" className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <input name="endDate" type="date" className="input-field" required />
                </div>
              </div>
              
              <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded border border-blue-100">
                This will capture a snapshot of all active assets in the database for verification.
              </div>
              
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary w-full bg-gray-100 text-gray-700 py-2 rounded">Cancel</button>
                <button type="submit" className="btn-primary w-full">Start Cycle</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
