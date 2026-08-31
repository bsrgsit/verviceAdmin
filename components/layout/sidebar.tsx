'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Building2,
  ChevronDown,
  Check,
  Search,
  Globe,
  Settings,
  X,
  Car,
  LogOut,
  User,
  ExternalLink,
} from 'lucide-react';
import { useCommunity } from '@/lib/community-context';
import { primarySections, getActivePrimarySection } from '@/lib/navigation-config';
import { Badge } from '@/components/ui/badge';

export default function Sidebar({
  isMobileOpen,
  setIsMobileOpen,
}: {
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { selectedCommunity, setSelectedCommunity, communities, selectedCommunityObj } = useCommunity();
  const [showCommunityDropdown, setShowCommunityDropdown] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);

  const activeSection = getActivePrimarySection(pathname);

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
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200/90 flex flex-col text-slate-900 transition-transform duration-200 lg:translate-x-0 shadow-2xs ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* ── 1. Brand Logo ── */}
      <div className="p-4 border-b border-slate-150 flex items-center justify-between bg-white">
        <Link
          href="/"
          className="flex items-center gap-3 group"
          onClick={() => setIsMobileOpen?.(false)}
        >
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-sm shadow-emerald-900/20 group-hover:scale-105 transition-transform">
            <Car className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 text-base tracking-tight leading-tight">Vervice</h1>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Admin Portal</p>
          </div>
        </Link>

        {isMobileOpen && (
          <button
            onClick={() => setIsMobileOpen?.(false)}
            className="lg:hidden w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── 2. Prominent Community Scope Switcher ── */}
      <div className="p-3.5 border-b border-slate-150 bg-slate-50/70 relative">
        <div className="flex items-center justify-between mb-1.5 px-1">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-emerald-600" /> Community Scope
          </span>
          {selectedCommunity !== 'ALL' && (
            <button
              onClick={() => handleSelectCommunity('ALL')}
              className="text-[10px] font-bold text-emerald-700 hover:underline"
            >
              Reset to All
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowCommunityDropdown(!showCommunityDropdown)}
          className="w-full flex items-center justify-between p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 transition-all shadow-2xs active:scale-[0.98]"
        >
          <div className="flex items-center gap-2 truncate">
            {selectedCommunity === 'ALL' ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            ) : (
              <Building2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            )}
            <span className="truncate font-extrabold text-slate-900">
              {selectedCommunity === 'ALL'
                ? 'All Communities Combined'
                : selectedCommunityObj?.name || selectedCommunity}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 ml-1" />
        </button>

        {/* Dropdown Menu */}
        {showCommunityDropdown && (
          <div className="absolute left-3.5 right-3.5 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-1.5 overflow-hidden animate-in fade-in duration-150">
            <div className="p-2 border-b border-slate-100">
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 rounded-xl border border-slate-200">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search community..."
                  className="w-full bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto">
              <button
                onClick={() => handleSelectCommunity('ALL')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-left transition-colors ${
                  selectedCommunity === 'ALL'
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-emerald-600" /> All Communities Combined
                </span>
                {selectedCommunity === 'ALL' && <Check className="w-4 h-4 text-emerald-600" />}
              </button>

              <div className="my-1 border-t border-slate-100" />

              {filteredCommunities.map((comm) => {
                const isSelected = selectedCommunity === comm.id || selectedCommunity === comm.name;
                return (
                  <button
                    key={comm.id}
                    onClick={() => handleSelectCommunity(comm.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-800 font-bold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span className="truncate flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{comm.name}</span>
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Quick Link to Manage All Societies */}
            <div className="p-2 border-t border-slate-100 bg-slate-50/70">
              <Link
                href="/communities"
                onClick={() => setShowCommunityDropdown(false)}
                className="w-full py-1.5 px-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Settings className="w-3 h-3 text-emerald-600" />
                <span>Configure Societies & Gates</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ── 3. MAIN MENU: Primary Categories List ── */}
      <div className="p-3.5 flex-1 overflow-y-auto space-y-1">
        <p className="px-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
          Navigation Modules
        </p>

        {primarySections.map((section) => {
          const isActive = activeSection.id === section.id;
          return (
            <Link
              key={section.id}
              href={section.defaultHref}
              onClick={() => setIsMobileOpen?.(false)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/90 shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <section.icon
                  className={`w-4 h-4 flex-shrink-0 ${
                    isActive ? 'text-emerald-700' : 'text-slate-500'
                  }`}
                />
                <span>{section.label}</span>
              </div>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              )}
            </Link>
          );
        })}
      </div>

      {/* ── 4. Admin User Profile & Logout Footer ── */}
      <div className="p-3.5 border-t border-slate-200/90 bg-slate-50/70">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
              {user?.email ? user.email[0].toUpperCase() : 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-slate-900 truncate leading-tight">
                {user?.email ? user.email.split('@')[0] : 'Admin'}
              </p>
              <p className="text-[10px] text-slate-500 capitalize truncate font-medium">
                {user?.role?.replace('_', ' ') || 'Super Admin'}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-8 h-8 rounded-lg bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 flex items-center justify-center transition-colors"
            title="Log out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
