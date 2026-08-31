'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LogOut,
  User,
  Search,
  Plus,
  Building2,
  X,
  Menu,
  Sparkles,
  CheckCircle2,
  FileText,
  UserCheck,
} from 'lucide-react';
import { useCommunity } from '@/lib/community-context';
import CommandPalette from '@/components/ui/command-palette';

export default function Header({
  onToggleMobileMenu,
}: {
  onToggleMobileMenu?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { selectedCommunity, setSelectedCommunity, selectedCommunityObj } = useCommunity();

  const [user, setUser] = useState<{ email: string; role: string } | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const getPageTitle = () => {
    if (pathname === '/') return 'Dashboard Overview';
    if (pathname === '/communities') return 'Societies & Communities';
    if (pathname?.startsWith('/communities/')) return 'Community Operational Hub';
    if (pathname === '/payments') return 'Payment Verifications & Approvals';
    if (pathname === '/invoices') return 'Monthly Invoices & Billing';
    if (pathname === '/bookings') return 'Cleaning Schedules & Bookings';
    if (pathname === '/users') return 'Residents & Vehicle Directory';
    if (pathname === '/partners') return 'Cleaner Fleet & Partner Network';
    if (pathname === '/battery-requests') return 'Battery Jumpstart Requests';
    if (pathname === '/driver-requests') return 'Driver Hire Requests';
    if (pathname === '/support-tickets') return 'Support Helpdesk';
    if (pathname === '/audit-log') return 'Admin Audit Logs';
    return 'Vervice Admin';
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200/80 px-4 lg:px-8 py-3 flex items-center justify-between shadow-sm">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight">
              {getPageTitle()}
            </h1>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Vervice Operations Management
            </p>
          </div>
        </div>

        {/* Center: Active Community Scope Pill */}
        <div className="hidden md:flex items-center gap-2">
          {selectedCommunity !== 'ALL' ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200/80 rounded-full text-xs font-bold text-emerald-800 shadow-sm animate-in fade-in">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Scope: {selectedCommunityObj?.name || selectedCommunity}</span>
              <button
                onClick={() => setSelectedCommunity('ALL')}
                title="Reset scope to All Communities"
                className="w-4 h-4 rounded-full bg-emerald-200 hover:bg-emerald-300 text-emerald-900 flex items-center justify-center transition-colors"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ) : (
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 px-3 py-1 bg-slate-100/80 rounded-full border border-slate-200/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              All Societies Combined
            </span>
          )}
        </div>

        {/* Right: Quick Search + Quick Actions + User */}
        <div className="flex items-center gap-2.5">
          {/* Quick Search */}
          <button
            onClick={() => setShowCommandPalette(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Search...</span>
            <kbd className="text-[9px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs text-slate-500">
              ⌘K
            </kbd>
          </button>

          {/* Quick Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-900/10 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Actions</span>
            </button>

            {showQuickActions && (
              <div
                className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-1.5 animate-in fade-in duration-150"
                onMouseLeave={() => setShowQuickActions(false)}
              >
                <div className="px-3 py-1.5 border-b border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Quick Operations
                  </p>
                </div>
                <Link
                  href="/communities"
                  onClick={() => setShowQuickActions(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>Add New Society</span>
                </Link>
                <Link
                  href="/bookings"
                  onClick={() => setShowQuickActions(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Assign Cleaning Booking</span>
                </Link>
                <Link
                  href="/partners"
                  onClick={() => setShowQuickActions(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <UserCheck className="w-4 h-4 text-purple-600" />
                  <span>Register Cleaner</span>
                </Link>
              </div>
            )}
          </div>

          {/* User Session & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="hidden lg:block text-right">
              <p className="text-xs font-bold text-slate-900 leading-tight">
                {user?.email ? user.email.split('@')[0] : 'Admin'}
              </p>
              <p className="text-[10px] text-slate-400 capitalize font-medium">
                {user?.role?.replace('_', ' ') || 'Super Admin'}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 flex items-center justify-center transition-colors"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
      />
    </>
  );
}
