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
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface Invoice {
  id: string;
  subscriptionId: string;
  userId: string;
  userName: string;
  userPhone: string;
  userCommunity?: string;
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
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filter]);

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

  // Expand/Collapse Grouping State
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  const toggleExpandUser = (userId: string) => {
    const newSet = new Set(expandedUsers);
    if (newSet.has(userId)) {
      newSet.delete(userId);
    } else {
      newSet.add(userId);
    }
    setExpandedUsers(newSet);
  };

  const handleExpandAll = (userIds: string[]) => {
    setExpandedUsers(new Set(userIds));
  };

  const handleCollapseAll = () => {
    setExpandedUsers(new Set());
  };

  useEffect(() => {
    fetchInvoices();
    fetchBookings();
  }, []);

  // Auto-expand accordions when search or filter changes
  useEffect(() => {
    if (search || filter !== 'all') {
      const filtered = invoices.filter((inv) => {
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
      const userIds = Array.from(new Set(filtered.map((inv) => inv.userId || 'unknown')));
      setExpandedUsers(new Set(userIds));
    }
  }, [search, filter, invoices]);

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

  const handleRunMonthlyBilling = async () => {
    if (!confirm('Are you sure you want to generate invoices for the previous billing month for all active subscriptions?')) return;
    
    setProcessing('run-monthly');
    try {
      const res = await fetch('/api/invoices/run-monthly', {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Successfully generated ${data.created} invoices. Skipped ${data.skipped} duplicates.`);
        await fetchInvoices();
      } else {
        alert(`Failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Failed to run monthly billing:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const handleCheckOverdue = async () => {
    if (!confirm('Are you sure you want to scan and mark all unpaid invoices past their due dates as overdue?')) return;
    
    setProcessing('check-overdue');
    try {
      const res = await fetch('/api/invoices/check-overdue', {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Overdue check complete. Marked ${data.updated} invoices/subscriptions as overdue.`);
        await fetchInvoices();
      } else {
        alert(`Failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Failed to check overdue:', error);
      alert(`Error: ${error.message}`);
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
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      return (
        inv.userName?.toLowerCase().includes(searchLower) ||
        inv.userPhone?.includes(debouncedSearch) ||
        inv.invoiceNumber?.toLowerCase().includes(searchLower) ||
        inv.vehicleReg?.toLowerCase().includes(searchLower) ||
        inv.serviceName?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Group invoices by community, then by user
  const communityGroupsMap = new Map<
    string,
    {
      communityName: string;
      totalPending: number;
      users: Map<string, { userName: string; userPhone: string; invoices: Invoice[] }>;
    }
  >();

  paginatedInvoices.forEach((inv) => {
    const communityName = inv.userCommunity || 'Unassigned';
    if (!communityGroupsMap.has(communityName)) {
      communityGroupsMap.set(communityName, {
        communityName,
        totalPending: 0,
        users: new Map(),
      });
    }

    const group = communityGroupsMap.get(communityName)!;

    if (inv.status !== 'paid') {
      group.totalPending += inv.amount;
    }

    const userId = inv.userId || 'unknown';
    if (!group.users.has(userId)) {
      group.users.set(userId, {
        userName: inv.userName || 'Unknown User',
        userPhone: inv.userPhone || '',
        invoices: [],
      });
    }
    group.users.get(userId)!.invoices.push(inv);
  });

  const communityGroupsList = Array.from(communityGroupsMap.values()).map((cGroup) => ({
    ...cGroup,
    usersList: Array.from(cGroup.users.entries()).map(([userId, userDetails]) => ({
      userId,
      ...userDetails,
    })),
  }));

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
        <div className="flex items-center gap-3">
          <button
            onClick={handleRunMonthlyBilling}
            disabled={processing !== null}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm font-medium"
          >
            {processing === 'run-monthly' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Calendar className="w-4 h-4" />
            )}
            Run Monthly Billing
          </button>
          <button
            onClick={handleCheckOverdue}
            disabled={processing !== null}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition disabled:opacity-50 text-sm font-medium"
          >
            {processing === 'check-overdue' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Clock className="w-4 h-4" />
            )}
            Scan Overdue
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Create Invoice
          </button>
        </div>
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

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleExpandAll(Array.from(new Set(filteredInvoices.map((inv) => inv.userId || 'unknown'))))}
            className="px-3 py-2 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition whitespace-nowrap"
          >
            Expand All
          </button>
          <button
            type="button"
            onClick={handleCollapseAll}
            className="px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition whitespace-nowrap"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Invoices List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white p-6">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-10 bg-gray-100 rounded"></div>
              <div className="h-10 bg-gray-100 rounded"></div>
              <div className="h-10 bg-gray-100 rounded"></div>
            </div>
          </div>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No invoices found</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="space-y-8">
            {communityGroupsList.map((cGroup) => (
              <div key={cGroup.communityName} className="space-y-3 bg-gray-50/30 p-4 rounded-2xl border border-gray-100/80">
                {/* Community Group Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                  <div>
                    <h2 className="text-base font-bold text-gray-950 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-600"></span>
                      {cGroup.communityName}
                    </h2>
                    <p className="text-xs text-gray-500">
                      {cGroup.usersList.length} user{cGroup.usersList.length !== 1 ? 's' : ''} with invoices
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                      Pending: {formatCurrency(cGroup.totalPending)}
                    </span>
                  </div>
                </div>

                {/* Users List under this Community */}
                <div className="space-y-3">
                  {cGroup.usersList.map((group) => {
                    const isExpanded = expandedUsers.has(group.userId);
                    const totalAmount = group.invoices.reduce((sum, inv) => sum + inv.amount, 0);
                    return (
                      <div key={group.userId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Accordion Header */}
                        <button
                          type="button"
                          onClick={() => toggleExpandUser(group.userId)}
                          className="w-full flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-50 transition text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-gray-400 flex-shrink-0">
                              {isExpanded ? (
                                <ChevronDown className="w-5 h-5 text-gray-600" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-gray-600" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 text-sm">
                                {group.userName}
                              </h3>
                              <p className="text-xs text-gray-500">{group.userPhone}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm font-medium">
                            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                              {group.invoices.length} invoice{group.invoices.length !== 1 ? 's' : ''}
                            </span>
                            <span className="text-gray-900 font-semibold">
                              Total: {formatCurrency(totalAmount)}
                            </span>
                          </div>
                        </button>

                        {/* Accordion Content */}
                        {isExpanded && (
                          <div className="border-t border-gray-100 overflow-x-auto">
                            <table className="w-full text-left">
                              <thead className="bg-gray-50/70 border-b border-gray-100">
                                <tr>
                                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Invoice No.</th>
                                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Vehicle & Service</th>
                                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Billing Month</th>
                                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Due Date</th>
                                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {group.invoices.map((inv) => (
                                  <tr key={inv.id} className="hover:bg-gray-50 transition">
                                    <td className="px-4 py-3">
                                      <span className="font-semibold text-gray-800 text-xs">
                                        {inv.invoiceNumber}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-700">
                                      <p className="font-medium">{inv.serviceName}</p>
                                      <p className="text-gray-500 text-[10px]">{inv.vehicleReg}</p>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-600">
                                      {formatBillingMonthLabel(inv.billingMonth)}
                                    </td>
                                    <td className="px-4 py-3 text-xs">
                                      <span className="font-semibold text-gray-900">
                                        {formatCurrency(inv.amount)}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-500">
                                      {formatDateTime(inv.dueDate)}
                                    </td>
                                    <td className="px-4 py-3 text-xs">
                                      <span className={`inline-flex px-2 py-0.5 font-semibold rounded-full capitalize text-[10px] ${getStatusBadge(inv.status)}`}>
                                        {inv.status === 'pending_verification' ? 'Pending Verif.' : inv.status}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-right text-xs">
                                      <div className="flex items-center justify-end gap-1">
                                        <button
                                          type="button"
                                          onClick={() => openEditModal(inv)}
                                          disabled={processing === inv.id}
                                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                          title="Edit invoice"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteInvoice(inv.id)}
                                          disabled={processing === inv.id}
                                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                                          title="Delete invoice"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-white border border-gray-100 rounded-xl flex items-center justify-between shadow-sm">
              <div className="text-xs text-gray-500">
                Showing {Math.min(filteredInvoices.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(filteredInvoices.length, currentPage * itemsPerPage)} of {filteredInvoices.length} entries
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-100 transition whitespace-nowrap"
                >
                  Previous
                </button>
                <span className="text-xs text-gray-600 font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-100 transition whitespace-nowrap"
                >
                  Next
                </button>
              </div>
            </div>
          )}
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
