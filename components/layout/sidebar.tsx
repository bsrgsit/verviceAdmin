'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  ChevronDown,
  Check,
  Search,
  Globe,
  Settings,
  X,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useCommunity } from '@/lib/community-context';
import { primarySections, getActivePrimarySection } from '@/lib/navigation-config';

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

  const activeSection = getActivePrimarySection(pathname);

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
      {/* ── 1. Top Section: Community Scope Switcher ── */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/60 relative">
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

      {/* ── 2. Contextual Sub-Menu for Active Primary Section ── */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <activeSection.icon className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-xs font-extrabold text-white uppercase tracking-wider">
              {activeSection.label}
            </h2>
            <p className="text-[10px] text-slate-400 font-medium">Sub-Menu Navigation</p>
          </div>
        </div>
      </div>

      {/* ── 3. Sub-Menu Items List ── */}
      <nav className="flex-1 p-3 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
        {activeSection.subItems.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen?.(false)}
              className={`flex flex-col p-3 rounded-2xl transition-all border ${
                isActive
                  ? 'bg-emerald-600 text-white font-bold shadow-md border-emerald-400/40'
                  : 'bg-slate-850/50 border-slate-800 text-slate-200 hover:bg-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-emerald-400'}`} />
                  <span className="text-xs font-bold leading-tight">{item.label}</span>
                </div>
                {isActive && <ArrowRight className="w-3.5 h-3.5 text-white" />}
              </div>
              <p className={`text-[10px] mt-1.5 leading-relaxed ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}>
                {item.description}
              </p>
            </Link>
          );
        })}
      </nav>

      {/* ── 4. Switch Primary Category on Mobile / Compact ── */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/80">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
          Switch Category
        </p>
        <div className="grid grid-cols-3 gap-1 text-[10px]">
          {primarySections.map((sec) => {
            const isCurrent = sec.id === activeSection.id;
            return (
              <Link
                key={sec.id}
                href={sec.defaultHref}
                onClick={() => setIsMobileOpen?.(false)}
                className={`p-1.5 rounded-lg text-center font-bold truncate transition-colors ${
                  isCurrent
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white'
                }`}
              >
                {sec.label.split(' ')[0]}
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
