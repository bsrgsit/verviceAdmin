'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, User } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setUser(data.user);
        }
      });
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  // Resolve dynamic title based on path
  const getPageTitle = () => {
    if (pathname === '/') return 'Dashboard Overview';
    if (pathname === '/communities') return 'Communities';
    if (pathname?.startsWith('/communities/')) return 'Community Details';
    if (pathname === '/payments') return 'Payments Management';
    if (pathname === '/invoices') return 'Invoices & Billing';
    if (pathname === '/bookings') return 'Service Bookings';
    if (pathname === '/users') return 'User Directory';
    if (pathname === '/partners') return 'Partner Network';
    if (pathname === '/battery-requests') return 'Battery Requests';
    if (pathname === '/driver-requests') return 'Driver Requests';
    if (pathname === '/support-tickets') return 'Support Tickets';
    if (pathname === '/audit-log') return 'System Audit Log';
    return 'Vervice Admin';
  };

  return (
    <header className="bg-white border-b border-slate-150 px-6 py-4 flex items-center justify-between">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          {getPageTitle()}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {user?.email || 'Loading admin session...'}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg">
          <User className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs font-semibold text-slate-600 capitalize">
            {user?.role?.replace('_', ' ') || 'Admin'}
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout
        </button>
      </div>
    </header>
  );
}
