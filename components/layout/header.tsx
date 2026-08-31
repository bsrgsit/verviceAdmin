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
  Car,
  ChevronRight,
  Globe,
} from 'lucide-react';
import { useCommunity } from '@/lib/community-context';
import CommandPalette from '@/components/ui/command-palette';
import { primarySections, getActivePrimarySection } from '@/lib/navigation-config';

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

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-slate-100 shadow-md">
        {/* Top Header Row */}
        <div className="px-4 lg:px-6 py-2.5 flex items-center justify-between gap-4">
          {/* Left: Mobile Toggle & Brand & Active Section Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden w-9 h-9 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center hover:bg-slate-700"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white shadow-sm">
                <Car className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-white text-sm tracking-tight hidden sm:inline">Vervice</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 hidden sm:inline" />
              <span className="text-xs font-bold text-emerald-400">
                {activeSection.label}
              </span>
            </div>
          </div>

          {/* Center: Primary Section Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            {primarySections.map((section) => {
              const isActive = activeSection.id === section.id;
              return (
                <Link
                  key={section.id}
                  href={section.defaultHref}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-emerald-600 text-white font-bold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <section.icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{section.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right: Scope Pill + Search + Quick Actions + User */}
          <div className="flex items-center gap-2">
            {/* Active Community Scope Pill */}
            {selectedCommunity !== 'ALL' ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/80 border border-emerald-700/60 rounded-full text-xs font-bold text-emerald-300">
                <Building2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="max-w-[120px] truncate">{selectedCommunityObj?.name || selectedCommunity}</span>
                <button
                  onClick={() => setSelectedCommunity('ALL')}
                  title="Reset scope to All"
                  className="w-3.5 h-3.5 rounded-full bg-emerald-800 hover:bg-emerald-700 text-emerald-100 flex items-center justify-center"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ) : (
              <span className="hidden xl:flex text-xs font-semibold text-slate-400 items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                All Societies
              </span>
            )}

            {/* Quick Search */}
            <button
              onClick={() => setShowCommandPalette(true)}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-xs font-medium text-slate-300 transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Search</span>
              <kbd className="text-[9px] font-mono bg-slate-900 px-1 py-0.5 rounded border border-slate-700 text-slate-400">
                ⌘K
              </kbd>
            </button>

            {/* Quick Actions Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowQuickActions(!showQuickActions)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Action</span>
              </button>

              {showQuickActions && (
                <div
                  className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-700 rounded-2xl shadow-xl z-50 py-1.5 text-slate-200 animate-in fade-in duration-150"
                  onMouseLeave={() => setShowQuickActions(false)}
                >
                  <div className="px-3 py-1.5 border-b border-slate-800">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Quick Operations
                    </p>
                  </div>
                  <Link
                    href="/communities"
                    onClick={() => setShowQuickActions(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold hover:bg-slate-800 text-slate-200 hover:text-white"
                  >
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    <span>Add New Society</span>
                  </Link>
                  <Link
                    href="/bookings"
                    onClick={() => setShowQuickActions(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold hover:bg-slate-800 text-slate-200 hover:text-white"
                  >
                    <Car className="w-4 h-4 text-blue-400" />
                    <span>Assign Booking</span>
                  </Link>
                  <Link
                    href="/banners"
                    onClick={() => setShowQuickActions(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold hover:bg-slate-800 text-slate-200 hover:text-white"
                  >
                    <Plus className="w-4 h-4 text-purple-400" />
                    <span>Publish App Banner</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-rose-900/60 hover:text-rose-300 text-slate-400 flex items-center justify-center transition-colors"
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
