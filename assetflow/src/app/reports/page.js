'use client';
import { useState, useEffect } from 'react';

export default function ReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  if (loading) return <div className="p-8 text-gray-500">Generating reports...</div>;
  if (!data) return <div className="p-8 text-red-500">Failed to load reports.</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[var(--color-primary)]">Reports & Analytics</h1>
        <button className="btn-secondary" onClick={() => window.print()}>Export PDF</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 flex flex-col gap-2 shadow-sm border border-gray-200">
          <span className="text-sm font-medium text-gray-500">Total Assets</span>
          <span className="text-4xl font-bold text-gray-900">{data.totalAssets}</span>
        </div>
        <div className="card p-6 flex flex-col gap-2 shadow-sm border border-gray-200">
          <span className="text-sm font-medium text-gray-500">Allocated Assets</span>
          <span className="text-4xl font-bold text-[var(--color-primary)]">
            {data.statusBreakdown.find(s => s.name === 'ALLOCATED')?.count || 0}
          </span>
        </div>
        <div className="card p-6 flex flex-col gap-2 shadow-sm border border-gray-200">
          <span className="text-sm font-medium text-gray-500">Active Maintenance</span>
          <span className="text-4xl font-bold text-yellow-600">{data.activeMaintenance}</span>
        </div>
        <div className="card p-6 flex flex-col gap-2 shadow-sm border border-gray-200">
          <span className="text-sm font-medium text-gray-500">Upcoming/Active Bookings</span>
          <span className="text-4xl font-bold text-blue-600">{data.activeBookings}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Status Breakdown (Simple Bar Chart via CSS) */}
        <div className="card p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold mb-6 text-gray-800">Asset Status Breakdown</h2>
          <div className="flex flex-col gap-4">
            {data.statusBreakdown.map((status, idx) => {
              const percentage = data.totalAssets > 0 ? Math.round((status.count / data.totalAssets) * 100) : 0;
              return (
                <div key={idx} className="flex flex-col gap-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-gray-700">{status.name}</span>
                    <span className="text-gray-500">{status.count} ({percentage}%)</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[var(--color-secondary)] transition-all duration-1000"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {data.statusBreakdown.length === 0 && <p className="text-gray-400 text-sm">No data available.</p>}
          </div>
        </div>

        {/* Category Breakdown (Simple Bar Chart via CSS) */}
        <div className="card p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold mb-6 text-gray-800">Assets By Category</h2>
          <div className="flex flex-col gap-4">
            {data.assetsByCategory.map((cat, idx) => {
              const percentage = data.totalAssets > 0 ? Math.round((cat.count / data.totalAssets) * 100) : 0;
              return (
                <div key={idx} className="flex flex-col gap-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-gray-700">{cat.category}</span>
                    <span className="text-gray-500">{cat.count}</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[var(--color-primary)] transition-all duration-1000"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
             {data.assetsByCategory.length === 0 && <p className="text-gray-400 text-sm">No data available.</p>}
          </div>
        </div>

      </div>
    </div>
  );
}
