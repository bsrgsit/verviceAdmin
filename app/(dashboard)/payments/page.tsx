'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { formatCurrency, formatDateTime, timeAgo } from '@/lib/utils';

interface Payment {
  id: string;
  bookingId: string;
  userId: string;
  userName: string;
  userPhone: string;
  amount: number;
  upiAppName: string;
  upiTransactionId: string;
  status: string;
  adminVerified: boolean;
  adminNotes: string;
  createdAt: number;
  duplicate: boolean;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified'>('pending');
  const [search, setSearch] = useState('');
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payments');
      const data = await res.json();
      setPayments(data);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (paymentId: string) => {
    setProcessing(paymentId);
    try {
      const res = await fetch(`/api/payments/${paymentId}/verify`, {
        method: 'POST',
      });
      if (res.ok) {
        await fetchPayments();
      }
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (paymentId: string) => {
    setProcessing(paymentId);
    try {
      const res = await fetch(`/api/payments/${paymentId}/reject`, {
        method: 'POST',
      });
      if (res.ok) {
        await fetchPayments();
      }
    } finally {
      setProcessing(null);
    }
  };

  const handleBulkVerify = async () => {
    if (selectedPayments.size === 0) return;
    setProcessing('bulk');
    try {
      const res = await fetch('/api/payments/bulk-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIds: Array.from(selectedPayments) }),
      });
      if (res.ok) {
        setSelectedPayments(new Set());
        await fetchPayments();
      }
    } finally {
      setProcessing(null);
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedPayments);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedPayments(newSet);
  };

  const filteredPayments = payments.filter((p) => {
    if (filter === 'pending' && p.status !== 'pending_manual_verify') return false;
    if (filter === 'verified' && !p.adminVerified) return false;
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        p.userName?.toLowerCase().includes(searchLower) ||
        p.userPhone?.includes(search) ||
        p.upiTransactionId?.toLowerCase().includes(searchLower) ||
        p.amount.toString().includes(search)
      );
    }
    return true;
  });

  const pendingCount = payments.filter(
    (p) => p.status === 'pending_manual_verify'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500">
            {pendingCount} payment{pendingCount !== 1 ? 's' : ''} awaiting verification
          </p>
        </div>
        {selectedPayments.size > 0 && (
          <button
            onClick={handleBulkVerify}
            disabled={processing === 'bulk'}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            {processing === 'bulk' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            Verify {selectedPayments.size} Selected
          </button>
        )}
      </div>

      {/* Duplicate Alert */}
      {payments.some((p) => p.duplicate) && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            Duplicate transaction IDs detected. Please verify these payments carefully.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
          {(['all', 'pending', 'verified'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                filter === f
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone, or transaction ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No payments found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        filteredPayments.length > 0 &&
                        filteredPayments.every((p) => selectedPayments.has(p.id))
                      }
                      onChange={() => {
                        if (
                          filteredPayments.every((p) => selectedPayments.has(p.id))
                        ) {
                          setSelectedPayments(new Set());
                        } else {
                          setSelectedPayments(
                            new Set(filteredPayments.map((p) => p.id))
                          );
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    UPI App
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Transaction ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    className={`hover:bg-gray-50 transition ${
                      payment.duplicate ? 'bg-amber-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedPayments.has(payment.id)}
                        onChange={() => toggleSelect(payment.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 text-sm">
                        {payment.userName || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">{payment.userPhone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(payment.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600 capitalize">
                        {payment.upiAppName || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {payment.upiTransactionId || 'N/A'}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      {payment.adminVerified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified
                        </span>
                      ) : payment.status === 'pending_manual_verify' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                          <XCircle className="w-3 h-3" />
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-500">
                        {timeAgo(payment.createdAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!payment.adminVerified &&
                        payment.status === 'pending_manual_verify' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleVerify(payment.id)}
                              disabled={processing === payment.id}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition disabled:opacity-50"
                              title="Verify payment"
                            >
                              {processing === payment.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleReject(payment.id)}
                              disabled={processing === payment.id}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                              title="Reject payment"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
