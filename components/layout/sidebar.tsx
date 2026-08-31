'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  FileText,
  Users,
  CreditCard,
  Receipt,
  UserCheck,
  Battery,
  Car,
  HelpCircle,
  History,
  ChevronDown,
  Check,
  Search,
  Sparkles,
  Globe,
} from 'lucide-react';
import { useCommunity } from '@/lib/community-context';

const navigationGroups = [
  {
    title: 'Overview',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Operations',
    items: [
      { href: '/communities', label: 'Societies & Hubs', icon: Building2 },
      { href: '/bookings', label: 'Cleaning Schedules', icon: FileText },
      { href: '/partners', label: 'Cleaners & Staff', icon: UserCheck },
      { href: '/users', label: 'Residents & Cars', icon: Users },
    ],
  },
  {
    title: 'Finance & Billing',
    items: [
      { href: '/payments', label: 'Payment Approvals', icon: CreditCard },
      { href: '/invoices', label: 'Monthly Invoices', icon: Receipt },
    ],
  },
  {
    title: 'Special Services',
    items: [
      { href: '/battery-requests', label: 'Battery Jumpstart', icon: Battery },
      { href: '/driver-requests', label: 'Driver Hire', icon: Car },
      { href: '/support-tickets', label: 'Support Helpdesk', icon: HelpCircle },
    ],
  },
  {
    title: 'System & Security',
    items: [
      { href: '/audit-log', label: 'Audit Logs', icon: History },
    ],
  },
];

export default function Sidebar({
  isMobileOpen,
  setIsMobileOpen,
}: {
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const { selectedCommunity, setSelectedCommunity, communities, selectedCommunityObj } = useCommunity();
  const [showCommunityDropdown, setShowCommunityDropdown] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const filteredCommunities = communities.filter((c) =>
    c.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const handleSelectCommunity = (id: string) => {
    setSelectedCommunity(id);
    setShowCommunityDropdown(false);
    setSearchFilter('');
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-850 flex flex-col text-slate-300 transition-transform duration-200 lg:translate-x-0 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-850 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-3 group"
          onClick={() => setIsMobileOpen?.(false)}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-950/50 group-hover:scale-105 transition-transform">
            <Car className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-black text-white text-base tracking-tight leading-tight">Vervice</h1>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Admin Control</p>
          </div>
        </Link>

        {isMobileOpen && (
          <button
            onClick={() => setIsMobileOpen?.(false)}
            className="lg:hidden w-8 h-8 rounded-lg bg-slate-900 text-slate-400 flex items-center justify-center"
          >
            ✕
          </button>
        )}
      </div>

      {/* Community Scope Switcher (Key Feature for Community-Centric Control) */}
      <div className="p-3.5 border-b border-slate-850 bg-slate-900/50 relative">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1 px-1">
          Active Community Scope
        </label>
        <button
          type="button"
          onClick={() => setShowCommunityDropdown(!showCommunityDropdown)}
          className="w-full flex items-center justify-between p-2.5 bg-slate-850 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-semibold text-slate-100 transition-all shadow-sm active:scale-[0.98]"
        >
          <div className="flex items-center gap-2 truncate">
            {selectedCommunity === 'ALL' ? (
              <Globe className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <Building2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            )}
            <span className="truncate font-bold text-slate-100">
              {selectedCommunity === 'ALL'
                ? 'All Communities'
                : selectedCommunityObj?.name || selectedCommunity}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
        </button>

        {/* Community Dropdown */}
        {showCommunityDropdown && (
          <div className="absolute left-3.5 right-3.5 top-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 py-1.5 overflow-hidden animate-in fade-in duration-150">
            <div className="p-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-950 rounded-lg border border-slate-800">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search community..."
                  className="w-full bg-transparent text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            <div className="max-h-52 overflow-y-auto">
              <button
                onClick={() => handleSelectCommunity('ALL')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-left transition-colors ${
                  selectedCommunity === 'ALL'
                    ? 'bg-emerald-600/20 text-emerald-300'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" /> All Communities Combined
                </span>
                {selectedCommunity === 'ALL' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              </button>

              <div className="my-1 border-t border-slate-800" />

              {filteredCommunities.map((comm) => (
                <button
                  key={comm.id}
                  onClick={() => handleSelectCommunity(comm.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                    selectedCommunity === comm.id || selectedCommunity === comm.name
                      ? 'bg-emerald-600/20 text-emerald-300 font-bold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{comm.name}</span>
                  </span>
                  {(selectedCommunity === comm.id || selectedCommunity === comm.name) && (
                    <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-3.5 space-y-5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
        {navigationGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <h3 className="px-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
              {group.title}
            </h3>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen?.(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm font-bold'
                        : 'text-slate-400 hover:bg-slate-850 hover:text-slate-100'
                    }`}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer / Scope indicator */}
      <div className="p-3.5 border-t border-slate-850 bg-slate-950/80">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-medium">Platform Scope:</span>
          <span className="font-bold text-emerald-400">
            {selectedCommunity === 'ALL' ? 'Global Multi-Hub' : 'Scoped Hub'}
          </span>
        </div>
      </div>
    </aside>
  );
}
