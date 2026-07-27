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
}

export default function TopNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { selectedCommunity, setSelectedCommunity, communities, isLoading, selectedCommunityObj } =
    useCommunity();

  const [user, setUser] = useState<{ email: string; role: string } | null>(null);
  const [showCommunityDropdown, setShowCommunityDropdown] = useState(false);
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

  // Define Layer 1 Primary Categories
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
      label: 'Operations',
      icon: Building2,
      subRoutes: ['/communities', '/bookings', '/partners'],
      defaultHref: '/communities',
    },
    {
      id: 'residents',
      label: 'Residents',
      icon: Users,
      subRoutes: ['/users'],
      defaultHref: '/users',
    },
    {
      id: 'finance',
      label: 'Finance',
      icon: CreditCard,
      subRoutes: ['/payments', '/invoices'],
      defaultHref: '/payments',
    },
    {
      id: 'services',
      label: 'Services & Support',
      icon: Wrench,
      subRoutes: ['/battery-requests', '/driver-requests', '/support-tickets'],
      defaultHref: '/battery-requests',
    },
    {
      id: 'system',
      label: 'System',
      icon: ShieldCheck,
      subRoutes: ['/audit-log'],
      defaultHref: '/audit-log',
    },
  ];

  // Define Layer 2 Sub-Menu Items
  const subMenuItems: SubMenuItem[] = [
    // Overview
    { href: '/', label: 'Dashboard', icon: LayoutDashboard, parentCategoryId: 'overview' },

    // Operations
    { href: '/communities', label: 'Communities', icon: Building2, parentCategoryId: 'operations' },
    { href: '/bookings', label: 'Bookings & Schedules', icon: FileText, parentCategoryId: 'operations' },
    { href: '/partners', label: 'Partners & Cleaners', icon: UserCheck, parentCategoryId: 'operations' },

    // Residents
    { href: '/users', label: 'Users & Residents', icon: Users, parentCategoryId: 'residents' },

    // Finance
    { href: '/payments', label: 'Payments Log', icon: CreditCard, parentCategoryId: 'finance' },
    { href: '/invoices', label: 'Invoices & Billing', icon: Receipt, parentCategoryId: 'finance' },

    // Services
    { href: '/battery-requests', label: 'Battery Requests', icon: Battery, parentCategoryId: 'services' },
    { href: '/driver-requests', label: 'Driver Requests', icon: Car, parentCategoryId: 'services' },
    { href: '/support-tickets', label: 'Support Tickets', icon: HelpCircle, parentCategoryId: 'services' },

    // System
    { href: '/audit-log', label: 'Audit Log', icon: History, parentCategoryId: 'system' },
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

  return (
    <>
      <header className="sticky top-0 z-40 shadow-sm">
        {/* ── LAYER 1: Primary Header Bar (Dark Slate) ────────────────────────── */}
        <div className="bg-slate-900 border-b border-slate-800 text-white px-4 md:px-8 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            
            {/* Left: Brand Logo + Global Community Selector */}
            <div className="flex items-center gap-5">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md shadow-emerald-950/30 group-hover:scale-105 transition-transform">
                  <Car className="w-5 h-5 text-white" />
                </div>
                <div className="hidden sm:block">
                  <span className="font-extrabold text-white text-base tracking-tight">Vervice</span>
                  <span className="text-[10px] font-bold text-emerald-400 block -mt-1 tracking-wider uppercase">
                    Admin
                  </span>
                </div>
              </Link>

              {/* ── GLOBAL COMMUNITY SELECTOR DROPDOWN ── */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCommunityDropdown(!showCommunityDropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 rounded-xl text-xs font-bold text-slate-100 transition-all shadow-sm"
                >
                  <span className="text-emerald-400 font-extrabold text-sm">🏢</span>
                  <span className="max-w-[140px] sm:max-w-[180px] truncate">
                    {selectedCommunity === 'ALL'
                      ? 'All Communities'
                      : selectedCommunityObj?.name || selectedCommunity}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                </button>

                {/* Dropdown Menu */}
                {showCommunityDropdown && (
                  <div
                    className="absolute left-0 mt-2 w-64 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl z-50 py-1.5 animate-in fade-in duration-150"
                    onMouseLeave={() => setShowCommunityDropdown(false)}
                  >
                    <div className="px-3 py-1.5 border-b border-slate-800">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Select Scope
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCommunity('ALL');
                        setShowCommunityDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-left transition-colors ${
                        selectedCommunity === 'ALL'
                          ? 'bg-emerald-600/20 text-emerald-300 font-bold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>🌐</span> All Communities
                      </span>
                      {selectedCommunity === 'ALL' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>

                    <div className="my-1 border-t border-slate-800/80"></div>

                    <div className="max-h-56 overflow-y-auto space-y-0.5">
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
                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Middle: Layer 1 Navigation Links (Desktop) */}
            <nav className="hidden lg:flex items-center gap-1">
              {primaryCategories.map((category) => {
                const isActive = activeCategory.id === category.id;
                const IconComponent = category.icon;
                return (
                  <Link
                    key={category.id}
                    href={category.defaultHref}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{category.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right: Quick Search, Admin Pill, Logout */}
            <div className="flex items-center gap-3">
              {/* Cmd + K Quick Search Button */}
              <button
                type="button"
                onClick={() => setShowCommandPalette(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 rounded-xl text-xs text-slate-300 transition-all shadow-sm"
              >
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium">Search...</span>
                <kbd className="font-mono bg-slate-900 px-1.5 py-0.5 rounded text-[10px] text-slate-400 border border-slate-700">
                  ⌘K
                </kbd>
              </button>

              {/* User Role */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="font-semibold text-slate-200 capitalize">
                  {user?.role?.replace('_', ' ') || 'Admin'}
                </span>
              </div>

              {/* Logout */}
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-all"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
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

        {/* ── LAYER 2: Secondary Sub-Menu Bar (Clean Light Subnav) ──────────── */}
        <div className="bg-white border-b border-slate-200/80 px-4 md:px-8 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
            
            {/* Active Sub-Menu Links */}
            <div className="flex items-center gap-1 sm:gap-2">
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
                        ? 'bg-slate-100 text-emerald-700 shadow-sm border border-slate-200/80'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <IconComp className={`w-3.5 h-3.5 ${isSubActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Active Community Pill Indicator (Right-aligned in Layer 2) */}
            <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200/80 px-3 py-1 rounded-full whitespace-nowrap">
              <span>Scoped to:</span>
              <span className="text-emerald-700 font-extrabold">
                {selectedCommunity === 'ALL'
                  ? '🌐 All Communities'
                  : `🏢 ${selectedCommunityObj?.name || selectedCommunity}`}
              </span>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex flex-col">
          <div className="bg-slate-900 p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Car className="w-5 h-5 text-emerald-400" />
              <span>Vervice Admin Menu</span>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 p-1">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="bg-slate-900 flex-1 overflow-y-auto p-4 space-y-6">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                Primary Sections
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
