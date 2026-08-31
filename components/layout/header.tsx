'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  Search,
  Plus,
  X,
  Menu,
  ChevronRight,
  Home,
  Sliders,
  Car,
} from 'lucide-react';
import { useCommunity } from '@/lib/community-context';
import CommandPalette from '@/components/ui/command-palette';
import { getActivePrimarySection } from '@/lib/navigation-config';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export default function Header({
  onToggleMobileMenu,
}: {
  onToggleMobileMenu?: () => void;
}) {
  const pathname = usePathname();
  const { selectedCommunity, setSelectedCommunity, selectedCommunityObj } = useCommunity();
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  const activeSection = getActivePrimarySection(pathname);
  const currentSubItem = activeSection.subItems.find(
    (item) => item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(item.href + '/')
  ) || activeSection.subItems[0];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-2xs">
        {/* ── TOP ROW: Breadcrumbs & Controls ── */}
        <div className="px-4 lg:px-8 py-2.5 flex items-center justify-between gap-4 border-b border-slate-100 bg-white">
          {/* Left: Mobile Menu Toggle & Breadcrumbs */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 shrink-0"
            >
              <Menu className="w-4 h-4" />
            </button>

            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/" className="flex items-center gap-1">
                    <Home className="w-3.5 h-3.5 text-slate-400" />
                    <span className="hidden sm:inline">Home</span>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href={activeSection.defaultHref}>
                    {activeSection.label}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {currentSubItem && currentSubItem.href !== activeSection.defaultHref && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{currentSubItem.label}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Right: Community Scope Pill + Search + Action */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Active Community Scope Pill */}
            {selectedCommunity !== 'ALL' ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200/90 rounded-full text-xs font-bold text-emerald-800 shadow-2xs">
                <Building2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span className="max-w-[130px] truncate">{selectedCommunityObj?.name || selectedCommunity}</span>
                <button
                  onClick={() => setSelectedCommunity('ALL')}
                  title="Reset scope to All Communities"
                  className="w-3.5 h-3.5 rounded-full bg-emerald-200 hover:bg-emerald-300 text-emerald-900 flex items-center justify-center transition-colors"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ) : (
              <span className="hidden md:flex text-xs font-semibold text-slate-500 items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                All Societies
              </span>
            )}

            {/* Quick Search */}
            <button
              onClick={() => setShowCommandPalette(true)}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Search...</span>
              <kbd className="text-[9px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-500 shadow-2xs">
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
                <span className="hidden sm:inline">New</span>
              </button>

              {showQuickActions && (
                <div
                  className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-1.5 text-slate-700 animate-in fade-in duration-150"
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
                    className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 text-slate-800"
                  >
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span>Add New Society</span>
                  </Link>
                  <Link
                    href="/bookings"
                    onClick={() => setShowQuickActions(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 text-slate-800"
                  >
                    <Car className="w-4 h-4 text-blue-600" />
                    <span>Assign Booking</span>
                  </Link>
                  <Link
                    href="/banners"
                    onClick={() => setShowQuickActions(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 text-slate-800"
                  >
                    <Sliders className="w-4 h-4 text-purple-600" />
                    <span>Publish App Banner</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── BOTTOM ROW: Contextual Sub-Menu Horizontal Tabs ── */}
        <div className="px-4 lg:px-8 py-2 bg-slate-50/70 overflow-x-auto flex items-center gap-2 scrollbar-none">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">
            {activeSection.label}:
          </span>

          <div className="flex items-center gap-1.5">
            {activeSection.subItems.map((subItem) => {
              const isActive =
                subItem.href === '/'
                  ? pathname === '/'
                  : pathname === subItem.href || pathname.startsWith(subItem.href + '/');

              return (
                <Link
                  key={subItem.href}
                  href={subItem.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 shadow-2xs'
                      : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-slate-200/70 font-semibold'
                  }`}
                >
                  <subItem.icon
                    className={`w-3.5 h-3.5 ${
                      isActive ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                  />
                  <span>{subItem.label}</span>
                </Link>
              );
            })}
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
