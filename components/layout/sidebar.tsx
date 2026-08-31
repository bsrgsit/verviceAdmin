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
  Globe,
  Settings,
  X,
} from 'lucide-react';
import { useCommunity } from '@/lib/community-context';

const navigationGroups = [
  {
    title: 'Core Operations',
    items: [
      { href: '/', label: 'Dashboard Overview', icon: LayoutDashboard },
      { href: '/bookings', label: 'Cleaning Schedules', icon: FileText },
      { href: '/partners', label: 'Cleaner Fleet & Staff', icon: UserCheck },
      { href: '/users', label: 'Residents & Vehicles', icon: Users },
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
    title: 'On-Demand Services',
    items: [
      { href: '/battery-requests', label: 'Battery Jumpstart', icon: Battery },
      { href: '/driver-requests', label: 'Driver Hire', icon: Car },
      { href: '/support-tickets', label: 'Support Helpdesk', icon: HelpCircle },
    ],
  },
  {
    title: 'Configuration & System',
    items: [
      { href: '/communities', label: 'Manage Societies & Hubs', icon: Building2 },
      { href: '/audit-log', label: 'System Audit Logs', icon: History },
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
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col text-slate-100 transition-transform duration-200 lg:translate-x-0 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* ── 1. Brand Logo ── */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
        <Link
          href="/"
          className="flex items-center gap-3 group"
          onClick={() => setIsMobileOpen?.(false)}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-950/60 group-hover:scale-105 transition-transform">
            <Car className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-white text-base tracking-tight leading-tight">Vervice</h1>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Admin Control</p>
          </div>
        </Link>

        {isMobileOpen && (
          <button
            onClick={() => setIsMobileOpen?.(false)}
            className="lg:hidden w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center hover:bg-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── 2. Prominent Community Scope Switcher ── */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/40 relative">
        <div className="flex items-center justify-between mb-1.5 px-1">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" /> Community Scope
          </span>
          {selectedCommunity !== 'ALL' && (
            <button
              onClick={() => handleSelectCommunity('ALL')}
              className="text-[10px] font-bold text-slate-400 hover:text-white transition-colors"
            >
              Reset to All
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowCommunityDropdown(!showCommunityDropdown)}
          className="w-full flex items-center justify-between p-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-xs font-bold text-white transition-all shadow-sm active:scale-[0.98]"
        >
          <div className="flex items-center gap-2 truncate">
            {selectedCommunity === 'ALL' ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            ) : (
              <Building2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            )}
            <span className="truncate font-extrabold text-white">
              {selectedCommunity === 'ALL'
                ? '🌐 All Communities'
                : selectedCommunityObj?.name || selectedCommunity}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 ml-1" />
        </button>

        {/* Dropdown Menu */}
        {showCommunityDropdown && (
          <div className="absolute left-3 right-3 top-full mt-1.5 bg-slate-850 border border-slate-700 rounded-2xl shadow-2xl z-50 py-1.5 overflow-hidden animate-in fade-in duration-150">
            <div className="p-2 border-b border-slate-750">
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-900 rounded-xl border border-slate-750">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter community..."
                  className="w-full bg-transparent text-xs text-white placeholder:text-slate-400 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto">
              <button
                onClick={() => handleSelectCommunity('ALL')}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold text-left transition-colors ${
                  selectedCommunity === 'ALL'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-200 hover:bg-slate-750 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5" /> All Communities Combined
                </span>
                {selectedCommunity === 'ALL' && <Check className="w-4 h-4" />}
              </button>

              <div className="my-1 border-t border-slate-750" />

              {filteredCommunities.map((comm) => {
                const isSelected = selectedCommunity === comm.id || selectedCommunity === comm.name;
                return (
                  <button
                    key={comm.id}
                    onClick={() => handleSelectCommunity(comm.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-left transition-colors ${
                      isSelected
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'text-slate-300 hover:bg-slate-750 hover:text-white'
                    }`}
                  >
                    <span className="truncate flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{comm.name}</span>
                    </span>
                    {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Quick Link to Manage All Societies */}
            <div className="p-2 border-t border-slate-750 bg-slate-900/60">
              <Link
                href="/communities"
                onClick={() => setShowCommunityDropdown(false)}
                className="w-full py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Settings className="w-3 h-3 text-emerald-400" />
                <span>Configure Societies & Gates</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ── 3. High Readability Navigation Menu ── */}
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
        {navigationGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <h3 className="px-3 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
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
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all font-semibold ${
                      isActive
                        ? 'bg-emerald-600 text-white font-bold shadow-md ring-1 ring-emerald-400/40'
                        : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-300'}`} />
                    <span className="leading-tight">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── 4. Bottom Info Footer ── */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center justify-between text-xs px-1">
          <span className="text-slate-400 font-medium">Active Hub:</span>
          <span className="font-extrabold text-emerald-400 truncate max-w-[120px]">
            {selectedCommunity === 'ALL' ? 'Global' : selectedCommunityObj?.name || selectedCommunity}
          </span>
        </div>
      </div>
    </aside>
  );
}
