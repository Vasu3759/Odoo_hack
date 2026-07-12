'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data) setUser(data);
      })
      .catch(console.error);
  }, [pathname]);

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊', roles: ['ALL'] },
    { name: 'Asset Registry', href: '/assets', icon: '📦', roles: ['ALL'] },
    { name: 'Resource Bookings', href: '/bookings', icon: '📅', roles: ['ALL'] },
    { name: 'Maintenance', href: '/maintenance', icon: '🔧', roles: ['ALL'] },
    { name: 'Audit Cycles', href: '/audits', icon: '✅', roles: ['ADMIN', 'ASSET_MANAGER', 'DEPT_HEAD'] },
    { name: 'Admin Panel', href: '/admin', icon: '⚙️', roles: ['ADMIN'] },
    { name: 'Reports', href: '/reports', icon: '📈', roles: ['ADMIN', 'ASSET_MANAGER', 'DEPT_HEAD'] },
    { name: 'Activity Logs', href: '/logs', icon: '📋', roles: ['ADMIN'] },
  ];

  if (pathname === '/login' || pathname === '/') {
    return null;
  }

  const roleLabels = {
    EMPLOYEE: 'Employee',
    DEPT_HEAD: 'Department Head',
    ASSET_MANAGER: 'Asset Manager',
    ADMIN: 'System Admin'
  };

  return (
    <>
      {/* Universal Hamburger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 flex items-center justify-center transition-colors"
        title="Toggle Menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 shadow-sm z-40 transition-transform duration-300 ease-in-out w-64 flex flex-col pt-16
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="absolute top-4 left-16 flex items-center h-10">
          <Link href="/dashboard" className="text-xl font-black text-[var(--color-primary)] tracking-tight">
            AssetFlow
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-1 mt-2">
          {navItems.map((item) => {
            // Check if user has permission to see this link
            const canView = item.roles.includes('ALL') || (user && item.roles.includes(user.role));
            if (!canView) return null;

            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors font-medium text-sm
                  ${isActive 
                    ? 'bg-[var(--color-primary)] text-white shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-[var(--color-primary)]'
                  }
                `}
              >
                <span className="text-lg">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer / User Profile */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold text-gray-800">{user?.name || 'Loading...'}</span>
            <span className="text-xs font-semibold text-[var(--color-secondary)] bg-[#017E8415] px-2.5 py-1 rounded-sm border border-[#017E8430] w-fit mb-2">
              {user ? roleLabels[user.role] : 'Employee'}
            </span>
            <Link 
              href="/login" 
              onClick={() => setIsOpen(false)}
              className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Log out
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
