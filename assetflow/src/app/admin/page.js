'use client';
import { useState, useEffect } from 'react';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('departments'); // departments, categories, employees
  
  // Data states
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [deptRes, catRes, empRes] = await Promise.all([
        fetch('/api/departments', { cache: 'no-store' }),
        fetch('/api/categories', { cache: 'no-store' }),
        fetch('/api/users', { cache: 'no-store' })
      ]);
      
      const [deptData, catData, empData] = await Promise.all([
        deptRes.ok ? deptRes.json() : [],
        catRes.ok ? catRes.json() : [],
        empRes.ok ? empRes.json() : []
      ]);
      
      setDepartments(Array.isArray(deptData) ? deptData : []);
      setCategories(Array.isArray(catData) ? catData : []);
      setEmployees(Array.isArray(empData) ? empData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const headId = e.target.headId.value;
    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, headId })
      });
      if (res.ok) {
        setShowDeptModal(false);
        fetchData();
      } else alert('Failed to create department');
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        setShowCatModal(false);
        fetchData();
      } else alert('Failed to create category');
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        fetchData(); // Refresh to show new role
      } else alert('Failed to update role');
    } catch (err) {
      console.error(err);
    }
  };

  const [showEmpModal, setShowEmpModal] = useState(false);

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(formData))
      });
      const data = await res.json();
      if (res.ok) {
        setShowEmpModal(false);
        fetchData();
        alert('Employee provisioned successfully!');
      } else alert(data.error || 'Failed to provision employee');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEmployee = async (userId, name) => {
    if (!confirm(`Are you sure you want to permanently delete ${name}?`)) return;
    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        fetchData();
      } else {
        alert(data.error || 'Failed to delete employee');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDepartment = async (deptId, name) => {
    if (!confirm(`Are you sure you want to delete the ${name} department?`)) return;
    try {
      const res = await fetch(`/api/departments/${deptId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        fetchData();
      } else {
        alert(data.error || 'Failed to delete department');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (catId, name) => {
    if (!confirm(`Are you sure you want to delete the ${name} category?`)) return;
    try {
      const res = await fetch(`/api/categories/${catId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        fetchData();
      } else {
        alert(data.error || 'Failed to delete category');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto h-[calc(100vh-4rem)] flex flex-col">
      <h1 className="text-3xl font-bold mb-8 text-[var(--color-primary)]">Organization Setup</h1>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {['departments', 'categories', 'employees'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium text-sm capitalize transition-colors border-b-2 ${
              activeTab === tab 
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-500">Loading data...</div>
      ) : (
        <div className="flex-1 overflow-auto bg-white rounded-lg shadow-sm border border-gray-200">
          
          {/* DEPARTMENTS TAB */}
          {activeTab === 'departments' && (
            <div>
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="font-semibold text-lg">Departments</h2>
                <button onClick={() => setShowDeptModal(true)} className="btn-primary text-sm py-1.5 px-4">Add Department</button>
              </div>
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
                  <tr><th className="p-4 font-medium">Name</th><th className="p-4 font-medium">Status</th><th className="p-4 font-medium">Created</th><th className="p-4 font-medium">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {departments.length === 0 ? <tr><td colSpan="3" className="p-8 text-center text-gray-400">No departments found</td></tr> : 
                    departments.map(d => (
                      <tr key={d.id} className="hover:bg-gray-50/50">
                        <td className="p-4 font-medium">{d.name}</td>
                        <td className="p-4"><span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-bold tracking-wide">{d.status}</span></td>
                        <td className="p-4 text-sm text-gray-500">{new Date(d.createdAt).toLocaleDateString()}</td>
                        <td className="p-4">
                          <button onClick={() => handleDeleteDepartment(d.id, d.name)} className="text-red-500 hover:text-red-700 p-1" title="Delete Department">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          )}

          {/* CATEGORIES TAB */}
          {activeTab === 'categories' && (
            <div>
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="font-semibold text-lg">Asset Categories</h2>
                <button onClick={() => setShowCatModal(true)} className="btn-primary text-sm py-1.5 px-4">Add Category</button>
              </div>
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
                  <tr><th className="p-4 font-medium">Name</th><th className="p-4 font-medium">Created</th><th className="p-4 font-medium">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {categories.length === 0 ? <tr><td colSpan="2" className="p-8 text-center text-gray-400">No categories found</td></tr> : 
                    categories.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50/50">
                        <td className="p-4 font-medium">{c.name}</td>
                        <td className="p-4 text-sm text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                        <td className="p-4">
                          <button onClick={() => handleDeleteCategory(c.id, c.name)} className="text-red-500 hover:text-red-700 p-1" title="Delete Category">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          )}

          {/* EMPLOYEES TAB */}
          {activeTab === 'employees' && (
            <div>
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="font-semibold text-lg">Employee Directory & Roles</h2>
                <button onClick={() => setShowEmpModal(true)} className="btn-primary text-sm py-1.5 px-4">Provision Employee</button>
              </div>
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
                  <tr><th className="p-4 font-medium">Name</th><th className="p-4 font-medium">Email</th><th className="p-4 font-medium">Status</th><th className="p-4 font-medium">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {employees.map(e => (
                    <tr key={e.id} className="hover:bg-gray-50/50">
                      <td className="p-4 font-medium">{e.name}</td>
                      <td className="p-4 text-sm text-gray-600">{e.email}</td>
                      <td className="p-4"><span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-bold tracking-wide">{e.status}</span></td>
                      <td className="p-4 flex gap-2 items-center">
                        <select 
                          className="input-field py-1 px-2 text-sm max-w-[180px]"
                          value={e.role}
                          onChange={(ev) => handleRoleChange(e.id, ev.target.value)}
                        >
                          <option value="EMPLOYEE">Employee</option>
                          <option value="DEPT_HEAD">Department Head</option>
                          <option value="ASSET_MANAGER">Asset Manager</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                        <button 
                          onClick={() => handleDeleteEmployee(e.id, e.name)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Delete Employee"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* Modals */}
      {showDeptModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-lg mb-4">New Department</h3>
            <form onSubmit={handleCreateDepartment} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Department Name</label>
                <input name="name" className="input-field" placeholder="e.g. Engineering" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Assign Head</label>
                <select name="headId" className="input-field" required>
                  <option value="">Select a Department Head...</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.email})</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setShowDeptModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded">Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCatModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-lg mb-4">New Asset Category</h3>
            <form onSubmit={handleCreateCategory} className="flex flex-col gap-4">
              <input name="name" className="input-field" placeholder="e.g. Electronics" required />
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setShowCatModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded">Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEmpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-lg mb-4">Provision Employee</h3>
            <form onSubmit={handleCreateEmployee} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input name="name" className="input-field" placeholder="John Doe" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input name="email" type="email" className="input-field" placeholder="john@company.com" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Initial Password</label>
                <input name="password" type="password" className="input-field" placeholder="••••••••" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Initial Role</label>
                <select name="role" className="input-field" required>
                  <option value="EMPLOYEE">Employee</option>
                  <option value="DEPT_HEAD">Department Head</option>
                  <option value="ASSET_MANAGER">Asset Manager</option>
                  <option value="ADMIN">System Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setShowEmpModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded">Cancel</button>
                <button type="submit" className="btn-primary">Provision</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
