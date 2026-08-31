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
  Building2,
  BatteryCharging,
  Car,
  UserCheck,
  Globe,
  MapPin,
  Check,
} from 'lucide-react';
import { useCommunity } from '@/lib/community-context';
import { formatCurrency, timeAgo } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

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
        <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
        <p className="text-xs font-semibold text-slate-500">Loading operations dashboard...</p>
      </div>
    );
  }

  const isAllView = selectedCommunity === 'ALL';
  const activeCommunityData = !isAllView ? communities[0] || selectedCommunityObj : null;

  return (
    <div className="space-y-6">
      {/* ── 1. SCOPED COMMUNITY HERO (IF SINGLE COMMUNITY SELECTED) ── */}
      {!isAllView && activeCommunityData && (
        <Card className="border-emerald-200/80 bg-gradient-to-r from-emerald-50/70 via-white to-emerald-50/30 shadow-sm">
          <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Badge variant="success">Active Hub Scope</Badge>
                <span className="text-xs text-slate-400 font-mono">ID: {activeCommunityData.id}</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                {activeCommunityData.name}
              </h2>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {activeCommunityData.address || activeCommunityData.city || 'Bangalore, Karnataka'}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Link href={`/communities/${activeCommunityData.id}`}>
                <Button variant="outline" size="sm">
                  Society Settings
                </Button>
              </Link>
              <Button
                variant="default"
                size="sm"
                onClick={() => setSelectedCommunity('ALL')}
              >
                Switch to All Communities View
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── 2. EXECUTIVE KPI CARDS (SHADCN CARD) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Revenue */}
        <Link href="/payments" className="group">
          <Card className="hover:border-emerald-500/50 hover:shadow-md transition-all h-full">
            <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {isAllView ? 'Total Monthly Revenue' : 'Hub Revenue'}
              </CardTitle>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <TrendingUp className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                {formatCurrency(stats?.monthlyRevenue || 0)}
              </p>
              <p className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified payments
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Card 2: Active Cleaning Bookings */}
        <Link href="/bookings" className="group">
          <Card className="hover:border-emerald-500/50 hover:shadow-md transition-all h-full">
            <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Active Subscriptions
              </CardTitle>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileText className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                {stats?.activeBookings || bookings.length}
              </p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                Active daily wash schedules
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Card 3: Residents & Vehicles */}
        <Link href="/users" className="group">
          <Card className="hover:border-emerald-500/50 hover:shadow-md transition-all h-full">
            <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Registered Residents
              </CardTitle>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Users className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                {stats?.totalUsers || 0}
              </p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                {isAllView ? 'Across all communities' : activeCommunityData?.name}
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Card 4: Pending Approvals */}
        <Link href="/payments" className="group">
          <Card className="hover:border-amber-500/50 hover:shadow-md transition-all h-full">
            <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Pending Approvals
              </CardTitle>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <p className="text-2xl font-black text-amber-600 tracking-tight">
                {stats?.pendingPayments || pendingPayments.length}
              </p>
              <p className="text-[11px] text-amber-700 font-semibold mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Action required
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* ── 3. COMMUNITY MATRIX (ALL COMMUNITIES MODE) ── */}
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
            <Link href="/communities">
              <Button variant="link" size="sm" className="text-emerald-700 font-bold p-0">
                Manage all societies ({communities.length}) →
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {communities.map((comm) => (
              <Card key={comm.id} className="hover:shadow-md transition-all flex flex-col justify-between">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm leading-tight">{comm.name}</h3>
                        <p className="text-[11px] text-slate-400">{comm.city || 'Bangalore'}</p>
                      </div>
                    </div>
                    <Badge variant="success">Active 🟢</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl text-xs mt-3 border border-slate-100">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Residents</span>
                      <span className="font-black text-slate-900 text-sm">{comm.neighborCount || comm.usersCount || 18}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Blocks / Towers</span>
                      <span className="font-black text-slate-900 text-sm">{comm.blocks?.length || 4}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setSelectedCommunity(comm.id)}
                      className="flex-1"
                    >
                      View Hub Dashboard
                    </Button>
                    <Link href={`/communities/${comm.id}`}>
                      <Button variant="outline" size="sm" className="px-2.5">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── 4. CENTRAL OPERATIONS TABS (SHADCN TABS) ── */}
      <Card>
        <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/50">
          <Tabs defaultValue="payments" className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <TabsList className="bg-slate-200/60 p-1">
                <TabsTrigger value="payments" className="gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pending Approvals</span>
                  {pendingPayments.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px]">
                      {pendingPayments.length}
                    </span>
                  )}
                </TabsTrigger>

                <TabsTrigger value="cleaners" className="gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cleaner Staff</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">
                    {partners.length}
                  </span>
                </TabsTrigger>

                <TabsTrigger value="emergency" className="gap-1.5">
                  <BatteryCharging className="w-3.5 h-3.5 text-blue-500" />
                  <span>Emergency Services</span>
                </TabsTrigger>

                <TabsTrigger value="audit" className="gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-purple-500" />
                  <span>Audit Logs</span>
                </TabsTrigger>
              </TabsList>

              <Link href="/payments">
                <Button variant="link" size="sm" className="text-emerald-700 font-bold p-0 text-xs">
                  View Full Module →
                </Button>
              </Link>
            </div>

            {/* TAB 1: PENDING APPROVALS */}
            <TabsContent value="payments" className="pt-3">
              {pendingPayments.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-900">All Payments Verified!</h4>
                  <p className="text-xs text-slate-400">No pending manual UPI transactions awaiting approval.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {pendingPayments.slice(0, 5).map((payment) => (
                    <div
                      key={payment.id}
                      className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/70 px-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
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
                        <Link href="/payments">
                          <Button size="sm" variant="default">Review</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* TAB 2: CLEANER STAFF */}
            <TabsContent value="cleaners" className="pt-3">
              {partners.length === 0 ? (
                <div className="py-8 text-center space-y-2">
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
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                          {partner.name ? partner.name[0] : 'C'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{partner.name || 'Cleaner'}</p>
                          <p className="text-[10px] text-slate-500">{partner.phone || 'On Duty'}</p>
                        </div>
                      </div>
                      <Badge variant="success">{partner.status || 'Active'}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* TAB 3: EMERGENCY SERVICES */}
            <TabsContent value="emergency" className="pt-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <BatteryCharging className="w-4 h-4 text-amber-500" /> Battery Jumpstart Requests
                    </span>
                    <Link href="/battery-requests">
                      <Button variant="link" size="sm" className="p-0 text-emerald-700 text-xs font-bold">View all →</Button>
                    </Link>
                  </div>
                  <p className="text-2xl font-black text-slate-900">
                    {stats?.pendingBatteryRequests || 0}{' '}
                    <span className="text-xs font-semibold text-slate-400">pending</span>
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Car className="w-4 h-4 text-blue-500" /> Driver Hire Requests
                    </span>
                    <Link href="/driver-requests">
                      <Button variant="link" size="sm" className="p-0 text-emerald-700 text-xs font-bold">View all →</Button>
                    </Link>
                  </div>
                  <p className="text-2xl font-black text-slate-900">
                    {stats?.pendingDriverRequests || 0}{' '}
                    <span className="text-xs font-semibold text-slate-400">pending</span>
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* TAB 4: AUDIT LOGS */}
            <TabsContent value="audit" className="pt-3">
              <div className="space-y-2">
                {recentActivity.slice(0, 5).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
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
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>
    </div>
  );
}
