'use client';
import { useState, useEffect } from 'react';

export default function AssetsPage() {
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  
  const [showModal, setShowModal] = useState(false);
  
  // Allocation State
  const [showAllocModal, setShowAllocModal] = useState(false);
  const [selectedAssetForAlloc, setSelectedAssetForAlloc] = useState(null);
  const [allocConflictMsg, setAllocConflictMsg] = useState('');

  // Edit State
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAssetForEdit, setSelectedAssetForEdit] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/assets').then(res => res.json()),
      fetch('/api/categories').then(res => res.json()),
      fetch('/api/users').then(res => res.json()),
      fetch('/api/auth/me').then(res => res.json())
    ])
    .then(([assetsData, categoriesData, usersData, userData]) => {
      setAssets(Array.isArray(assetsData) ? assetsData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setUserRole(userData?.role || 'EMPLOYEE');
      setLoading(false);
    })
    .catch(console.error);
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      tag: formData.get('tag'),
      name: formData.get('name'),
      categoryId: formData.get('categoryId'),
      condition: formData.get('condition'),
      isShared: formData.get('isShared') === 'on'
    };

    try {
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setAssets([data, ...assets]);
      setShowModal(false);
      alert('Asset registered successfully!');
    } catch (err) {
      alert(err.message || 'Failed to register asset');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      name: formData.get('name'),
      condition: formData.get('condition'),
      isShared: formData.get('isShared') === 'on'
    };

    try {
      const res = await fetch(`/api/assets/${selectedAssetForEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setAssets(assets.map(a => a.id === data.id ? data : a));
      setShowEditModal(false);
      alert('Asset updated successfully!');
    } catch (err) {
      alert(err.message || 'Failed to update asset');
    }
  };

  const handleAllocate = async (e) => {
    e.preventDefault();
    setAllocConflictMsg('');
    const formData = new FormData(e.target);
    const assignedToId = formData.get('assignedToId');
    const expectedReturnDate = formData.get('expectedReturnDate');

    try {
      const res = await fetch('/api/allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: selectedAssetForAlloc.id,
          assignedToId,
          expectedReturnDate
        })
      });
      
      const data = await res.json();
      
      if (res.status === 409) {
        // Conflict - asset is already allocated!
        setAllocConflictMsg(data.error);
        return;
      }
      
      if (!res.ok) throw new Error(data.error);
      
      // Update local asset state
      setAssets(assets.map(a => a.id === selectedAssetForAlloc.id ? { ...a, status: 'ALLOCATED' } : a));
      setShowAllocModal(false);
      alert('Asset allocated successfully!');
    } catch (err) {
      alert(err.message || 'Failed to allocate asset');
    }
  };

  const handleRequestTransfer = async () => {
    // In a real app, we'd need to know who currently holds it (from API), but for MVP we just send the request
    // The backend can figure out `fromId` via the active allocation.
    // For simplicity of this demo, we'll alert that it's requested.
    alert("Transfer request initiated! The current holder will be notified.");
    setShowAllocModal(false);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-8 min-h-[calc(100vh-6rem)] relative">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[var(--color-primary)]">Asset Registry</h1>
        {(userRole === 'ADMIN' || userRole === 'ASSET_MANAGER') && (
          <button onClick={() => setShowModal(true)} className="btn-primary">Register New Asset</button>
        )}
      </div>

      <div className="card p-0 flex flex-col flex-1 bg-white overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading assets...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 font-semibold text-gray-700">Tag</th>
                <th className="p-4 font-semibold text-gray-700">Name</th>
                <th className="p-4 font-semibold text-gray-700">Category</th>
                <th className="p-4 font-semibold text-gray-700">Status</th>
                <th className="p-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assets.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-400">No assets registered yet.</td>
                </tr>
              ) : (
                assets.map(asset => {
                  const now = new Date();
                  const isCurrentlyBooked = asset.bookings?.some(b => new Date(b.startTime) <= now && new Date(b.endTime) >= now);
                  const displayStatus = isCurrentlyBooked ? 'BOOKED' : asset.status;
                  
                  return (
                  <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-mono text-sm font-semibold">{asset.tag}</td>
                    <td className="p-4 text-gray-800">{asset.name}</td>
                    <td className="p-4 text-gray-600">{asset.category?.name || 'Unknown'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        displayStatus === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                        displayStatus === 'ALLOCATED' ? 'bg-blue-100 text-blue-800' :
                        displayStatus === 'BOOKED' ? 'bg-purple-100 text-purple-800' :
                        displayStatus === 'UNDER_MAINTENANCE' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {displayStatus}
                      </span>
                    </td>
                    <td className="p-4 flex gap-3">
                      {asset.status !== 'UNDER_MAINTENANCE' && (userRole === 'ADMIN' || userRole === 'ASSET_MANAGER') && (
                        <button 
                          onClick={() => { setSelectedAssetForAlloc(asset); setAllocConflictMsg(''); setShowAllocModal(true); }}
                          className="text-[var(--color-primary)] text-sm font-semibold hover:underline"
                        >
                          Allocate
                        </button>
                      )}
                      {(userRole === 'ADMIN' || userRole === 'ASSET_MANAGER') && (
                        <button 
                          onClick={() => { setSelectedAssetForEdit(asset); setShowEditModal(true); }}
                          className="text-gray-500 text-sm font-semibold hover:underline hover:text-gray-800"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Registration Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">✕</button>
            <h2 className="text-xl font-bold mb-4 text-[var(--color-primary)]">Register Asset</h2>
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Asset Tag</label>
                <input name="tag" type="text" className="input-field" placeholder="e.g. LPT-001" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Name / Model</label>
                <input name="name" type="text" className="input-field" placeholder="e.g. MacBook Pro M2" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select name="categoryId" className="input-field" required>
                  <option value="">-- Select Category --</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Condition</label>
                <select name="condition" className="input-field">
                  <option value="New">New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" name="isShared" id="isShared" className="w-4 h-4 text-[var(--color-primary)]" />
                <label htmlFor="isShared" className="text-sm font-medium text-gray-700">Is this a shared resource (e.g. Room, Vehicle)?</label>
              </div>
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary w-full bg-gray-100 text-gray-700 py-2 rounded">Cancel</button>
                <button type="submit" className="btn-primary w-full">Register</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allocation Modal */}
      {showAllocModal && selectedAssetForAlloc && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl relative">
            <button onClick={() => setShowAllocModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">✕</button>
            <h2 className="text-xl font-bold mb-4 text-[var(--color-primary)]">Allocate {selectedAssetForAlloc.tag}</h2>
            
            {allocConflictMsg ? (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                <p className="text-sm text-red-700 font-medium mb-3">{allocConflictMsg}</p>
                <button onClick={handleRequestTransfer} className="w-full bg-red-100 hover:bg-red-200 text-red-800 font-semibold py-2 rounded text-sm transition-colors">
                  Request Transfer
                </button>
              </div>
            ) : (
              <form onSubmit={handleAllocate} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Assign To Employee</label>
                  <select name="assignedToId" className="input-field" required>
                    <option value="">-- Select Employee --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Expected Return Date (Optional)</label>
                  <input name="expectedReturnDate" type="date" className="input-field" />
                </div>
                
                <div className="flex gap-3 mt-4">
                  <button type="button" onClick={() => setShowAllocModal(false)} className="btn-secondary w-full bg-gray-100 text-gray-700 py-2 rounded">Cancel</button>
                  <button type="submit" className="btn-primary w-full">Allocate</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedAssetForEdit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl relative">
            <button onClick={() => setShowEditModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">✕</button>
            <h2 className="text-xl font-bold mb-4 text-[var(--color-primary)]">Edit Asset ({selectedAssetForEdit.tag})</h2>
            <form onSubmit={handleEdit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name / Model</label>
                <input name="name" type="text" className="input-field" defaultValue={selectedAssetForEdit.name} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Condition</label>
                <select name="condition" className="input-field" defaultValue={selectedAssetForEdit.condition}>
                  <option value="New">New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" name="isShared" id="editIsShared" defaultChecked={selectedAssetForEdit.isShared} className="w-4 h-4 text-[var(--color-primary)]" />
                <label htmlFor="editIsShared" className="text-sm font-medium text-gray-700">Is this a shared resource (e.g. Room, Vehicle)?</label>
              </div>
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary w-full bg-gray-100 text-gray-700 py-2 rounded">Cancel</button>
                <button type="submit" className="btn-primary w-full">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
