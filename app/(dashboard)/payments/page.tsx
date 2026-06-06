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
  Plus,
  Edit2,
  Trash2,
} from 'lucide-react';
import { formatCurrency, formatDateTime, timeAgo } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  phoneNumber: string;
}

interface Booking {
  id: string;
  userId: string;
  serviceName: string;
  vehicleReg: string;
}

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
  const [users, setUsers] = useState<User[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified'>('pending');
  const [search, setSearch] = useState('');
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<Payment | null>(null);

  // Create Form State
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newUpiAppName, setNewUpiAppName] = useState('Manual Collection');
  const [newUpiTransactionId, setNewUpiTransactionId] = useState('');
  const [newStatus, setNewStatus] = useState('pending_manual_verify');
  const [newNotes, setNewNotes] = useState('');
  const [newDate, setNewDate] = useState('');

  // Edit Form State
  const [editAmount, setEditAmount] = useState(0);
  const [editUpiAppName, setEditUpiAppName] = useState('');
  const [editUpiTransactionId, setEditUpiTransactionId] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editVerified, setEditVerified] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [editDate, setEditDate] = useState('');

  useEffect(() => {
    fetchPayments();
    fetchUsers();
    fetchBookings();
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

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      if (Array.isArray(data)) setBookings(data);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !newAmount) return;
    setProcessing('create');
    try {
      const isVerified = newStatus === 'paid';
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          bookingId: selectedBookingId,
          amount: Number(newAmount),
          upiAppName: newUpiAppName,
          upiTransactionId: newUpiTransactionId,
          status: newStatus,
          adminVerified: isVerified,
          adminNotes: newNotes,
          createdAt: newDate ? new Date(newDate).getTime() : Date.now(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to create payment record');
      } else {
        setShowCreateModal(false);
        resetCreateForm();
        await fetchPayments();
      }
    } catch (error) {
      console.error('Failed to create payment:', error);
      alert('An error occurred during payment creation');
    } finally {
      setProcessing(null);
    }
  };

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;
    setProcessing(showEditModal.id);
    try {
      const res = await fetch(`/api/payments/${showEditModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(editAmount),
          upiAppName: editUpiAppName,
          upiTransactionId: editUpiTransactionId,
          status: editStatus,
          adminVerified: editVerified,
          adminNotes: editNotes,
          createdAt: editDate ? new Date(editDate).getTime() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to update payment');
      } else {
        setShowEditModal(null);
        await fetchPayments();
      }
    } catch (error) {
      console.error('Failed to update payment:', error);
      alert('An error occurred during payment update');
    } finally {
      setProcessing(null);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Are you sure you want to delete this payment transaction? This cannot be undone.')) return;
    setProcessing(paymentId);
    try {
      const res = await fetch(`/api/payments/${paymentId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to delete payment');
      } else {
        await fetchPayments();
      }
    } catch (error) {
      console.error('Failed to delete payment:', error);
      alert('An error occurred during payment deletion');
    } finally {
      setProcessing(null);
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

  const resetCreateForm = () => {
    setSelectedUserId('');
    setSelectedBookingId('');
    setNewAmount('');
    setNewUpiAppName('Manual Collection');
    setNewUpiTransactionId('');
    setNewStatus('pending_manual_verify');
    setNewNotes('');
    setNewDate('');
  };

  const openEditModal = (payment: Payment) => {
    setShowEditModal(payment);
    setEditAmount(payment.amount);
    setEditUpiAppName(payment.upiAppName || '');
    setEditUpiTransactionId(payment.upiTransactionId || '');
    setEditStatus(payment.status || '');
    setEditVerified(payment.adminVerified || false);
    setEditNotes(payment.adminNotes || '');
    if (payment.createdAt) {
      const date = new Date(payment.createdAt);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      setEditDate(`${yyyy}-${mm}-${dd}`);
    } else {
      setEditDate('');
    }
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

  const activeUserBookings = bookings.filter((b) => b.userId === selectedUserId);

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
        <div className="flex items-center gap-3">
          {selectedPayments.size > 0 && (
            <button
              onClick={handleBulkVerify}
              disabled={processing === 'bulk'}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 text-sm font-medium"
            >
              {processing === 'bulk' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Verify {selectedPayments.size} Selected
            </button>
          )}
          <button
            onClick={() => {
              resetCreateForm();
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Record Payment
          </button>
        </div>
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
                  <th className="px-4 py-3 text-left w-10">
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">UPI App</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Transaction ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
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
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(payment)}
                          className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-gray-100 rounded-lg transition"
                          title="Edit Payment"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePayment(payment.id)}
                          disabled={processing === payment.id}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-lg transition"
                          title="Delete Payment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {!payment.adminVerified &&
                          payment.status === 'pending_manual_verify' && (
                            <>
                              <button
                                onClick={() => handleVerify(payment.id)}
                                disabled={processing === payment.id}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition disabled:opacity-50"
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
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                                title="Reject payment"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
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

      {/* Record Payment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreatePayment} className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
              <Plus className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-bold text-gray-900">Record Manual Payment</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Select User</label>
                <select
                  required
                  value={selectedUserId}
                  onChange={(e) => {
                    setSelectedUserId(e.target.value);
                    setSelectedBookingId('');
                  }}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value="">Choose a user...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.phoneNumber})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Select Booking / Service</label>
                <select
                  disabled={!selectedUserId}
                  value={selectedBookingId}
                  onChange={(e) => setSelectedBookingId(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-100"
                >
                  <option value="">General (No specific booking)...</option>
                  {activeUserBookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.serviceName} ({b.vehicleReg})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Amount (INR)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 500"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">UPI App Name</label>
                  <input
                    type="text"
                    value={newUpiAppName}
                    onChange={(e) => setNewUpiAppName(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">UPI Transaction ID</label>
                  <input
                    type="text"
                    placeholder="e.g. UPI12345678"
                    value={newUpiTransactionId}
                    onChange={(e) => setNewUpiTransactionId(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  >
                    <option value="pending_manual_verify">Pending Verification</option>
                    <option value="paid">Paid (Verified)</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Admin Notes</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="Notes about collection details..."
                  rows={2}
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processing === 'create'}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 text-sm font-medium disabled:opacity-50"
              >
                {processing === 'create' && <Loader2 className="w-4 h-4 animate-spin" />}
                Record
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Payment Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleUpdatePayment} className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Edit Payment Record</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">User</p>
                  <p className="font-semibold text-gray-900 text-sm">{showEditModal.userName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="font-semibold text-gray-900 text-sm">{showEditModal.userPhone}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Amount (INR)</label>
                <input
                  type="number"
                  required
                  value={editAmount}
                  onChange={(e) => setEditAmount(Number(e.target.value))}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">UPI App Name</label>
                  <input
                    type="text"
                    value={editUpiAppName}
                    onChange={(e) => setEditUpiAppName(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">UPI Transaction ID</label>
                  <input
                    type="text"
                    value={editUpiTransactionId}
                    onChange={(e) => setEditUpiTransactionId(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => {
                      setEditStatus(e.target.value);
                      if (e.target.value === 'paid') setEditVerified(true);
                    }}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  >
                    <option value="pending_manual_verify">Pending Verification</option>
                    <option value="paid">Paid (Verified)</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="editVerified"
                  checked={editVerified}
                  onChange={(e) => setEditVerified(e.target.checked)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500 w-4 h-4"
                />
                <label htmlFor="editVerified" className="text-sm font-semibold text-gray-700 select-none">Admin Verified</label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Admin Notes</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  rows={2}
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowEditModal(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processing === showEditModal.id}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 text-sm font-medium"
              >
                {processing === showEditModal.id && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
