'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CreditCard,
  Ban,
  Car,
  BatteryCharging,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  Eye,
  RefreshCw,
  Building2,
  Phone,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatCurrency, timeAgo } from '@/lib/utils';

interface ActionInboxProps {
  data: {
    totalUrgent: number;
    pendingPayments: any[];
    cancellationRequests: any[];
    pendingDrivers: any[];
    pendingBatteries: any[];
    openTickets: any[];
  };
  onRefresh: () => void;
}

export default function ActionInbox({ data, onRefresh }: ActionInboxProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [previewScreenshot, setPreviewScreenshot] = useState<string | null>(null);

  // Handle direct payment verification from dashboard
  const handleVerifyPayment = async (paymentId: string) => {
    setProcessingId(paymentId);
    try {
      const res = await fetch(`/api/payments/${paymentId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        onRefresh();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to verify payment');
      }
    } catch (e: any) {
      alert(e.message || 'Network error');
    } finally {
      setProcessingId(null);
    }
  };

  // Handle direct cancellation request approval or rejection
  const handleCancellationAction = async (bookingId: string, action: 'approved' | 'rejected') => {
    setProcessingId(bookingId);
    try {
      const item = data.cancellationRequests.find((c) => c.bookingId === bookingId);
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: action === 'approved' ? 'cancelled' : 'active',
          cancellationRequest: {
            reason: item?.reason || '',
            status: action,
            actionAt: Date.now(),
          },
        }),
      });
      if (res.ok) {
        onRefresh();
      } else {
        const err = await res.json();
        alert(err.error || `Failed to ${action} cancellation`);
      }
    } catch (e: any) {
      alert(e.message || 'Network error');
    } finally {
      setProcessingId(null);
    }
  };

  const {
    totalUrgent,
    pendingPayments = [],
    cancellationRequests = [],
    pendingDrivers = [],
    pendingBatteries = [],
    openTickets = [],
  } = data;

  if (totalUrgent === 0) {
    return (
      <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50/70 via-white to-emerald-50/40 shadow-xs">
        <CardContent className="p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                Operational Queue All Clear!
                <Badge variant="success" className="text-[10px] py-0 px-1.5">Zero Bottlenecks</Badge>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                All UPI payments verified, subscriptions active, and driver/battery requests addressed.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh} className="gap-1.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            Check Live
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200/90 bg-white shadow-sm overflow-hidden">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 px-5 py-3 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-black text-sm tracking-tight flex items-center gap-2">
              Action Required Queue
              <span className="px-2 py-0.5 rounded-full bg-white text-amber-900 font-extrabold text-xs shadow-xs">
                {totalUrgent} Pending
              </span>
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            className="text-white hover:bg-white/20 text-xs gap-1.5 h-7 px-2.5"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </Button>
        </div>
      </div>

      <CardContent className="p-4 sm:p-5">
        <Tabs defaultValue={pendingPayments.length > 0 ? "payments" : cancellationRequests.length > 0 ? "cancellations" : "emergency"}>
          <TabsList className="bg-slate-100 p-1 mb-4 flex-wrap h-auto">
            <TabsTrigger value="payments" className="text-xs gap-1.5 font-bold">
              <CreditCard className="w-3.5 h-3.5 text-amber-600" />
              <span>UPI Payments</span>
              {pendingPayments.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-900 text-[10px]">
                  {pendingPayments.length}
                </span>
              )}
            </TabsTrigger>

            <TabsTrigger value="cancellations" className="text-xs gap-1.5 font-bold">
              <Ban className="w-3.5 h-3.5 text-rose-600" />
              <span>Cancellations</span>
              {cancellationRequests.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-200 text-rose-900 text-[10px]">
                  {cancellationRequests.length}
                </span>
              )}
            </TabsTrigger>

            <TabsTrigger value="emergency" className="text-xs gap-1.5 font-bold">
              <BatteryCharging className="w-3.5 h-3.5 text-blue-600" />
              <span>Driver / Battery</span>
              {(pendingDrivers.length + pendingBatteries.length) > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-blue-200 text-blue-900 text-[10px]">
                  {pendingDrivers.length + pendingBatteries.length}
                </span>
              )}
            </TabsTrigger>

            <TabsTrigger value="tickets" className="text-xs gap-1.5 font-bold">
              <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
              <span>Helpdesk</span>
              {openTickets.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-purple-200 text-purple-900 text-[10px]">
                  {openTickets.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── 1. UPI Payments Tab ── */}
          <TabsContent value="payments" className="space-y-2 mt-0">
            {pendingPayments.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No pending payments to verify.</p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                {pendingPayments.slice(0, 5).map((pay) => (
                  <div key={pay.id} className="p-3.5 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
                        ₹
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-sm">{pay.userName}</span>
                          {pay.community && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5">{pay.community}</Badge>
                          )}
                          <span className="text-slate-400 text-[11px]">{timeAgo(pay.createdAt)}</span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          Amount: <span className="font-bold text-slate-900">{formatCurrency(pay.amount)}</span> • 
                          UTR: <span className="font-mono text-slate-700 font-semibold">{pay.transactionId || pay.utr || 'N/A'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {pay.screenshotUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewScreenshot(pay.screenshotUrl)}
                          className="h-8 text-xs gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Receipt
                        </Button>
                      )}
                      <Button
                        variant="default"
                        size="sm"
                        disabled={processingId === pay.id}
                        onClick={() => handleVerifyPayment(pay.id)}
                        className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {processingId === pay.id ? 'Verifying...' : 'Verify Now'}
                      </Button>
                      <Link href={`/payments?id=${pay.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {pendingPayments.length > 5 && (
              <div className="pt-2 flex justify-end">
                <Link href="/payments" className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1">
                  View all {pendingPayments.length} pending payments →
                </Link>
              </div>
            )}
          </TabsContent>

          {/* ── 2. Cancellation Requests Tab ── */}
          <TabsContent value="cancellations" className="space-y-2 mt-0">
            {cancellationRequests.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No pending subscription cancellations.</p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                {cancellationRequests.slice(0, 5).map((req) => (
                  <div key={req.id} className="p-3.5 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0">
                        <Ban className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-sm">{req.userName}</span>
                          <span className="font-mono font-bold text-slate-700">{req.vehicleReg}</span>
                          {req.community && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5">{req.community}</Badge>
                          )}
                          <span className="text-slate-400 text-[11px]">{timeAgo(req.requestedAt)}</span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          Service: <span className="font-semibold text-slate-900">{req.serviceName}</span> ({formatCurrency(req.price)}/mo)
                        </p>
                        <p className="text-rose-700 text-[11px] font-medium mt-0.5 bg-rose-50 px-2 py-0.5 rounded-md inline-block">
                          Reason: "{req.reason}"
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={processingId === req.id}
                        onClick={() => handleCancellationAction(req.id, 'rejected')}
                        className="h-8 text-xs text-slate-700 hover:bg-slate-100"
                      >
                        Keep Active
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={processingId === req.id}
                        onClick={() => handleCancellationAction(req.id, 'approved')}
                        className="h-8 text-xs bg-rose-600 hover:bg-rose-700 gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {processingId === req.id ? 'Updating...' : 'Approve Cancellation'}
                      </Button>
                      <Link href={`/bookings`}>
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {cancellationRequests.length > 5 && (
              <div className="pt-2 flex justify-end">
                <Link href="/bookings" className="text-xs text-rose-700 font-bold hover:underline flex items-center gap-1">
                  View all {cancellationRequests.length} cancellation requests →
                </Link>
              </div>
            )}
          </TabsContent>

          {/* ── 3. Emergency Requests Tab ── */}
          <TabsContent value="emergency" className="space-y-2 mt-0">
            {pendingDrivers.length === 0 && pendingBatteries.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No pending driver hire or battery jumpstart requests.</p>
            ) : (
              <div className="space-y-2">
                {pendingDrivers.map((d) => (
                  <div key={d.id} className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <Car className="w-4 h-4 text-blue-600" />
                      <div>
                        <span className="font-extrabold text-slate-900">{d.userName}</span> requested Driver
                        <span className="text-slate-400 ml-2">{timeAgo(d.timestamp)}</span>
                      </div>
                    </div>
                    <Link href="/driver-requests">
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                        Dispatch Driver →
                      </Button>
                    </Link>
                  </div>
                ))}

                {pendingBatteries.map((b) => (
                  <div key={b.id} className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <BatteryCharging className="w-4 h-4 text-amber-600" />
                      <div>
                        <span className="font-extrabold text-slate-900">{b.userName}</span> requested Jumpstart
                        <span className="text-slate-400 ml-2">{timeAgo(b.timestamp)}</span>
                      </div>
                    </div>
                    <Link href="/battery-requests">
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                        Dispatch Technician →
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── 4. Open Tickets Tab ── */}
          <TabsContent value="tickets" className="space-y-2 mt-0">
            {openTickets.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No unresolved support tickets.</p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                {openTickets.slice(0, 5).map((t) => (
                  <div key={t.id} className="p-3 hover:bg-slate-50 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900">{t.userName}</span>
                        <Badge variant="outline" className="text-[10px]">{t.subject || 'Complaint'}</Badge>
                        <span className="text-slate-400">{timeAgo(t.createdAt)}</span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5 line-clamp-1">{t.message || t.description}</p>
                    </div>
                    <Link href="/support-tickets">
                      <Button size="sm" variant="default" className="h-7 text-xs">
                        Reply & Resolve
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Screenshot Preview Modal */}
      {previewScreenshot && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setPreviewScreenshot(null)}
        >
          <div className="bg-white rounded-2xl p-4 max-w-md w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-sm text-slate-900">Payment Screenshot</h4>
              <Button variant="ghost" size="sm" onClick={() => setPreviewScreenshot(null)} className="h-7 px-2">
                ✕
              </Button>
            </div>
            <div className="pt-3">
              <img src={previewScreenshot} alt="Payment proof" className="w-full rounded-xl object-contain" />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
