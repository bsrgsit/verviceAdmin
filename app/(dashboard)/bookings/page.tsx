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
import { formatCurrency, formatDateTime } from '@/lib/utils';

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
  cancellationRequest?: {
    status: 'pending' | 'approved' | 'rejected';
    reason: string;
    requestedAt: number;
  };
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [search, setSearch] = useState('');
  
  // Modal State
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [notes, setNotes] = useState('');
  const [editPrice, setEditPrice] = useState(0);
  const [editStatus, setEditStatus] = useState('');
  const [editPaymentDueDate, setEditPaymentDueDate] = useState('');
  const [editVehicleName, setEditVehicleName] = useState('');
  const [editVehicleReg, setEditVehicleReg] = useState('');

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

  const handleSaveChanges = async () => {
    if (!selectedBooking) return;
    setProcessing(selectedBooking.id);
    try {
      // 1. Save notes
      await fetch(`/api/bookings/${selectedBooking.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });

      // 2. Save other fields
      await fetch(`/api/bookings/${selectedBooking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: Number(editPrice),
          status: editStatus,
          vehicleName: editVehicleName,
          vehicleReg: editVehicleReg,
          paymentDueDate: editPaymentDueDate ? new Date(editPaymentDueDate).getTime() : 0,
        }),
      });

      await fetchBookings();
      setSelectedBooking(null);
    } catch (error) {
      console.error('Failed to save changes:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleApprovalCancellation = async (status: 'approved' | 'rejected') => {
    if (!selectedBooking || !selectedBooking.cancellationRequest) return;
    setProcessing(selectedBooking.id);
    try {
      const cancellationRequestUpdate = {
        ...selectedBooking.cancellationRequest,
        status,
        ...(status === 'approved' ? { approvedAt: Date.now() } : { rejectedAt: Date.now() }),
      };

      await fetch(`/api/bookings/${selectedBooking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: status === 'approved' ? 'cancelled' : 'active',
          cancellationRequest: cancellationRequestUpdate,
        }),
      });

      await fetchBookings();
      setSelectedBooking(null);
    } catch (error) {
      console.error('Cancellation request action failed:', error);
    } finally {
      setProcessing(null);
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
      pending_verification: 'bg-blue-100 text-blue-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  const openDetailsModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setNotes(booking.adminNotes || '');
    setEditPrice(booking.price);
    setEditStatus(booking.status);
    setEditVehicleName(booking.vehicleName || '');
    setEditVehicleReg(booking.vehicleReg || '');

    if (booking.paymentDueDate) {
      const date = new Date(booking.paymentDueDate);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      setEditPaymentDueDate(`${yyyy}-${mm}-${dd}`);
    } else {
      setEditPaymentDueDate('');
    }
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
          {['all', 'paid', 'unpaid', 'overdue', 'pending_verification'].map((p) => (
            <button
              key={p}
              onClick={() => setPaymentFilter(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                paymentFilter === p
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p === 'pending_verification' ? 'Pending Verif.' : p.charAt(0).toUpperCase() + p.slice(1)}
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
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span>{booking.serviceName}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-900">{formatCurrency(booking.price)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {booking.cancellationRequest?.status === 'pending' ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700">
                          Cancellation Pending
                        </span>
                      ) : (
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusBadge(booking.status)}`}>
                          {booking.status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getPaymentBadge(booking.paymentStatus)}`}>
                        {booking.paymentStatus === 'pending_verification' ? 'Pending Verif.' : booking.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {booking.paymentDueDate ? formatDateTime(booking.paymentDueDate) : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openDetailsModal(booking)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                          title="View & Edit Details"
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

      {/* Edit/Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Manage Booking</h3>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-gray-400 hover:text-gray-500 text-sm font-medium"
              >
                Close
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              {/* Cancellation Request Section */}
              {selectedBooking.cancellationRequest?.status === 'pending' && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-amber-800">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <span className="font-semibold text-sm">Cancellation Request Pending</span>
                  </div>
                  {selectedBooking.cancellationRequest.reason && (
                    <p className="text-sm text-gray-600 italic bg-white p-3 rounded-lg border border-amber-100">
                      " {selectedBooking.cancellationRequest.reason} "
                    </p>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      disabled={processing === selectedBooking.id}
                      onClick={() => handleApprovalCancellation('approved')}
                      className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition flex items-center gap-1"
                    >
                      {processing === selectedBooking.id && <Loader2 className="w-3 h-3 animate-spin" />}
                      Approve & Cancel Subscription
                    </button>
                    <button
                      type="button"
                      disabled={processing === selectedBooking.id}
                      onClick={() => handleApprovalCancellation('rejected')}
                      className="px-4 py-2 bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-300 transition"
                    >
                      Reject Request
                    </button>
                  </div>
                </div>
              )}

              {/* Editable Fields Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">User</p>
                  <p className="font-medium text-gray-900 text-sm">{selectedBooking.userName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900 text-sm">{selectedBooking.userPhone}</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Vehicle Name</label>
                  <input
                    type="text"
                    value={editVehicleName}
                    onChange={(e) => setEditVehicleName(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Vehicle Registration</label>
                  <input
                    type="text"
                    value={editVehicleReg}
                    onChange={(e) => setEditVehicleReg(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Price (INR/mo)</label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Subscription Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="suspended">Suspended</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Payment Status</label>
                  <span className={`inline-flex mt-1 px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${getPaymentBadge(selectedBooking.paymentStatus)}`}>
                    {selectedBooking.paymentStatus === 'pending_verification' ? 'Pending Verif.' : selectedBooking.paymentStatus}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Next Payment Due Date</label>
                  <input
                    type="date"
                    value={editPaymentDueDate}
                    onChange={(e) => setEditPaymentDueDate(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
              </div>

              {/* Payment History */}
              {selectedBooking.paymentHistory && selectedBooking.paymentHistory.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Payment History</p>
                  <div className="max-h-32 overflow-y-auto space-y-2 border border-gray-100 p-2 rounded-lg">
                    {selectedBooking.paymentHistory.map((p: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs">
                        <span>Cycle {p.cycle}</span>
                        <span className="font-medium">{formatCurrency(p.amount)}</span>
                        <span className={`px-2 py-0.5 rounded-full ${p.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {p.status}
                        </span>
                        <span className="text-gray-400">{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Admin Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  rows={3}
                  placeholder="Add administrative notes..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processing === selectedBooking.id}
                onClick={handleSaveChanges}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
              >
                {processing === selectedBooking.id && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
