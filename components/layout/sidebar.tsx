'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CreditCard,
  FileText,
  Users,
  Building2,
  History,
  Car,
  Receipt,
  UserCheck,
  Battery,
  HelpCircle,
} from 'lucide-react';

const sidebarGroups = [
  {
    title: 'Overview',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    ]
  },
  {
    title: 'Operations',
    items: [
      { href: '/communities', label: 'Communities', icon: Building2 },
      { href: '/bookings', label: 'Bookings', icon: FileText },
      { href: '/users', label: 'Users', icon: Users },
    ]
  },
  {
    title: 'Finance',
    items: [
      { href: '/payments', label: 'Payments', icon: CreditCard },
      { href: '/invoices', label: 'Invoices', icon: Receipt },
    ]
  },
  {
    title: 'Requests',
    items: [
      { href: '/battery-requests', label: 'Battery Requests', icon: Battery },
      { href: '/driver-requests', label: 'Driver Requests', icon: Car },
      { href: '/support-tickets', label: 'Support Tickets', icon: HelpCircle },
    ]
  },
  {
    title: 'System',
    items: [
      { href: '/partners', label: 'Partners', icon: UserCheck },
      { href: '/audit-log', label: 'Audit Log', icon: History },
    ]
  }
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col text-slate-300">
      {/* Logo */}
      <div className="p-6 border-b border-slate-850">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md shadow-emerald-950/20">
            <Car className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white tracking-tight">Vervice</h1>
            <p className="text-xs text-slate-400 font-medium">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-5 overflow-y-auto">
        {sidebarGroups.map((group) => (
          <div key={group.title} className="space-y-1.5">
            <h3 className="px-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              {group.title}
            </h3>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-850 bg-slate-950/40">
        <p className="text-[10px] text-slate-500 text-center font-medium">
          Vervice Admin v1.1 • Premium Redesign
        </p>
      </div>
    </aside>
  );
}
