'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Car,
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Wrench,
  ShieldCheck,
  Search,
  LogOut,
  ChevronDown,
  Menu,
  X,
  FileText,
  Receipt,
  UserCheck,
  Battery,
  HelpCircle,
  History,
  Check,
  Plus,
  Zap,
} from 'lucide-react';
import { useCommunity } from '@/lib/community-context';
import CommandPalette from '@/components/ui/command-palette';

interface PrimaryCategory {
  id: string;
  label: string;
  icon: any;
  subRoutes: string[];
  defaultHref: string;
}

interface SubMenuItem {
  href: string;
  label: string;
  icon: any;
  parentCategoryId: string;
  description: string;
}

export default function TopNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { selectedCommunity, setSelectedCommunity, communities, selectedCommunityObj } =
    useCommunity();

  const [user, setUser] = useState<{ email: string; role: string } | null>(null);
  const [showCommunityDropdown, setShowCommunityDropdown] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Define Layer 1 Primary Categories with Straightforward Labels
  const primaryCategories: PrimaryCategory[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      subRoutes: ['/'],
      defaultHref: '/',
    },
    {
      id: 'operations',
      label: 'Services & Cleaning',
      icon: Building2,
      subRoutes: ['/communities', '/bookings', '/partners'],
      defaultHref: '/bookings',
    },
    {
      id: 'residents',
      label: 'Residents & Vehicles',
      icon: Users,
      subRoutes: ['/users'],
      defaultHref: '/users',
    },
    {
      id: 'finance',
      label: 'Payments & Invoices',
      icon: CreditCard,
      subRoutes: ['/payments', '/invoices'],
      defaultHref: '/payments',
    },
    {
      id: 'services',
      label: 'Emergency & Requests',
      icon: Wrench,
      subRoutes: ['/battery-requests', '/driver-requests', '/support-tickets'],
      defaultHref: '/battery-requests',
    },
    {
      id: 'system',
      label: 'System & Audit',
      icon: ShieldCheck,
      subRoutes: ['/audit-log'],
      defaultHref: '/audit-log',
    },
  ];

  // Define Layer 2 Sub-Menu Items with Explanatory Descriptions
  const subMenuItems: SubMenuItem[] = [
    // Overview
    { href: '/', label: 'Main Dashboard', icon: LayoutDashboard, parentCategoryId: 'overview', description: 'Real-time revenue, active bookings, & community metrics' },

    // Operations
    { href: '/bookings', label: 'Cleaning Schedules', icon: FileText, parentCategoryId: 'operations', description: 'Manage daily car cleaning bookings and active plans' },
    { href: '/communities', label: 'Communities & Blocks', icon: Building2, parentCategoryId: 'operations', description: 'Gated societies, block structures, & flat counts' },
    { href: '/partners', label: 'Cleaners & Staff', icon: UserCheck, parentCategoryId: 'operations', description: 'Assigned cleaners, attendance, & active gates' },

    // Residents
    { href: '/users', label: 'Resident Accounts', icon: Users, parentCategoryId: 'residents', description: 'Resident profiles, phone numbers, & vehicle assignments' },

    // Finance
    { href: '/payments', label: 'Payment Verifications', icon: CreditCard, parentCategoryId: 'finance', description: 'Review & verify manual UPI payments from residents' },
    { href: '/invoices', label: 'Monthly Billing & Invoices', icon: Receipt, parentCategoryId: 'finance', description: 'Generate monthly invoices & track overdue balances' },

    // Services
    { href: '/battery-requests', label: 'Battery Jumpstart', icon: Battery, parentCategoryId: 'services', description: 'Urgent battery jumpstart & replacement requests' },
    { href: '/driver-requests', label: 'Driver Hire', icon: Car, parentCategoryId: 'services', description: 'Driver assignment and booking requests' },
    { href: '/support-tickets', label: 'Support Helpdesk', icon: HelpCircle, parentCategoryId: 'services', description: 'Resident support tickets & complaint logs' },

    // System
    { href: '/audit-log', label: 'Admin Audit Log', icon: History, parentCategoryId: 'system', description: 'Trace all admin actions, approvals, and system events' },
  ];

  // Resolve Active Layer 1 Primary Category based on current pathname
  const activeCategory =
    primaryCategories.find((cat) =>
      cat.subRoutes.some((route) =>
        route === '/' ? pathname === '/' : pathname?.startsWith(route)
      )
    ) || primaryCategories[0];

  // Get active Layer 2 sub-menu items for the active category
  const activeSubMenuItems = subMenuItems.filter(
    (item) => item.parentCategoryId === activeCategory.id
  );

  // Active sub-item for clarity description
  const currentSubItem = subMenuItems.find(
    (item) => item.href === '/' ? pathname === '/' : pathname === item.href || pathname?.startsWith(item.href + '/')
  ) || activeSubMenuItems[0];

  return (
    <>
      <header className="sticky top-0 z-40 shadow-md">
        {/* ── LAYER 1: Primary Header Bar (Straightforward Dark Slate) ──────────── */}
        <div className="bg-slate-950 border-b border-slate-800 text-white px-4 md:px-8 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            
            {/* Left: Brand Logo + Global Community Scope Picker */}
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
                <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-950/40 group-hover:scale-105 transition-transform">
                  <Car className="w-5 h-5 text-white" />
                </div>
                <div className="hidden sm:block">
                  <span className="font-extrabold text-white text-base tracking-tight">Vervice</span>
                  <span className="text-[10px] font-bold text-emerald-400 block -mt-1 tracking-wider uppercase">
                    Admin Portal
                  </span>
                </div>
              </Link>

              {/* ── GLOBAL COMMUNITY SELECTOR (What society are you managing?) ── */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowCommunityDropdown(!showCommunityDropdown);
                    setShowQuickActions(false);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-bold text-slate-100 transition-all shadow-sm"
                  title="Switch target community scope"
                >
                  <span className="text-emerald-400 font-extrabold">🏢 Scope:</span>
                  <span className="max-w-[130px] sm:max-w-[170px] truncate text-emerald-300 font-extrabold">
                    {selectedCommunity === 'ALL'
                      ? 'All Communities'
                      : selectedCommunityObj?.name || selectedCommunity}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                </button>

                {/* Dropdown Menu */}
                {showCommunityDropdown && (
                  <div
                    className="absolute left-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 py-1.5 animate-in fade-in duration-150"
                    onMouseLeave={() => setShowCommunityDropdown(false)}
                  >
                    <div className="px-3 py-2 border-b border-slate-800">
                      <p className="text-[11px] font-bold text-white uppercase tracking-wider">
                        Filter Portal by Community
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Select a society to scope all stats, bookings, & payments
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCommunity('ALL');
                        setShowCommunityDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold text-left transition-colors ${
                        selectedCommunity === 'ALL'
                          ? 'bg-emerald-600/20 text-emerald-300'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>🌐</span> View All Communities Combined
                      </span>
                      {selectedCommunity === 'ALL' && <Check className="w-4 h-4 text-emerald-400" />}
                    </button>

                    <div className="my-1 border-t border-slate-800"></div>

                    <div className="max-h-60 overflow-y-auto space-y-0.5">
                      {communities.map((c) => {
                        const isSelected = selectedCommunity === c.id || selectedCommunity === c.name;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedCommunity(c.id);
                              setShowCommunityDropdown(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-left transition-colors ${
                              isSelected
                                ? 'bg-emerald-600/20 text-emerald-300 font-bold'
                                : 'text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <span className="truncate pr-2">🏢 {c.name}</span>
                            {isSelected && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Middle: Primary Navigation Tabs (Desktop) */}
            <nav className="hidden lg:flex items-center gap-1">
              {primaryCategories.map((category) => {
                const isActive = activeCategory.id === category.id;
                const IconComponent = category.icon;
                return (
                  <Link
                    key={category.id}
                    href={category.defaultHref}
                    className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-all duration-150 ${
                      isActive
                        ? 'text-white font-extrabold bg-slate-800/90 shadow-sm border border-slate-700/60'
                        : 'text-slate-300 font-semibold hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>{category.label}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-emerald-400 rounded-full shadow-sm" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right: + QUICK ACTION MENU, Search, User, Logout */}
            <div className="flex items-center gap-2.5">
              
              {/* ── GLOBAL + QUICK ACTION DROPDOWN BUTTON ── */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickActions(!showQuickActions);
                    setShowCommunityDropdown(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Take Action</span>
                  <ChevronDown className="w-3 h-3 opacity-80" />
                </button>

                {/* Quick Actions Dropdown Menu */}
                {showQuickActions && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 py-1.5 text-slate-800 animate-in fade-in duration-150"
                    onMouseLeave={() => setShowQuickActions(false)}
                  >
                    <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/50">
                      <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Zap className="w-3 h-3 text-emerald-600" />
                        Admin Quick Actions
                      </p>
                    </div>

                    <Link
                      href="/payments?action=record"
                      onClick={() => setShowQuickActions(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
                    >
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      <span>Record Payment</span>
                    </Link>

                    <Link
                      href="/bookings?action=create"
                      onClick={() => setShowQuickActions(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
                    >
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>Create Booking</span>
                    </Link>

                    <Link
                      href="/users?action=create"
                      onClick={() => setShowQuickActions(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
                    >
                      <Users className="w-4 h-4 text-indigo-600" />
                      <span>Add Resident / User</span>
                    </Link>

                    <Link
                      href="/invoices?action=generate"
                      onClick={() => setShowQuickActions(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
                    >
                      <Receipt className="w-4 h-4 text-amber-600" />
                      <span>Generate Invoice</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Cmd + K Quick Search Button */}
              <button
                type="button"
                onClick={() => setShowCommandPalette(true)}
                className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs text-slate-300 transition-all shadow-sm"
                title="Search pages or communities"
              >
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <kbd className="font-mono bg-slate-900 px-1.5 py-0.5 rounded text-[10px] text-slate-400 border border-slate-700">
                  ⌘K
                </kbd>
              </button>

              {/* Logout */}
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-all"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>

              {/* Mobile Drawer Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-slate-300 hover:text-white"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* ── LAYER 2: Context & Sub-Menu Bar (Straightforward Light Bar) ───── */}
        <div className="bg-white border-b border-slate-200 px-4 md:px-8 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            {/* Sub-Menu Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {activeSubMenuItems.map((item) => {
                const isSubActive =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname === item.href || pathname?.startsWith(item.href + '/');

                const IconComp = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                      isSubActive
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <IconComp className={`w-3.5 h-3.5 ${isSubActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Clear Context Statement (What am I looking at?) */}
            <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200/80 px-3 py-1 rounded-lg">
              <span className="font-bold text-slate-700">Looking at:</span>
              <span className="text-slate-900 font-semibold">{currentSubItem?.description}</span>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex flex-col">
          <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Car className="w-5 h-5 text-emerald-400" />
              <span>Vervice Admin Menu</span>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 p-1">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="bg-slate-950 flex-1 overflow-y-auto p-4 space-y-6">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                Main Sections
              </p>
              <div className="space-y-1">
                {primaryCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={cat.defaultHref}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold ${
                      activeCategory.id === cat.id ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <cat.icon className="w-5 h-5" />
                    <span>{cat.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Command Palette Modal */}
      <CommandPalette isOpen={showCommandPalette} onClose={() => setShowCommandPalette(false)} />
    </>
  );
}
