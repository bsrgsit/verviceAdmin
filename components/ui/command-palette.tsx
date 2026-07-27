'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open handled by parent or shortcut
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const pages = [
    { name: 'Dashboard Overview', href: '/', icon: Building2, category: 'Pages' },
    { name: 'Communities Directory', href: '/communities', icon: Building2, category: 'Pages' },
    { name: 'Bookings & Subscriptions', href: '/bookings', icon: FileText, category: 'Pages' },
    { name: 'Users & Residents', href: '/users', icon: Users, category: 'Pages' },
    { name: 'Payments Verification', href: '/payments', icon: CreditCard, category: 'Pages' },
    { name: 'Invoices & Billing', href: '/invoices', icon: Receipt, category: 'Pages' },
    { name: 'Battery Requests', href: '/battery-requests', icon: Battery, category: 'Pages' },
    { name: 'Driver Hire Requests', href: '/driver-requests', icon: Car, category: 'Pages' },
    { name: 'Support Tickets', href: '/support-tickets', icon: HelpCircle, category: 'Pages' },
    { name: 'Audit Log', href: '/audit-log', icon: History, category: 'Pages' },
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

  const handleSelectCommunity = (id: string, name: string) => {
    setSelectedCommunity(id);
    router.push('/communities');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-20 px-4 animate-in fade-in duration-150">
      <div
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search pages, communities, or actions... (Esc to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm font-medium text-slate-900 focus:outline-none placeholder-slate-400"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200/50 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-4">
          {/* Communities */}
          {filteredCommunities.length > 0 && (
            <div>
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Filter by Community
              </p>
              <div className="space-y-0.5">
                {filteredCommunities.slice(0, 5).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCommunity(c.id, c.name)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors group text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 bg-emerald-100/70 text-emerald-700 rounded flex items-center justify-center font-bold text-[10px]">
                        🏢
                      </div>
                      <div>
                        <span>{c.name}</span>
                        {c.city && <span className="text-[10px] text-slate-400 ml-2">({c.city})</span>}
                      </div>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      Select Community <ArrowRight className="w-3 h-3" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pages */}
          {filteredPages.length > 0 && (
            <div>
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Navigation & Pages
              </p>
              <div className="space-y-0.5">
                {filteredPages.map((page) => (
                  <button
                    key={page.href}
                    onClick={() => handleSelectPage(page.href)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <page.icon className="w-4 h-4 text-slate-400" />
                      <span>{page.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Jump</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredPages.length === 0 && filteredCommunities.length === 0 && (
            <p className="text-center py-8 text-xs text-slate-400 font-medium">
              No matching pages or communities found
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium px-4">
          <span>Navigate with mouse or click item</span>
          <span className="font-mono bg-slate-200/60 px-1.5 py-0.5 rounded text-slate-600">Esc to dismiss</span>
        </div>
      </div>
    </div>
  );
}
