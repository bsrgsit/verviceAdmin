'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  FileText,
  CreditCard,
  Receipt,
  Building2,
  TrendingUp,
  Loader2,
  Search,
  Ban,
  CheckCircle2,
  Eye,
  Clock,
  XCircle,
  AlertTriangle,
  Edit2,
  Trash2,
} from 'lucide-react';
import { formatCurrency, formatDateTime, timeAgo } from '@/lib/utils';

interface CommunityStats {
  communityName: string;
  city: string;
  blocks: string[];
  totalUnits: number;
  totalUsers: number;
  activeBookings: number;
  pendingPayments: number;
  monthlyRevenue: number;
}

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

type TabType = 'overview' | 'users' | 'bookings' | 'payments' | 'invoices';

export default function CommunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const communityId = params.id as string;

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Invoice Edit Modal State
  const [showEditModal, setShowEditModal] = useState<Invoice | null>(null);
  const [editAmount, setEditAmount] = useState(0);
  const [editDueDate, setEditDueDate] = useState('');
  const [editStatus, setEditStatus] = useState<Invoice['status']>('pending');
  const [editBillingMonth, setEditBillingMonth] = useState('');

  useEffect(() => {
    fetchCommunityData();
  }, [communityId]);

  const fetchCommunityData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/communities/${communityId}`);
      const data = await res.json();
      if (!data.error) {
        setStats(data.stats);
        setUsers(data.users || []);
        setBookings(data.bookings || []);
        setPayments(data.payments || []);
        setInvoices(data.invoices || []);
      }
    } catch (error) {
      console.error('Failed to fetch community details:', error);
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
        await fetchCommunityData();
      }
    } catch (e) {
      console.error('Failed to verify payment:', e);
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
        await fetchCommunityData();
      }
    } catch (e) {
      console.error('Failed to reject payment:', e);
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    setProcessing(invoiceId);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchCommunityData();
      }
    } catch (e) {
      console.error('Failed to delete invoice:', e);
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
        await fetchCommunityData();
      }
    } catch (error) {
      console.error('Failed to update invoice:', error);
    } finally {
      setProcessing(null);
    }
  };

  const openEditModal = (inv: Invoice) => {
    setShowEditModal(inv);
    setEditAmount(inv.amount);
    setEditStatus(inv.status);
    setEditBillingMonth(inv.billingMonth);
    const date = new Date(inv.dueDate);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    setEditDueDate(`${yyyy}-${mm}-${dd}`);
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

  const tabs: { key: TabType; label: string; icon: any }[] = [
    { key: 'overview', label: 'Overview', icon: Building2 },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'bookings', label: 'Bookings', icon: FileText },
    { key: 'payments', label: 'Payments', icon: CreditCard },
    { key: 'invoices', label: 'Invoices', icon: Receipt },
  ];

  const statCards = stats
    ? [
        { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-blue-500' },
        { label: 'Active Bookings', value: stats.activeBookings, icon: FileText, color: 'bg-green-500' },
        { label: 'Pending Payments', value: stats.pendingPayments, icon: Clock, color: 'bg-amber-500' },
        { label: 'Monthly Revenue', value: formatCurrency(stats.monthlyRevenue), icon: TrendingUp, color: 'bg-purple-500' },
      ]
    : [];

  const filteredUsers = users.filter((u) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(s) ||
      u.phoneNumber?.includes(search) ||
      u.email?.toLowerCase().includes(s) ||
      u.block?.toLowerCase().includes(s)
    );
  });

  const filteredBookings = bookings.filter((b) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      b.userName?.toLowerCase().includes(s) ||
      b.userPhone?.includes(search) ||
      b.status?.toLowerCase().includes(s)
    );
  });

  const filteredPayments = payments.filter((p) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      p.userName?.toLowerCase().includes(s) ||
      p.userPhone?.includes(search) ||
      p.upiTransactionId?.toLowerCase().includes(s) ||
      p.status?.toLowerCase().includes(s)
    );
  });

  const filteredInvoices = invoices.filter((i) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      i.userName?.toLowerCase().includes(s) ||
      i.userPhone?.includes(search) ||
      i.invoiceNumber?.toLowerCase().includes(s) ||
      i.status?.toLowerCase().includes(s)
    );
  });

  const getInvoiceStatusBadge = (status: Invoice['status']) => {
    const styles: Record<Invoice['status'], string> = {
      paid: 'bg-green-100 text-green-700',
      pending: 'bg-blue-100 text-blue-700',
      overdue: 'bg-red-100 text-red-700',
      pending_verification: 'bg-amber-100 text-amber-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/communities')}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {stats?.communityName || 'Community'}
          </h1>
          <p className="text-gray-500">{stats?.city}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setSearch(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === tab.key
                ? 'bg-white text-green-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card) => (
              <div
                key={card.label}
                className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center`}>
                    <card.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-sm text-gray-500">{card.label}</p>
              </div>
            ))}
          </div>

          {/* Blocks */}
          {stats?.blocks && stats.blocks.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Blocks</h3>
              <div className="flex flex-wrap gap-2">
                {stats.blocks.map((block) => (
                  <span
                    key={block}
                    className="px-3 py-1.5 bg-green-50 text-green-700 text-sm font-medium rounded-lg border border-green-100"
                  >
                    {block}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Community Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500">City</p>
                <p className="font-medium text-gray-900">{stats?.city || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Units</p>
                <p className="font-medium text-gray-900">{stats?.totalUnits || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Blocks</p>
                <p className="font-medium text-gray-900">{stats?.blocks?.length || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Registered Users</p>
                <p className="font-medium text-gray-900">{stats?.totalUsers || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name, phone, email, or block..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
            />
          </div>

          {tabLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-green-500" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No users found in this community</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Block / Flat</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Vehicles</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700">{user.phoneNumber}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700">
                            {user.block} {user.flatNumber ? `- ${user.flatNumber}` : ''}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700">{user.vehicles?.length || 0}</span>
                        </td>
                        <td className="px-4 py-3">
                          {user.paymentFlags?.accountRestricted ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                              <Ban className="w-3 h-3" />
                              Restricted
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              Active
                            </span>
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
      )}

      {activeTab === 'bookings' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search bookings by user name, phone, or status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
            />
          </div>

          {tabLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-green-500" />
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No bookings found in this community</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Vehicle</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Plan</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Start Date</th>
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
                          <span className="text-sm text-gray-700">
                            {booking.vehicleNumber || booking.vehicleName || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700">{booking.serviceName || booking.planName || booking.plan || 'N/A'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                            booking.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : booking.status === 'suspended'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {booking.status || 'unknown'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700">
                            {booking.startDate ? formatDateTime(booking.startDate) : 'N/A'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search payments by user name, phone, or transaction ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
            />
          </div>

          {payments.some((p) => p.duplicate) && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                Duplicate transaction IDs detected. Please verify these payments carefully.
              </p>
            </div>
          )}

          {tabLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-green-500" />
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No payments found in this community</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
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
                          <p className="font-medium text-gray-900 text-sm">{payment.userName}</p>
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
      )}

      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoices by user name, phone, or invoice number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
            />
          </div>

          {tabLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-green-500" />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
              <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No invoices found in this community</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Invoice No.</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Vehicle & Service</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Billing Month</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Due Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
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
                          <p className="font-medium text-gray-900 text-sm">{inv.userName}</p>
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
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${getInvoiceStatusBadge(inv.status)}`}>
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
