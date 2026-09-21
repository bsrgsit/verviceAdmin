'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Building2,
  FileText,
  Users,
  CreditCard,
  Receipt,
  Battery,
  Car,
  HelpCircle,
  History,
  X,
  ArrowRight,
  Sparkles,
  Smartphone,
  CheckCircle2,
  Sliders,
  TrendingUp,
} from 'lucide-react';
import { useCommunity } from '@/lib/community-context';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const { communities, setSelectedCommunity } = useCommunity();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    residents: any[];
    vehicles: any[];
    payments: any[];
    communities: any[];
  }>({
    residents: [],
    vehicles: [],
    payments: [],
    communities: [],
  });
  const [loadingSearch, setLoadingSearch] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K / Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset query on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSearchResults({ residents: [], vehicles: [], payments: [], communities: [] });
    }
  }, [isOpen]);

  // Debounced search against backend API
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults({ residents: [], vehicles: [], payments: [], communities: [] });
      setLoadingSearch(false);
      return;
    }

    setLoadingSearch(true);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoadingSearch(false);
      }
    }, 250);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

  if (!isOpen) return null;

  const pages = [
    { name: 'Dashboard Overview', href: '/', icon: Building2, category: 'Pages' },
    { name: 'Services & Pricing Catalog', href: '/services-catalog', icon: Sparkles, category: 'Pages' },
    { name: 'Mobile Layout & Quick Actions', href: '/mobile-layout', icon: Smartphone, category: 'Pages' },
    { name: 'Cleaning Schedules & Bookings', href: '/bookings', icon: FileText, category: 'Pages' },
    { name: 'Residents & Vehicles', href: '/users', icon: Users, category: 'Pages' },
    { name: 'Payment Approvals', href: '/payments', icon: CreditCard, category: 'Pages' },
    { name: 'Monthly Invoices', href: '/invoices', icon: Receipt, category: 'Pages' },
    { name: 'Cleaner Fleet & Staff', href: '/partners', icon: CheckCircle2, category: 'Pages' },
    { name: 'Battery Jumpstart Requests', href: '/battery-requests', icon: Battery, category: 'Pages' },
    { name: 'Driver Hire Requests', href: '/driver-requests', icon: Car, category: 'Pages' },
    { name: 'Support Tickets Helpdesk', href: '/support-tickets', icon: HelpCircle, category: 'Pages' },
    { name: 'Feature Flags & Config', href: '/app-config', icon: Sliders, category: 'Pages' },
    { name: 'Banners & Promotions', href: '/banners', icon: Sparkles, category: 'Pages' },
    { name: 'Manage Societies & Hubs', href: '/communities', icon: Building2, category: 'Pages' },
    { name: 'System Audit Logs', href: '/audit-log', icon: History, category: 'Pages' },
    { name: 'Revenue Reports', href: '/reports', icon: TrendingUp, category: 'Pages' },
  ];

  const filteredPages = pages.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  const filteredCommunities = communities.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      (c.city && c.city.toLowerCase().includes(query.toLowerCase()))
  );

  const handleSelectPage = (href: string) => {
    router.push(href);
    onClose();
  };

  const handleSelectCommunity = (id: string) => {
    setSelectedCommunity(id);
    router.push(`/communities/${id}`);
    onClose();
  };

  const hasApiResults =
    searchResults.vehicles.length > 0 ||
    searchResults.residents.length > 0 ||
    searchResults.payments.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-16 px-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── SEARCH INPUT BAR ── */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/70">
          <Search className="w-5 h-5 text-emerald-600 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search vehicles (e.g. KA03), residents, flats, UTR payments, or pages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm font-semibold text-slate-900 focus:outline-none placeholder-slate-400"
          />
          {loadingSearch && (
            <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0" />
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── RESULTS LIST ── */}
        <div className="overflow-y-auto p-3 space-y-4 text-xs">
          {/* 1. Vehicles Search Results */}
          {searchResults.vehicles.length > 0 && (
            <div>
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-blue-600" />
                Vehicles Found ({searchResults.vehicles.length})
              </p>
              <div className="space-y-1">
                {searchResults.vehicles.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => handleSelectPage(v.href)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50/70 hover:bg-blue-50/70 hover:border-blue-200 border border-slate-100 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs font-mono">
                        🚗
                      </div>
                      <div>
                        <span className="font-mono font-extrabold text-slate-900 text-xs tracking-wide">
                          {v.title}
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">{v.subtitle}</p>
                      </div>
                    </div>
                    <span className="text-[11px] text-blue-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      {v.actionText || 'View Booking'} <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. Residents Search Results */}
          {searchResults.residents.length > 0 && (
            <div>
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-purple-600" />
                Residents ({searchResults.residents.length})
              </p>
              <div className="space-y-1">
                {searchResults.residents.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleSelectPage(r.href)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50/70 hover:bg-purple-50/70 hover:border-purple-200 border border-slate-100 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs">
                        👤
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-900 text-xs">{r.title}</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">{r.subtitle}</p>
                      </div>
                    </div>
                    <span className="text-[11px] text-purple-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      View Profile <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. Payments / UTR Search Results */}
          {searchResults.payments.length > 0 && (
            <div>
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                Transactions & UTR ({searchResults.payments.length})
              </p>
              <div className="space-y-1">
                {searchResults.payments.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPage(p.href)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50/70 hover:bg-amber-50/70 hover:border-amber-200 border border-slate-100 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                        ₹
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-900 text-xs">{p.title}</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">{p.subtitle}</p>
                      </div>
                    </div>
                    <span className="text-[11px] text-amber-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      Verify <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. Communities */}
          {filteredCommunities.length > 0 && (
            <div>
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                Societies & Hubs
              </p>
              <div className="space-y-1">
                {filteredCommunities.slice(0, 4).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCommunity(c.id)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors group text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-emerald-100/70 text-emerald-700 rounded-lg flex items-center justify-center font-bold text-[10px]">
                        🏢
                      </div>
                      <div>
                        <span className="font-bold text-slate-900">{c.name}</span>
                        {c.city && <span className="text-[10px] text-slate-400 ml-2">({c.city})</span>}
                      </div>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      Filter Hub <ArrowRight className="w-3 h-3" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 5. Navigation Pages */}
          {filteredPages.length > 0 && (
            <div>
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Navigation Shortcuts
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {filteredPages.slice(0, 8).map((page) => (
                  <button
                    key={page.href}
                    onClick={() => handleSelectPage(page.href)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <page.icon className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">{page.name}</span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono shrink-0 ml-1">Jump</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loadingSearch &&
            !hasApiResults &&
            filteredPages.length === 0 &&
            filteredCommunities.length === 0 && (
              <div className="text-center py-10 text-xs text-slate-400 font-medium space-y-1">
                <Search className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                <p>No matching residents, vehicles, payments, or pages found.</p>
                <p className="text-[11px] text-slate-400">Try searching by vehicle registration plate or resident name.</p>
              </div>
            )}
        </div>

        {/* ── FOOTER ── */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium px-4">
          <div className="flex items-center gap-3">
            <span>Tip: Search plate numbers like <strong className="text-slate-600 font-mono">KA03</strong> or UTR numbers</span>
          </div>
          <span className="font-mono bg-slate-200/60 px-1.5 py-0.5 rounded text-slate-600">
            Esc to dismiss
          </span>
        </div>
      </div>
    </div>
  );
}
