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
  UserCheck,
  Globe,
  Sparkles,
  MapPin,
  Check,
  ShieldAlert,
  Calendar,
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
  const { selectedCommunity, setSelectedCommunity, selectedCommunityObj } = useCommunity();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<AuditEntry[]>([]);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'payments' | 'cleaners' | 'emergency' | 'audit'>('payments');

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
      fetch('/api/partners').then((r) => r.json()),
      fetch('/api/bookings').then((r) => r.json()),
    ])
      .then(([statsData, activityData, pendingData, communitiesData, partnersData, bookingsData]) => {
        setStats(statsData?.error ? null : statsData);
        setRecentActivity(Array.isArray(activityData) ? activityData : []);

        const rawPending = Array.isArray(pendingData) ? pendingData : [];
        const rawCommunities = Array.isArray(communitiesData) ? communitiesData : [];
        const rawPartners = Array.isArray(partnersData) ? partnersData : [];
        const rawBookings = Array.isArray(bookingsData) ? bookingsData : [];

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
          setPartners(
            rawPartners.filter(
              (p: any) =>
                p.assignedCommunityId === selectedCommunity ||
                p.assignedCommunity === commName ||
                (p.communities && p.communities.includes(commName))
            )
          );
          setBookings(
            rawBookings.filter(
              (b: any) =>
                b.communityId === selectedCommunity ||
                b.community === commName
            )
          );
        } else {
          setPendingPayments(rawPending);
          setCommunities(rawCommunities);
          setPartners(rawPartners);
          setBookings(rawBookings);
        }
      })
      .finally(() => setLoading(false));
  }, [selectedCommunity, selectedCommunityObj]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 space-y-3">
        <div className="animate-spin w-9 h-9 border-4 border-emerald-500 border-t-transparent rounded-full" />
        <p className="text-xs font-semibold text-slate-500">Loading operations dashboard...</p>
      </div>
    );
  }

  const isAllView = selectedCommunity === 'ALL';
  const activeCommunityData = !isAllView ? communities[0] || selectedCommunityObj : null;

  return (
    <div className="space-y-6">
      {/* ── SCENARIO A: SINGLE COMMUNITY SCOPED HERO ── */}
      {!isAllView && activeCommunityData && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-3xl p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active Community Hub
                </span>
                <span className="text-xs text-slate-400">ID: {activeCommunityData.id}</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <Building2 className="w-6 h-6 text-emerald-400" />
                {activeCommunityData.name}
              </h2>
              <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {activeCommunityData.address || activeCommunityData.city || 'Bangalore, Karnataka'}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Link
                href={`/communities/${activeCommunityData.id}`}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs font-bold transition-all border border-slate-700"
              >
                Society Settings
              </Link>
              <button
                onClick={() => setSelectedCommunity('ALL')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
              >
                Switch to All Communities View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOP KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Revenue */}
        <Link
          href="/payments"
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-500/40 transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {isAllView ? 'Total Monthly Revenue' : 'Hub Monthly Revenue'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(stats?.monthlyRevenue || 0)}
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified collection
            </p>
          </div>
        </Link>

        {/* Card 2: Active Cleaning Bookings */}
        <Link
          href="/bookings"
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-500/40 transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Subscriptions
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 tracking-tight">
              {stats?.activeBookings || bookings.length}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Active daily car wash plans
            </p>
          </div>
        </Link>

        {/* Card 3: Residents & Vehicles */}
        <Link
          href="/users"
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-purple-500/40 transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Registered Residents
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 tracking-tight">
              {stats?.totalUsers || 0}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              In {isAllView ? 'all gated societies' : activeCommunityData?.name}
            </p>
          </div>
        </Link>

        {/* Card 4: Pending Approvals */}
        <Link
          href="/payments"
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-amber-500/40 transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pending Approvals
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-amber-600 tracking-tight">
              {stats?.pendingPayments || pendingPayments.length}
            </p>
            <p className="text-[11px] text-amber-700 font-semibold mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Action required
            </p>
          </div>
        </Link>
      </div>

      {/* ── SCENARIO A ONLY: COMMUNITY OPERATIONS MATRIX GRID ── */}
      {isAllView && communities.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Society & Hub Matrix
              </h2>
              <p className="text-xs text-slate-500">
                Click any society card to focus the entire portal on that hub
              </p>
            </div>
            <Link
              href="/communities"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              Manage all societies ({communities.length}) →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {communities.map((comm) => (
              <div
                key={comm.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm leading-tight">{comm.name}</h3>
                        <p className="text-[11px] text-slate-400">{comm.city || 'Bangalore'}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active 🟢
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl text-xs mt-3">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Residents</span>
                      <span className="font-black text-slate-900 text-sm">{comm.neighborCount || comm.usersCount || 18}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Blocks / Towers</span>
                      <span className="font-black text-slate-900 text-sm">{comm.blocks?.length || 4}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedCommunity(comm.id)}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all text-center"
                  >
                    View Hub Dashboard
                  </button>
                  <Link
                    href={`/communities/${comm.id}`}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                    title="Settings"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CENTRAL OPERATIONAL HUB TABS ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Tab Header */}
        <div className="border-b border-slate-200 bg-slate-50/70 p-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'payments'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 text-amber-500" />
              <span>Pending Approvals</span>
              {pendingPayments.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px]">
                  {pendingPayments.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('cleaners')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'cleaners'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Cleaner Staff</span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">
                {partners.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('emergency')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'emergency'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <BatteryCharging className="w-3.5 h-3.5 text-blue-500" />
              <span>Emergency & Drivers</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'audit'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-purple-500" />
              <span>Audit Log</span>
            </button>
          </div>

          <Link
            href={
              activeTab === 'payments'
                ? '/payments'
                : activeTab === 'cleaners'
                ? '/partners'
                : activeTab === 'emergency'
                ? '/battery-requests'
                : '/audit-log'
            }
            className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
          >
            View Full Module →
          </Link>
        </div>

        {/* Tab Content */}
        <div className="p-5">
          {/* TAB 1: PENDING APPROVALS */}
          {activeTab === 'payments' && (
            <div>
              {pendingPayments.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-900">All Payments Verified!</h4>
                  <p className="text-xs text-slate-400">No pending manual UPI transactions awaiting approval.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {pendingPayments.slice(0, 6).map((payment) => (
                    <div
                      key={payment.id}
                      className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/50 px-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
                          UPI
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-slate-900">{payment.userName || 'Resident'}</p>
                          <p className="text-[10px] text-slate-400">
                            {payment.community || payment.userCommunity || 'Community'} • Ref: {payment.utrNumber || payment.id}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs font-black text-slate-900">{formatCurrency(payment.amount)}</p>
                          <p className="text-[10px] text-slate-400">{timeAgo(payment.createdAt)}</p>
                        </div>
                        <Link
                          href="/payments"
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs"
                        >
                          Review
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CLEANER STAFF */}
          {activeTab === 'cleaners' && (
            <div>
              {partners.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <UserCheck className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-600">No cleaners registered for this scope.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {partners.slice(0, 6).map((partner) => (
                    <div
                      key={partner.id}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                          {partner.name ? partner.name[0] : 'C'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{partner.name || 'Cleaner'}</p>
                          <p className="text-[10px] text-slate-500">{partner.phone || 'On Duty'}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {partner.status || 'Active'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EMERGENCY & DRIVERS */}
          {activeTab === 'emergency' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <BatteryCharging className="w-4 h-4 text-amber-500" /> Battery Jumpstart Requests
                  </span>
                  <Link href="/battery-requests" className="text-[11px] font-bold text-emerald-600">
                    View all →
                  </Link>
                </div>
                <p className="text-2xl font-black text-slate-900">
                  {stats?.pendingBatteryRequests || 0}{' '}
                  <span className="text-xs font-semibold text-slate-400">pending</span>
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-blue-500" /> Driver Hire Requests
                  </span>
                  <Link href="/driver-requests" className="text-[11px] font-bold text-emerald-600">
                    View all →
                  </Link>
                </div>
                <p className="text-2xl font-black text-slate-900">
                  {stats?.pendingDriverRequests || 0}{' '}
                  <span className="text-xs font-semibold text-slate-400">pending</span>
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: AUDIT LOG */}
          {activeTab === 'audit' && (
            <div className="space-y-2">
              {recentActivity.slice(0, 5).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-900 font-medium">
                      <strong className="font-bold">{entry.adminEmail}</strong>: {entry.action}
                    </p>
                    <p className="text-[10px] text-slate-400">{entry.details}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold">{timeAgo(entry.timestamp)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
