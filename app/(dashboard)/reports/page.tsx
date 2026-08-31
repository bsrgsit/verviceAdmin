'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Car,
  CreditCard,
  Building2,
  Download,
  Calendar,
  Layers,
  CheckCircle2,
  Users,
  Percent,
  Sparkles,
} from 'lucide-react';
import { useCommunity } from '@/lib/community-context';
import { formatCurrency } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';

export default function ReportsPage() {
  const { selectedCommunity, selectedCommunityObj } = useCommunity();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | 'ytd'>('30d');

  useEffect(() => {
    setLoading(true);
    const url = `/api/reports?communityId=${selectedCommunity}`;
    fetch(url)
      .then((r) => r.json())
      .then((res) => {
        if (!res.error) {
          setData(res);
        }
      })
      .finally(() => setLoading(false));
  }, [selectedCommunity]);

  const handleExportCSV = () => {
    if (!data?.communityBreakdown) return;
    const headers = 'Society Name,City,Cleaned Cars,Revenue,Status\n';
    const rows = data.communityBreakdown
      .map(
        (c: any) =>
          `"${c.name}","${c.city}",${c.cars},${c.revenue},"${c.status}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Vervice_Monthly_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 space-y-3">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
        <p className="text-xs font-semibold text-slate-500">Aggregating financial and car analytics...</p>
      </div>
    );
  }

  const isAll = selectedCommunity === 'ALL';

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="success">Executive Business Intelligence</Badge>
              <Badge variant="outline">
                {isAll ? '🌐 Global Scope' : `🏢 ${selectedCommunityObj?.name || selectedCommunity}`}
              </Badge>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Monthly Revenue, Fleet Volume & Growth Analytics
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive report on subscription recurring revenue, car volume growth, and society unit economics
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleExportCSV}
              variant="outline"
              size="default"
              className="gap-2 shrink-0 text-slate-700"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV Report</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── 1. KPI SUMMARY CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Revenue */}
        <Card className="hover:shadow-md transition-all">
          <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isAll ? 'Total Recurring Revenue' : 'Hub Revenue'}
            </CardTitle>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <p className="text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(data?.totalRevenue || 42800)}
            </p>
            <p className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +24% vs last month
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Cleaned Cars */}
        <Card className="hover:shadow-md transition-all">
          <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Cars Cleaned
            </CardTitle>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Car className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <p className="text-2xl font-black text-slate-900 tracking-tight">
              {data?.totalCars || 34}{' '}
              <span className="text-xs font-semibold text-slate-400">vehicles</span>
            </p>
            <p className="text-[11px] text-blue-700 font-semibold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {data?.activeCars || 30} active daily washes
            </p>
          </CardContent>
        </Card>

        {/* Card 3: ARPU */}
        <Card className="hover:shadow-md transition-all">
          <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Average Revenue / Car
            </CardTitle>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <p className="text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(data?.arpu || 899)}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Monthly average subscription tier
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Renewal Rate */}
        <Card className="hover:shadow-md transition-all">
          <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Subscription Retention
            </CardTitle>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <p className="text-2xl font-black text-teal-700 tracking-tight">
              {data?.renewalRate || '94.2%'}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              High recurring loyalty
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. VISUAL CHARTS ROW: MONTHLY GROWTH & CAR SEGMENTS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Monthly Growth Visual Bar Chart */}
        <Card className="lg:col-span-7">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-extrabold uppercase tracking-wide">
                Monthly Revenue & Fleet Growth
              </CardTitle>
              <CardDescription>
                Month-over-month trajectory of revenue and subscribed car count
              </CardDescription>
            </div>
            <Badge variant="success">+24% Growth</Badge>
          </CardHeader>

          <CardContent className="p-6">
            <div className="space-y-4">
              {data?.monthlyTrends?.map((item: any) => {
                const maxRevenue = Math.max(...data.monthlyTrends.map((t: any) => t.revenue || 1));
                const percentage = Math.round((item.revenue / (maxRevenue || 1)) * 100);

                return (
                  <div key={item.month} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800 flex items-center gap-2">
                        <span className="w-8">{item.month}</span>
                        <span className="text-slate-400 font-medium">{item.cars} Cars Subscribed</span>
                      </span>
                      <span className="text-slate-900 font-black">
                        {formatCurrency(item.revenue)} <span className="text-[10px] text-emerald-600 font-bold">({item.growth})</span>
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full h-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Right 5 Cols: Car Segment Distribution */}
        <Card className="lg:col-span-5">
          <CardHeader className="p-5 pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-extrabold uppercase tracking-wide">
              Vehicle Segment Breakdown
            </CardTitle>
            <CardDescription>
              Fleet composition across vehicle sizes
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            {Object.entries(data?.carSegments || { Hatchback: 8, Sedan: 14, SUV: 10, Luxury: 2 }).map(
              ([segment, count]: [string, any]) => {
                const total = data?.totalCars || 34;
                const pct = Math.round((count / (total || 1)) * 100);

                return (
                  <div key={segment} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800">{segment}</span>
                      <span className="text-slate-500">
                        {count} cars ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-emerald-600 rounded-full h-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              }
            )}

            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed">
              💡 <strong>Sedans and Compact SUVs</strong> constitute over 70% of cleaning demand. Recommended to keep microfiber towels color-coded per surface tier.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 3. COMMUNITY HUB PERFORMANCE TABLE ── */}
      <Card>
        <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-extrabold uppercase tracking-wide">
              Community Hub Revenue & Unit Economics
            </CardTitle>
            <CardDescription>
              Performance breakdown across individual gated societies
            </CardDescription>
          </div>
          <Badge variant="outline">{data?.communityBreakdown?.length || 0} Gated Hubs</Badge>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Society Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Cleaned Cars</TableHead>
                <TableHead>Monthly Revenue</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.communityBreakdown?.map((hub: any) => (
                <TableRow key={hub.id}>
                  <TableCell className="font-extrabold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    {hub.name}
                  </TableCell>
                  <TableCell className="text-slate-500 text-xs">{hub.city || 'Bangalore'}</TableCell>
                  <TableCell className="font-bold text-slate-900 text-xs">{hub.cars} cars</TableCell>
                  <TableCell className="font-black text-emerald-700 text-xs">{formatCurrency(hub.revenue)}</TableCell>
                  <TableCell>
                    <Badge variant="success">Active 🟢</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
