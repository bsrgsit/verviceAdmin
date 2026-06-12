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
  Trash2,
  Plus,
  Clock,
  Calendar,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface Vehicle {
  registrationNumber: string;
  type: string;
  make: string;
  model: string;
}

interface User {
  id: string;
  name: string;
  phoneNumber: string;
  community: string;
  vehicles: Vehicle[];
}

interface Booking {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  vehicleName: string;
  vehicleReg: string;
  serviceName: string;
  serviceType?: string;
  description?: string;
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
  partnerId?: string;
  partnerName?: string;
  partnerPhone?: string;
  partnerRating?: number;
  partnerStatus?: string;
  partnerEnteredAt?: number;
  lastCleanedDate?: string;
  lastCleanedAt?: number;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [selectedBookingIds, setSelectedBookingIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [communityFilter, setCommunityFilter] = useState('all');
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
  }, [debouncedSearch, statusFilter, paymentFilter, communityFilter]);
  
  // Modals state
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Edit Form State
  const [notes, setNotes] = useState('');
  const [editPrice, setEditPrice] = useState(0);
  const [editStatus, setEditStatus] = useState('');
  const [editPaymentDueDate, setEditPaymentDueDate] = useState('');
  const [editVehicleName, setEditVehicleName] = useState('');
  const [editVehicleReg, setEditVehicleReg] = useState('');
  const [editServiceName, setEditServiceName] = useState('');
  const [editServiceType, setEditServiceType] = useState('monthly');
  const [editDescription, setEditDescription] = useState('');
  const [editStartDate, setEditStartDate] = useState('');

  // Partner Assignment State
  const [editPartnerId, setEditPartnerId] = useState('');
  const [editPartnerName, setEditPartnerName] = useState('');
  const [editPartnerPhone, setEditPartnerPhone] = useState('');
  const [editPartnerRating, setEditPartnerRating] = useState(4.8);
  const [editPartnerStatus, setEditPartnerStatus] = useState('not_entered');
  const [editPartnerEnteredAt, setEditPartnerEnteredAt] = useState(0);

  // Create Form State
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedVehicleReg, setSelectedVehicleReg] = useState('');
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceType, setNewServiceType] = useState('monthly');
  const [newDescription, setNewDescription] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  useEffect(() => {
    fetchBookings();
    fetchUsers();
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const res = await fetch('/api/partners');
      const data = await res.json();
      if (Array.isArray(data)) setPartners(data);
    } catch (error) {
      console.error('Failed to fetch partners:', error);
    }
  };

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

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !selectedVehicleReg || !newServiceName || !newPrice) return;
    setProcessing('create');
    try {
      const user = users.find((u) => u.id === selectedUserId);
      const vehicle = user?.vehicles?.find((v) => v.registrationNumber === selectedVehicleReg);
      const vehicleName = vehicle ? `${vehicle.make} ${vehicle.model}` : 'Unknown Vehicle';

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          vehicleName,
          vehicleReg: selectedVehicleReg,
          serviceName: newServiceName,
          serviceType: newServiceType,
          description: newDescription,
          price: Number(newPrice),
          startDate: newStartDate ? new Date(newStartDate).getTime() : Date.now(),
          paymentDueDate: newDueDate ? new Date(newDueDate).getTime() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to create booking');
      } else {
        setShowCreateModal(false);
        resetCreateForm();
        await fetchBookings();
      }
    } catch (error) {
      console.error('Failed to create booking:', error);
      alert('An error occurred during booking creation');
    } finally {
      setProcessing(null);
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
          serviceName: editServiceName,
          serviceType: editServiceType,
          description: editDescription,
          startDate: editStartDate ? new Date(editStartDate).getTime() : 0,
          paymentDueDate: editPaymentDueDate ? new Date(editPaymentDueDate).getTime() : 0,
          partnerId: editPartnerId,
          partnerName: editPartnerName,
          partnerPhone: editPartnerPhone,
          partnerRating: Number(editPartnerRating),
          partnerStatus: editPartnerStatus,
          partnerEnteredAt: Number(editPartnerEnteredAt),
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

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this booking subscription? This cannot be undone.')) return;
    setProcessing(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to delete booking');
      } else {
        setSelectedBooking(null);
        await fetchBookings();
      }
    } catch (error) {
      console.error('Failed to delete booking:', error);
      alert('An error occurred during booking deletion');
    } finally {
      setProcessing(null);
    }
  };

  const resetCreateForm = () => {
    setSelectedUserId('');
    setSelectedVehicleReg('');
    setNewServiceName('');
    setNewServiceType('monthly');
    setNewDescription('');
    setNewPrice('');
    setNewStartDate('');
    setNewDueDate('');
  };

  const uniqueCommunities = Array.from(new Set(bookings.map((b) => b.community).filter(Boolean)));

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (paymentFilter !== 'all' && b.paymentStatus !== paymentFilter) return false;
    if (communityFilter !== 'all' && b.community !== communityFilter) return false;
    if (debouncedSearch) {
      const s = debouncedSearch.toLowerCase();
      return (
        b.userName?.toLowerCase().includes(s) ||
        b.vehicleReg?.toLowerCase().includes(s) ||
        b.serviceName?.toLowerCase().includes(s) ||
        b.community?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const paginatedBookings = filteredBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
    setEditServiceName(booking.serviceName || '');
    setEditServiceType(booking.serviceType || 'monthly');
    setEditDescription(booking.description || '');

    if (booking.paymentDueDate) {
      const date = new Date(booking.paymentDueDate);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      setEditPaymentDueDate(`${yyyy}-${mm}-${dd}`);
    } else {
      setEditPaymentDueDate('');
    }

    if (booking.startDate) {
      const date = new Date(booking.startDate);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      setEditStartDate(`${yyyy}-${mm}-${dd}`);
    } else {
      setEditStartDate('');
    }

    setEditPartnerId(booking.partnerId || '');
    setEditPartnerName(booking.partnerName || '');
    setEditPartnerPhone(booking.partnerPhone || '');
    setEditPartnerRating(booking.partnerRating || 4.8);
    setEditPartnerStatus(booking.partnerStatus || 'not_entered');
    setEditPartnerEnteredAt(booking.partnerEnteredAt || 0);
  };

  // Selected User's Vehicles list for Add form dropdown
  const activeUser = users.find((u) => u.id === selectedUserId);
  const activeUserVehicles = activeUser?.vehicles || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-500">{bookings.length} total bookings</p>
        </div>
        <button
          onClick={() => {
            resetCreateForm();
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Booking
        </button>
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

        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
          <span className="text-xs text-gray-500 px-2">Community:</span>
          <select
            value={communityFilter}
            onChange={(e) => setCommunityFilter(e.target.value)}
            className="p-1 px-2 bg-white border-0 text-xs font-medium rounded-md focus:ring-0 focus:outline-none cursor-pointer text-gray-700"
          >
            <option value="all">All Communities</option>
            {uniqueCommunities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
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
        <div className="space-y-4 animate-pulse">
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
            <div className="bg-gray-50 h-12 border-b border-gray-200"></div>
            <div className="divide-y divide-gray-100">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="p-4 flex items-center justify-between space-x-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/12"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/12"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No bookings found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {selectedBookingIds.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-2 text-green-800 text-sm font-semibold">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span>{selectedBookingIds.length} bookings selected</span>
              </div>
              <div className="flex items-center gap-3">
                <select
                  onChange={async (e) => {
                    const pId = e.target.value;
                    if (!pId) return;
                    const isAssign = pId !== 'none';
                    if (confirm(`${isAssign ? 'Assign selected partner to' : 'Unassign partner from'} ${selectedBookingIds.length} bookings?`)) {
                      setProcessing('bulk-assign');
                      try {
                        const res = await fetch('/api/bookings/bulk-assign', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ bookingIds: selectedBookingIds, partnerId: isAssign ? pId : '' }),
                        });
                        if (!res.ok) {
                          const data = await res.json();
                          alert(data.error || 'Failed to bulk update');
                        } else {
                          setSelectedBookingIds([]);
                          await fetchBookings();
                        }
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setProcessing(null);
                      }
                    }
                    e.target.value = '';
                  }}
                  className="p-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-green-500 outline-none cursor-pointer"
                >
                  <option value="">Bulk Assign Partner...</option>
                  <option value="none">Unassign Partner</option>
                  {partners.filter(p => p.status === 'active').map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.phoneNumber})</option>
                  ))}
                </select>

                <button
                  onClick={async () => {
                    if (confirm(`Mark today's cleaning completed for ${selectedBookingIds.length} bookings?`)) {
                      setProcessing('bulk-complete');
                      try {
                        await Promise.all(selectedBookingIds.map(async (bookingId) => {
                          try {
                            await fetch(`/api/bookings/${bookingId}/complete-cleaning`, { method: 'POST' });
                          } catch (err) {
                            console.error(`Failed to complete cleaning for ${bookingId}:`, err);
                          }
                        }));
                        setSelectedBookingIds([]);
                        await fetchBookings();
                      } finally {
                        setProcessing(null);
                      }
                    }
                  }}
                  className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition"
                >
                  Mark Cleaned Today
                </button>

                <button
                  onClick={() => setSelectedBookingIds([])}
                  className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold rounded-lg transition"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left w-10">
                      <input
                        type="checkbox"
                        checked={paginatedBookings.length > 0 && paginatedBookings.every(b => selectedBookingIds.includes(b.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            const pageIds = paginatedBookings.map(b => b.id);
                            setSelectedBookingIds(prev => Array.from(new Set([...prev, ...pageIds])));
                          } else {
                            const pageIds = paginatedBookings.map(b => b.id);
                            setSelectedBookingIds(prev => prev.filter(id => !pageIds.includes(id)));
                          }
                        }}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Community</th>
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
                {paginatedBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={selectedBookingIds.includes(booking.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBookingIds(prev => [...prev, booking.id]);
                          } else {
                            setSelectedBookingIds(prev => prev.filter(id => id !== booking.id));
                          }
                        }}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 text-sm">{booking.userName}</p>
                      <p className="text-xs text-gray-500">{booking.userPhone}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {booking.community || 'N/A'}
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
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700 animate-pulse">
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
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBooking(booking.id)}
                          disabled={processing === booking.id}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-lg transition"
                          title="Delete Booking"
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-white border-t border-gray-200 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Showing {Math.min(filteredBookings.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(filteredBookings.length, currentPage * itemsPerPage)} of {filteredBookings.length} entries
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
      </div>
    )}

      {/* Booking Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreateBooking} className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Add New Subscription Booking</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Select User</label>
                <select
                  required
                  value={selectedUserId}
                  onChange={(e) => {
                    setSelectedUserId(e.target.value);
                    setSelectedVehicleReg('');
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
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Select Vehicle</label>
                <select
                  required
                  disabled={!selectedUserId}
                  value={selectedVehicleReg}
                  onChange={(e) => setSelectedVehicleReg(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-100"
                >
                  <option value="">Choose vehicle...</option>
                  {activeUserVehicles.map((v) => (
                    <option key={v.registrationNumber} value={v.registrationNumber}>
                      {v.registrationNumber} - {v.make} {v.model} ({v.type})
                    </option>
                  ))}
                </select>
                {selectedUserId && activeUserVehicles.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">This user has no registered vehicles. Add a vehicle first.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Service / Plan Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Daily Hatchback Clean"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Plan Type</label>
                  <select
                    value={newServiceType}
                    onChange={(e) => setNewServiceType(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="once">Once</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Plan Description</label>
                <textarea
                  placeholder="Plan details / schedule / frequency description..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Price (INR/mo)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 500"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Payment Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
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
                disabled={processing === 'create' || !selectedVehicleReg}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 text-sm font-medium disabled:opacity-50"
              >
                {processing === 'create' && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Booking
              </button>
            </div>
          </form>
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
                      {processing === selectedBooking.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
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
                  <p className="text-xs text-gray-500">Community</p>
                  <p className="font-medium text-green-700 text-sm font-semibold">{selectedBooking.community || 'N/A'}</p>
                </div>
                <div>{/* spacer */}</div>

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
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Plan / Service Name</label>
                  <input
                    type="text"
                    value={editServiceName}
                    onChange={(e) => setEditServiceName(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Plan Type</label>
                  <select
                    value={editServiceType}
                    onChange={(e) => setEditServiceType(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="once">Once</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Plan Description</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    rows={2}
                    placeholder="Plan details / schedule / frequency description..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Start Date</label>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
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

                <div className="col-span-2 border-t border-gray-100 pt-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Partner & Presence</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Assigned Cleaning Partner</label>
                      <select
                        value={editPartnerId}
                        onChange={(e) => {
                          const pId = e.target.value;
                          setEditPartnerId(pId);
                          if (pId) {
                            const partner = partners.find(p => p.id === pId);
                            setEditPartnerName(partner ? partner.name : '');
                            setEditPartnerPhone(partner ? partner.phoneNumber : '');
                            setEditPartnerRating(partner ? partner.rating : 4.8);
                            setEditPartnerStatus(partner ? (partner.enteredCommunity ? 'entered' : 'not_entered') : 'not_entered');
                            setEditPartnerEnteredAt(partner ? (partner.enteredAt || 0) : 0);
                          } else {
                            setEditPartnerName('');
                            setEditPartnerPhone('');
                            setEditPartnerRating(4.8);
                            setEditPartnerStatus('not_entered');
                            setEditPartnerEnteredAt(0);
                          }
                        }}
                        className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none cursor-pointer"
                      >
                        <option value="">No Partner Assigned</option>
                        {partners
                          .filter(p => p.communities && p.communities.includes(selectedBooking.community) && p.status === 'active')
                          .map((p) => (
                            <option key={p.id} value={p.id}>{p.name} ({p.phoneNumber})</option>
                          ))
                        }
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Today's Washing Log</label>
                      <div className="flex items-center gap-3 mt-1.5">
                        {selectedBooking.lastCleanedDate === new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()) ? (
                          <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                            🟢 Completed Today
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={processing === selectedBooking.id}
                            onClick={async () => {
                              setProcessing(selectedBooking.id);
                              try {
                                const res = await fetch(`/api/bookings/${selectedBooking.id}/complete-cleaning`, { method: 'POST' });
                                if (res.ok) {
                                  const updated = await res.json();
                                  setSelectedBooking({
                                    ...selectedBooking,
                                    lastCleanedDate: updated.lastCleanedDate,
                                    lastCleanedAt: updated.lastCleanedAt
                                  });
                                  await fetchBookings();
                                } else {
                                  const data = await res.json();
                                  alert(data.error || 'Failed to complete wash');
                                }
                              } catch (e) {
                                console.error(e);
                              } finally {
                                setProcessing(null);
                              }
                            }}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition"
                          >
                            Mark Cleaned Today
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
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

            <div className="p-6 border-t border-gray-100 flex justify-between gap-3">
              <button
                type="button"
                onClick={() => handleDeleteBooking(selectedBooking.id)}
                disabled={processing === selectedBooking.id}
                className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition text-sm font-medium flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Delete Booking
              </button>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={processing === selectedBooking.id}
                  onClick={handleSaveChanges}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 text-sm font-medium"
                >
                  {processing === selectedBooking.id && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
