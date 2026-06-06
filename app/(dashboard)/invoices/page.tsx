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
  Receipt,
  Plus,
  Edit2,
  Trash2,
  Calendar,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface Invoice {
  id: string;
  subscriptionId: string;
  userId: string;
  userName: string;
  userPhone: string;
  amount: number;
  currency: string;
  billingMonth: string;
  dueDate: number;
  status: 'pending' | 'paid' | 'overdue' | 'pending_verification';
  invoiceNumber: string;
  cycleNumber: number;
  serviceName: string;
  vehicleReg: string;
}

interface Booking {
  id: string;
  userId: string;
  userName: string;
  vehicleReg: string;
  serviceName: string;
  price: number;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'overdue' | 'pending_verification'>('all');
  const [search, setSearch] = useState('');
  
  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<Invoice | null>(null);
  
  // Create Form State
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newBillingMonth, setNewBillingMonth] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  // Edit Form State
  const [editAmount, setEditAmount] = useState(0);
  const [editDueDate, setEditDueDate] = useState('');
  const [editStatus, setEditStatus] = useState<Invoice['status']>('pending');
  const [editBillingMonth, setEditBillingMonth] = useState('');

  useEffect(() => {
    fetchInvoices();
    fetchBookings();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/invoices');
      const data = await res.json();
      setInvoices(data);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      setBookings(data.filter((b: any) => b.status === 'active'));
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingId || !newAmount || !newBillingMonth || !newDueDate) return;

    setProcessing('create');
    try {
      const booking = bookings.find((b) => b.id === selectedBookingId);
      if (!booking) return;

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: selectedBookingId,
          userId: booking.userId,
          amount: Number(newAmount),
          billingMonth: newBillingMonth,
          dueDate: new Date(newDueDate).getTime(),
          serviceName: booking.serviceName,
          vehicleReg: booking.vehicleReg,
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setSelectedBookingId('');
        setNewAmount('');
        setNewBillingMonth('');
        setNewDueDate('');
        await fetchInvoices();
      }
    } catch (error) {
      console.error('Failed to create invoice:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleUpdateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;

    setProcessing(showEditModal.id);
    try {
      const res = await fetch(`/api/invoices/${showEditModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(editAmount),
          dueDate: new Date(editDueDate).getTime(),
          status: editStatus,
          billingMonth: editBillingMonth,
        }),
      });

      if (res.ok) {
        setShowEditModal(null);
        await fetchInvoices();
      }
    } catch (error) {
      console.error('Failed to update invoice:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    setProcessing(id);
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchInvoices();
      }
    } catch (error) {
      console.error('Failed to delete invoice:', error);
    } finally {
      setProcessing(null);
    }
  };

  const formatBillingMonthLabel = (billingMonth: string) => {
    if (!billingMonth || billingMonth.length !== 7) return billingMonth;
    const [year, month] = billingMonth.split('-');
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthIndex = parseInt(month, 10) - 1;
    return `${months[monthIndex]} ${year}`;
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (filter !== 'all' && inv.status !== filter) return false;
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        inv.userName?.toLowerCase().includes(searchLower) ||
        inv.userPhone?.includes(search) ||
        inv.invoiceNumber?.toLowerCase().includes(searchLower) ||
        inv.vehicleReg?.toLowerCase().includes(searchLower) ||
        inv.serviceName?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const getStatusBadge = (status: Invoice['status']) => {
    const styles: Record<Invoice['status'], string> = {
      paid: 'bg-green-100 text-green-700',
      pending: 'bg-blue-100 text-blue-700',
      overdue: 'bg-red-100 text-red-700',
      pending_verification: 'bg-amber-100 text-amber-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  const openEditModal = (inv: Invoice) => {
    setShowEditModal(inv);
    setEditAmount(inv.amount);
    setEditStatus(inv.status);
    setEditBillingMonth(inv.billingMonth);
    // Format timestamp for input[type="date"] (yyyy-MM-dd)
    const date = new Date(inv.dueDate);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    setEditDueDate(`${yyyy}-${mm}-${dd}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-500">
            {invoices.length} invoices generated in total
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Plus className="w-4 h-4" />
          Create Invoice
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
          {(['all', 'pending', 'paid', 'overdue', 'pending_verification'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                filter === f
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f === 'pending_verification' ? 'Pending Verif.' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone, invoice No., vehicle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
          />
        </div>
      </div>

      {/* Invoices List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No invoices found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Invoice No.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Vehicle & Service
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Billing Month
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Due Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-800 text-sm">
                        {inv.invoiceNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 text-sm">
                        {inv.userName || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">{inv.userPhone}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <p className="font-medium">{inv.serviceName}</p>
                      <p className="text-xs text-gray-500">{inv.vehicleReg}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatBillingMonthLabel(inv.billingMonth)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(inv.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDateTime(inv.dueDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${getStatusBadge(inv.status)}`}>
                        {inv.status === 'pending_verification' ? 'Pending Verif.' : inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(inv)}
                          disabled={processing === inv.id}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit invoice"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(inv.id)}
                          disabled={processing === inv.id}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete invoice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreateInvoice} className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
              <Receipt className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-bold text-gray-900">Create Invoice</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Select Active Subscription</label>
                <select
                  value={selectedBookingId}
                  onChange={(e) => {
                    setSelectedBookingId(e.target.value);
                    const booking = bookings.find((b) => b.id === e.target.value);
                    if (booking) setNewAmount(String(booking.price));
                  }}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Choose a active subscription...</option>
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.userName} - {b.serviceName} ({b.vehicleReg})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Billing Month</label>
                <input
                  type="month"
                  value={newBillingMonth}
                  onChange={(e) => setNewBillingMonth(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Due Date</label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Amount (INR)</label>
                <input
                  type="number"
                  placeholder="Amount"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processing === 'create'}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {processing === 'create' && <Loader2 className="w-4 h-4 animate-spin" />}
                Generate
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Invoice Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleUpdateInvoice} className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Edit Invoice {showEditModal.invoiceNumber}</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Billing Month</label>
                <input
                  type="month"
                  value={editBillingMonth}
                  onChange={(e) => setEditBillingMonth(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Due Date</label>
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Amount (INR)</label>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(Number(e.target.value))}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as Invoice['status'])}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="pending">Pending</option>
                  <option value="pending_verification">Pending Verification</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowEditModal(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processing === showEditModal.id}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
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
