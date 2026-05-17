'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  Loader2,
  Pause,
  Play,
  Ban,
  Eye,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency, formatDateTime, timeAgo } from '@/lib/utils';

interface Booking {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  vehicleName: string;
  vehicleReg: string;
  serviceName: string;
  price: number;
  status: string;
  paymentStatus: string;
  paymentDueDate: number;
  startDate: number;
  community: string;
  paymentHistory: any[];
  adminNotes: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      setBookings(data);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (bookingId: string) => {
    setProcessing(bookingId);
    try {
      await fetch(`/api/bookings/${bookingId}/suspend`, { method: 'POST' });
      await fetchBookings();
    } finally {
      setProcessing(null);
    }
  };

  const handleReactivate = async (bookingId: string) => {
    setProcessing(bookingId);
    try {
      await fetch(`/api/bookings/${bookingId}/reactivate`, { method: 'POST' });
      await fetchBookings();
    } finally {
      setProcessing(null);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedBooking) return;
    try {
      await fetch(`/api/bookings/${selectedBooking.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      await fetchBookings();
      setSelectedBooking(null);
    } catch (error) {
      console.error('Failed to save notes:', error);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (paymentFilter !== 'all' && b.paymentStatus !== paymentFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        b.userName?.toLowerCase().includes(s) ||
        b.vehicleReg?.toLowerCase().includes(s) ||
        b.serviceName?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      paused: 'bg-amber-100 text-amber-700',
      cancelled: 'bg-gray-100 text-gray-700',
      suspended: 'bg-red-100 text-red-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  const getPaymentBadge = (status: string) => {
    const styles: Record<string, string> = {
      paid: 'bg-green-100 text-green-700',
      unpaid: 'bg-amber-100 text-amber-700',
      overdue: 'bg-red-100 text-red-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <p className="text-gray-500">{bookings.length} total bookings</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
          <span className="text-xs text-gray-500 px-2">Status:</span>
          {['all', 'active', 'paused', 'cancelled', 'suspended'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                statusFilter === s
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
          <span className="text-xs text-gray-500 px-2">Payment:</span>
          {['all', 'paid', 'unpaid', 'overdue'].map((p) => (
            <button
              key={p}
              onClick={() => setPaymentFilter(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                paymentFilter === p
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, vehicle, or service..."
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
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No bookings found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Vehicle</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Service</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Due Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 text-sm">{booking.userName}</p>
                      <p className="text-xs text-gray-500">{booking.userPhone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-900">{booking.vehicleName}</p>
                      <p className="text-xs text-gray-500">{booking.vehicleReg}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700">{booking.serviceName}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-900">{formatCurrency(booking.price)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPaymentBadge(booking.paymentStatus)}`}>
                        {booking.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-500">
                        {booking.paymentDueDate ? formatDateTime(booking.paymentDueDate) : 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setSelectedBooking(booking);
                            setNotes(booking.adminNotes || '');
                          }}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {booking.status === 'active' && (
                          <button
                            onClick={() => handleSuspend(booking.id)}
                            disabled={processing === booking.id}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition disabled:opacity-50"
                            title="Suspend"
                          >
                            {processing === booking.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Pause className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        {booking.status === 'suspended' && (
                          <button
                            onClick={() => handleReactivate(booking.id)}
                            disabled={processing === booking.id}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition disabled:opacity-50"
                            title="Reactivate"
                          >
                            {processing === booking.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Booking Details</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">User</p>
                  <p className="font-medium text-gray-900">{selectedBooking.userName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900">{selectedBooking.userPhone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Vehicle</p>
                  <p className="font-medium text-gray-900">{selectedBooking.vehicleName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Registration</p>
                  <p className="font-medium text-gray-900">{selectedBooking.vehicleReg}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Service</p>
                  <p className="font-medium text-gray-900">{selectedBooking.serviceName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Price</p>
                  <p className="font-medium text-gray-900">{formatCurrency(selectedBooking.price)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(selectedBooking.status)}`}>
                    {selectedBooking.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Payment</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPaymentBadge(selectedBooking.paymentStatus)}`}>
                    {selectedBooking.paymentStatus}
                  </span>
                </div>
              </div>

              {selectedBooking.paymentHistory && selectedBooking.paymentHistory.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Payment History</p>
                  <div className="space-y-2">
                    {selectedBooking.paymentHistory.map((p: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                        <span>Cycle {p.cycle}</span>
                        <span className="font-medium">{formatCurrency(p.amount)}</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${p.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {p.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-500 mb-2">Admin Notes</p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  rows={3}
                  placeholder="Add notes..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
