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
  ChevronDown,
  LayoutDashboard,
  FileText,
  UserCheck,
  Users,
  CreditCard,
  Receipt,
  Battery,
  Car,
  HelpCircle,
  Sliders,
  Image as ImageIcon,
  Layout,
  History,
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
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

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
    if (pathname?.startsWith('/communities/')) return 'Community Hub Details';
    if (pathname === '/payments') return 'Payment Verifications';
    if (pathname === '/invoices') return 'Monthly Invoices';
    if (pathname === '/bookings') return 'Cleaning Schedules';
    if (pathname === '/users') return 'Residents Directory';
    if (pathname === '/partners') return 'Cleaner Fleet';
    if (pathname === '/battery-requests') return 'Battery Jumpstart';
    if (pathname === '/driver-requests') return 'Driver Hire';
    if (pathname === '/support-tickets') return 'Support Helpdesk';
    if (pathname === '/app-config') return 'Feature Flags & Config';
    if (pathname === '/banners') return 'Home Banners & Promos';
    if (pathname === '/screen-config') return 'Screen & Barrier Text';
    if (pathname === '/audit-log') return 'Admin Audit Logs';
    return 'Vervice Admin';
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 lg:px-6 py-2.5 shadow-2xs">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Mobile Toggle & Page Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-sm font-black text-slate-900 tracking-tight leading-tight">
                {getPageTitle()}
              </h1>
              <p className="text-[10px] text-slate-400 hidden xl:block font-medium">
                Vervice Central Command
              </p>
            </div>
          </div>

          {/* ── SLEEK TOP HORIZONTAL MENU FOR DESKTOP ── */}
          <nav className="hidden 2xl:flex items-center gap-1 text-xs font-bold text-slate-600">
            {/* Dashboard */}
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                pathname === '/' ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
            </Link>

            {/* Operations Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown('ops')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                  ['/bookings', '/partners', '/users'].includes(pathname)
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Operations <ChevronDown className="w-3 h-3 opacity-60" />
              </button>
              {activeDropdown === 'ops' && (
                <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in duration-100">
                  <Link href="/bookings" className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" /> Cleaning Schedules
                  </Link>
                  <Link href="/partners" className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" /> Cleaner Fleet & Staff
                  </Link>
                  <Link href="/users" className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                    <Users className="w-3.5 h-3.5 text-purple-600" /> Residents & Vehicles
                  </Link>
                </div>
              )}
            </div>

            {/* Finance Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown('finance')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                  ['/payments', '/invoices'].includes(pathname)
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" /> Finance <ChevronDown className="w-3 h-3 opacity-60" />
              </button>
              {activeDropdown === 'finance' && (
                <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in duration-100">
                  <Link href="/payments" className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                    <CreditCard className="w-3.5 h-3.5 text-amber-500" /> Payment Approvals
                  </Link>
                  <Link href="/invoices" className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                    <Receipt className="w-3.5 h-3.5 text-emerald-600" /> Monthly Invoices
                  </Link>
                </div>
              )}
            </div>

            {/* App Control Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown('app_control')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                  ['/app-config', '/banners', '/screen-config'].includes(pathname)
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-emerald-600" /> App Control <ChevronDown className="w-3 h-3 opacity-60" />
              </button>
              {activeDropdown === 'app_control' && (
                <div className="absolute left-0 top-full mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in duration-100">
                  <Link href="/app-config" className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                    <Sliders className="w-3.5 h-3.5 text-emerald-600" /> Feature Flags & Config
                  </Link>
                  <Link href="/banners" className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                    <ImageIcon className="w-3.5 h-3.5 text-blue-600" /> Home Banners & Promos
                  </Link>
                  <Link href="/screen-config" className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                    <Layout className="w-3.5 h-3.5 text-purple-600" /> Screen & Barrier Text
                  </Link>
                </div>
              )}
            </div>

            {/* Hubs */}
            <Link
              href="/communities"
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                pathname === '/communities' ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" /> Societies
            </Link>
          </nav>

          {/* Right: Active Scope Pill + Search + Quick Actions + User */}
          <div className="flex items-center gap-2.5">
            {/* Active Community Scope Pill */}
            {selectedCommunity !== 'ALL' ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-800 shadow-2xs">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="max-w-[120px] truncate">{selectedCommunityObj?.name || selectedCommunity}</span>
                <button
                  onClick={() => setSelectedCommunity('ALL')}
                  title="Reset scope"
                  className="w-4 h-4 rounded-full bg-emerald-200 hover:bg-emerald-300 text-emerald-900 flex items-center justify-center"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ) : (
              <span className="hidden md:flex text-xs font-semibold text-slate-400 items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                All Societies
              </span>
            )}

            {/* Quick Search */}
            <button
              onClick={() => setShowCommandPalette(true)}
              className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Search</span>
              <kbd className="text-[9px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-500">
                ⌘K
              </kbd>
            </button>

            {/* Quick Actions Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowQuickActions(!showQuickActions)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
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
                    className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span>Add New Society</span>
                  </Link>
                  <Link
                    href="/bookings"
                    onClick={() => setShowQuickActions(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Assign Booking</span>
                  </Link>
                  <Link
                    href="/banners"
                    onClick={() => setShowQuickActions(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <ImageIcon className="w-4 h-4 text-purple-600" />
                    <span>Publish App Banner</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Logout */}
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
