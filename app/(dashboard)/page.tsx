'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  FileText,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  Clock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Building2,
  BatteryCharging,
  HelpCircle,
  Car,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useCommunity } from '@/lib/community-context';
import { formatCurrency, timeAgo } from '@/lib/utils';

interface DashboardStats {
  totalUsers: number;
  activeBookings: number;
  pendingPayments: number;
  overdueBookings: number;
  monthlyRevenue: number;
  pendingBatteryRequests: number;
  pendingDriverRequests: number;
  openSupportTickets: number;
}

interface AuditEntry {
  id: string;
  adminEmail: string;
  action: string;
  targetId: string;
  targetType: string;
  details: string;
  timestamp: number;
}

export default function DashboardPage() {
  const { selectedCommunity, selectedCommunityObj } = useCommunity();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<AuditEntry[]>([]);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllStats, setShowAllStats] = useState(false);

  useEffect(() => {
    setLoading(true);
    const statsUrl =
      selectedCommunity !== 'ALL'
        ? `/api/communities/${selectedCommunity}/stats`
        : '/api/dashboard/stats';

    Promise.all([
      fetch(statsUrl).then((r) => r.json()),
      fetch('/api/dashboard/activity').then((r) => r.json()),
      fetch('/api/dashboard/pending').then((r) => r.json()),
      fetch('/api/communities').then((r) => r.json()),
    ])
      .then(([statsData, activityData, pendingData, communitiesData]) => {
        setStats(statsData?.error ? null : statsData);
        setRecentActivity(Array.isArray(activityData) ? activityData : []);

        const rawPending = Array.isArray(pendingData) ? pendingData : [];
        const rawCommunities = Array.isArray(communitiesData) ? communitiesData : [];

        if (selectedCommunity !== 'ALL') {
          const commName = selectedCommunityObj?.name || selectedCommunity;
          setPendingPayments(
            rawPending.filter(
              (p: any) =>
                p.community === commName ||
                p.userCommunity === commName ||
                p.communityId === selectedCommunity
            )
          );
          setCommunities(
            rawCommunities.filter(
              (c: any) => c.id === selectedCommunity || c.name === commName
            )
          );
        } else {
          setPendingPayments(rawPending);
          setCommunities(rawCommunities);
        }
      })
      .finally(() => setLoading(false));
  }, [selectedCommunity, selectedCommunityObj]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const primaryStats = [
    {
      label: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'bg-blue-500/10 text-blue-600',
      href: '/users',
    },
    {
      label: 'Active Bookings',
      value: stats?.activeBookings || 0,
      icon: FileText,
      color: 'bg-emerald-500/10 text-emerald-600',
      href: '/bookings',
    },
    {
      label: 'Pending Payments',
      value: stats?.pendingPayments || 0,
      icon: Clock,
      color: 'bg-amber-500/10 text-amber-600',
      href: '/payments',
    },
    {
      label: 'Monthly Revenue',
      value: formatCurrency(stats?.monthlyRevenue || 0),
      icon: TrendingUp,
      color: 'bg-violet-500/10 text-violet-600',
      href: '/payments',
    },
  ];

  const secondaryStats = [
    {
      label: 'Overdue Bookings',
      value: stats?.overdueBookings || 0,
      icon: AlertTriangle,
      color: 'bg-rose-500/10 text-rose-600',
      href: '/bookings',
    },
    {
      label: 'Battery Requests',
      value: stats?.pendingBatteryRequests || 0,
      icon: BatteryCharging,
      color: 'bg-yellow-500/10 text-yellow-600',
      href: '/battery-requests',
    },
    {
      label: 'Driver Requests',
      value: stats?.pendingDriverRequests || 0,
      icon: Car,
      color: 'bg-cyan-500/10 text-cyan-600',
      href: '/driver-requests',
    },
    {
      label: 'Support Tickets',
      value: stats?.openSupportTickets || 0,
      icon: HelpCircle,
      color: 'bg-rose-500/10 text-rose-600',
      href: '/support-tickets',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {primaryStats.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="premium-card p-5 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center`}>
                <card.icon className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{card.value}</p>
              <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">{card.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Expandable Secondary Stats */}
      <div className="border border-slate-100 rounded-xl bg-slate-50/50 p-4">
        <button
          onClick={() => setShowAllStats(!showAllStats)}
          className="w-full flex items-center justify-between text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <span className="flex items-center gap-2">
            Other Operational Metrics
            <span className="bg-slate-200 text-slate-700 px-2 py-0.5 text-xs rounded-full font-semibold">
              {secondaryStats.length}
            </span>
          </span>
          {showAllStats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showAllStats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
            {secondaryStats.map((card) => (
              <Link
                key={card.label}
                href={card.href}
                className="bg-white border border-slate-100 rounded-lg p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-8 h-8 ${card.color} rounded-lg flex items-center justify-center`}>
                    <card.icon className="w-4 h-4" />
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div>
                  <p className="text-xl font-extrabold text-slate-900 tracking-tight">{card.value}</p>
                  <p className="text-[10px] font-bold text-slate-500 mt-0.5 uppercase tracking-wider">{card.label}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Communities Section */}
      {communities.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Active Communities</h2>
            <Link href="/communities" className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
              Manage all communities
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {communities.slice(0, 4).map((community) => (
              <Link
                key={community.id}
                href={`/communities/${community.id}`}
                className="premium-card p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-brand-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{community.name}</h3>
                      <p className="text-[10px] text-slate-400 font-semibold">{community.city}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100">
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Residents</p>
                      <p className="text-sm font-bold text-slate-900">{community.neighborCount || 0}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Blocks</p>
                      <p className="text-sm font-bold text-slate-900">{community.blocks?.length || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-brand-600 font-semibold pt-2 border-t border-slate-50">
                  <span>View Details</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Payments */}
        <div className="bg-white border border-slate-100 rounded-xl shadow-premium overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Pending Payments Log</h3>
            <Link href="/payments" className="text-xs font-semibold text-brand-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="p-4">
            {pendingPayments.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-8 font-medium">
                No pending payments awaiting verification
              </p>
            ) : (
              <div className="space-y-2.5">
                {pendingPayments.slice(0, 5).map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-100 rounded-lg transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 text-xs">
                        {payment.userName || 'Unknown User'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">{payment.upiAppName || 'Manual'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900 text-xs">
                        {formatCurrency(payment.amount)}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">{timeAgo(payment.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-slate-100 rounded-xl shadow-premium overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Recent Audit Log</h3>
            <Link href="/audit-log" className="text-xs font-semibold text-brand-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="p-4">
            {recentActivity.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-8 font-medium">
                No recent system activity recorded
              </p>
            ) : (
              <div className="space-y-2.5">
                {recentActivity.slice(0, 5).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-100 rounded-lg transition-colors"
                  >
                    {entry.action.includes('verified') || entry.action === 'login' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-900 leading-relaxed">
                        <span className="font-bold">{entry.adminEmail}</span>{' '}
                        {entry.action}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{entry.details}</p>
                    </div>
                    <span className="text-[9px] text-slate-400 flex-shrink-0 font-medium">
                      {timeAgo(entry.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
