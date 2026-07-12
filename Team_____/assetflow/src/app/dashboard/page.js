import Link from 'next/link';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  let userRole = 'EMPLOYEE'; // Default fallback
  
  if (token) {
    try {
      const payload = await verifyToken(token);
      if (payload && payload.role) {
        userRole = payload.role;
      }
    } catch (e) {
      console.error(e);
    }
  }

  const allCards = [
    { title: "Admin Panel", desc: "Manage organizational data, departments, categories, and user roles.", href: "/admin", icon: "⚙️", roles: ['ADMIN'] },
    { title: "Asset Lifecycle", desc: "Register new assets, manage allocations, and run audit verification cycles.", href: "/assets", icon: "📦", roles: ['ALL'] },
    { title: "Resource Bookings", desc: "View timeline and book shared resources without overlaps.", href: "/bookings", icon: "📅", roles: ['ALL'] },
    { title: "Maintenance", desc: "Manage repair requests through a Kanban board and update statuses.", href: "/maintenance", icon: "🔧", roles: ['ALL'] },
    { title: "Reports & Analytics", desc: "View real-time utilization metrics and top booked assets.", href: "/reports", icon: "📊", roles: ['ADMIN', 'ASSET_MANAGER', 'DEPT_HEAD'] },
    { title: "Activity Feed", desc: "See an immutable log of all critical actions taken within the system.", href: "/logs", icon: "📋", roles: ['ADMIN'] }
  ];

  const visibleCards = allCards.filter(card => 
    card.roles.includes('ALL') || card.roles.includes(userRole)
  );

  return (
    <div className="max-w-6xl mx-auto min-h-[calc(100vh-6rem)]">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold mb-3 text-[var(--color-primary)]">AssetFlow Overview</h1>
        <p className="text-gray-600 font-medium max-w-2xl mx-auto">
          Centralized command center for managing your organization's entire asset ecosystem.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleCards.map((card, i) => (
          <Link href={card.href} key={i}>
            <div className="card h-full p-6 flex flex-col items-start hover:border-[var(--color-primary)] cursor-pointer group bg-white border-t-4" style={{ borderTopColor: i % 2 === 0 ? 'var(--color-primary)' : 'var(--color-secondary)' }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="text-3xl bg-gray-50 p-3 rounded-lg shadow-sm border border-gray-100 group-hover:scale-105 transition-transform">
                  {card.icon}
                </div>
                <h2 className="text-xl font-bold text-gray-800 group-hover:text-[var(--color-primary)] transition-colors">
                  {card.title}
                </h2>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                {card.desc}
              </p>
              
              <div className="mt-auto pt-4 border-t border-gray-100 w-full flex items-center justify-between text-sm font-semibold text-[var(--color-secondary)] group-hover:text-[var(--color-secondary-hover)]">
                <span>Access Module</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
