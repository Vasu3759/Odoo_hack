'use client';
import { useState, useEffect } from 'react';

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all bookings and assets
    Promise.all([
      fetch('/api/bookings').then(res => res.json()),
      fetch('/api/assets').then(res => res.json())
    ])
      .then(([bookingsData, assetsData]) => {
        setBookings(Array.isArray(bookingsData) ? bookingsData : []);
        setAssets(Array.isArray(assetsData) ? assetsData : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleBooking = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // We no longer send bookedById, the backend infers it from the JWT!
    const payload = {
      assetId: formData.get('assetId'),
      startTime: formData.get('startTime'),
      endTime: formData.get('endTime')
    };

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to book');
      } else {
        alert('Booking successful!');
        setBookings([...bookings, data]); // naive optimistic update
      }
    } catch (err) {
      alert('Error connecting to server');
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-[var(--color-primary)]">Resource Bookings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Booking Form (Left Side) */}
        <div className="card p-6 col-span-1 h-fit">
          <h2 className="text-xl font-semibold mb-4 text-[var(--color-foreground)]">Book a Resource</h2>
          <form onSubmit={handleBooking} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">Select Resource</label>
              {assets.length === 0 ? (
                <div className="text-sm text-red-500">No resources available.</div>
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
              <label className="block text-sm font-medium mb-1 text-gray-600">Start Time</label>
              <input name="startTime" type="datetime-local" className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">End Time</label>
              <input name="endTime" type="datetime-local" className="input-field" required />
            </div>
            <button type="submit" className="btn-primary mt-2" disabled={assets.length === 0}>
              Confirm Booking
            </button>
          </form>
        </div>

        {/* Timeline View (Right Side) */}
        <div className="card p-6 col-span-1 md:col-span-2">
          <h2 className="text-xl font-semibold mb-4 text-[var(--color-foreground)]">Upcoming Schedule</h2>
          {loading ? (
            <p className="text-gray-500">Loading timeline...</p>
          ) : bookings.length === 0 ? (
            <div className="text-center p-12 text-gray-400 border border-dashed border-gray-300 rounded bg-gray-50">
              No upcoming bookings found.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {bookings.map(b => (
                <div key={b.id} className="flex items-center justify-between p-4 rounded bg-blue-50 border-l-4 border-blue-500">
                  <div>
                    <h4 className="font-semibold text-blue-900">{b.asset?.name || 'Unknown Asset'}</h4>
                    <p className="text-sm text-blue-700">
                      {new Date(b.startTime).toLocaleString()} - {new Date(b.endTime).toLocaleString()}
                    </p>
                  </div>
                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-white text-blue-600 border border-blue-200 shadow-sm">
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
