'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  Loader2,
  Trash2,
  AlertTriangle,
  Eye,
  Car,
  Calendar,
  Clock,
  MapPin,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface DriverRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  community: string;
  pickupLocation: string;
  dropLocation: string;
  pickupDate: string;
  pickupTime: string;
  notes: string;
  status: string;
  timestamp: number;
  driverName?: string;
  driverPhone?: string;
  driverRating?: number;
}

export default function DriverRequestsPage() {
  const [requests, setRequests] = useState<DriverRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [communityFilter, setCommunityFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Modal State
  const [selectedRequest, setSelectedRequest] = useState<DriverRequest | null>(null);

  // Edit form state
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editDriverName, setEditDriverName] = useState('');
  const [editDriverPhone, setEditDriverPhone] = useState('');
  const [editDriverRating, setEditDriverRating] = useState(4.8);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, communityFilter]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/driver-requests');
      const data = await res.json();
      if (Array.isArray(data)) setRequests(data);
    } catch (error) {
      console.error('Failed to fetch driver requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedRequest) return;
    setProcessing(selectedRequest.id);
    try {
      const res = await fetch(`/api/driver-requests/${selectedRequest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editStatus,
          notes: editNotes,
          driverName: editDriverName,
          driverPhone: editDriverPhone,
          driverRating: Number(editDriverRating) || 4.8,
        }),
      });

      if (res.ok) {
        setSelectedRequest(null);
        await fetchRequests();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save changes');
      }
    } catch (error) {
      console.error('Failed to save changes:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (!confirm('Are you sure you want to delete this driver hire request?')) return;
    setProcessing(id);
    try {
      const res = await fetch(`/api/driver-requests/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSelectedRequest(null);
        await fetchRequests();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete request');
      }
    } catch (error) {
      console.error('Failed to delete request:', error);
    } finally {
      setProcessing(null);
    }
  };

  const openDetailsModal = (req: DriverRequest) => {
    setSelectedRequest(req);
    setEditStatus(req.status);
    setEditNotes(req.notes || '');
    setEditDriverName(req.driverName || '');
    setEditDriverPhone(req.driverPhone || '');
    setEditDriverRating(req.driverRating || 4.8);
  };

  const uniqueCommunities = Array.from(new Set(requests.map((r) => r.community).filter(Boolean)));

  const filteredRequests = requests.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (communityFilter !== 'all' && r.community !== communityFilter) return false;
    if (debouncedSearch) {
      const s = debouncedSearch.toLowerCase();
      return (
        r.userName?.toLowerCase().includes(s) ||
        r.pickupLocation?.toLowerCase().includes(s) ||
        r.dropLocation?.toLowerCase().includes(s) ||
        r.community?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      Requested: 'bg-blue-100 text-blue-700',
      'Driver Assigned': 'bg-purple-100 text-purple-700',
      Completed: 'bg-green-100 text-green-700',
      Cancelled: 'bg-gray-100 text-gray-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <Car className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Driver Requests</h1>
          <p className="text-gray-500">{requests.length} total driver hire requests</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
          <span className="text-xs text-gray-500 px-2">Status:</span>
          {['all', 'Requested', 'Driver Assigned', 'Completed', 'Cancelled'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                statusFilter === s
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s}
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
            placeholder="Search by user, pickup or drop..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12 bg-white rounded-xl border border-gray-100">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No driver hire requests found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Community</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Schedule</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Pickup Location</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Drop Location</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Assigned Driver</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 text-sm">{req.userName}</p>
                      <p className="text-xs text-gray-500">{req.userPhone}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {req.community}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-700 font-semibold mb-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>{req.pickupDate}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>{req.pickupTime}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-750 max-w-[160px] truncate" title={req.pickupLocation}>
                      {req.pickupLocation}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-755 max-w-[160px] truncate" title={req.dropLocation}>
                      {req.dropLocation}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadge(req.status)}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {req.driverName ? (
                        <div>
                          <p className="font-medium text-xs text-gray-900">{req.driverName}</p>
                          <p className="text-[10px] text-gray-500">{req.driverPhone}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDetailsModal(req)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRequest(req.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-lg transition"
                          title="Delete Request"
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

          {totalPages > 1 && (
            <div className="px-6 py-4 bg-white border-t border-gray-200 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(filteredRequests.length, currentPage * itemsPerPage)} of {filteredRequests.length} entries
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-gray-50 border rounded disabled:opacity-50 text-xs font-semibold"
                >
                  Previous
                </button>
                <span className="text-xs text-gray-600 flex items-center px-2">Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-gray-50 border rounded disabled:opacity-50 text-xs font-semibold"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit/Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Manage Driver Hire Request</h3>
              <button onClick={() => setSelectedRequest(null)} className="text-gray-400 hover:text-gray-500 font-medium">Close</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl text-sm border border-gray-100">
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase">Customer</p>
                  <p className="font-semibold text-gray-900">{selectedRequest.userName}</p>
                  <p className="text-xs text-gray-500">{selectedRequest.userPhone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase">Community</p>
                  <p className="font-bold text-green-700">{selectedRequest.community}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase">Pickup Date/Time</p>
                  <p className="font-semibold text-gray-900">{selectedRequest.pickupDate} at {selectedRequest.pickupTime}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase">Requested On</p>
                  <p className="text-gray-950 font-medium">{formatDateTime(selectedRequest.timestamp)}</p>
                </div>
              </div>

              <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm">
                <div className="flex gap-2 items-start">
                  <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Pickup Location</p>
                    <p className="text-gray-800">{selectedRequest.pickupLocation}</p>
                  </div>
                </div>
                <div className="flex gap-2 items-start">
                  <MapPin className="w-4 h-4 text-red-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Drop Location</p>
                    <p className="text-gray-800">{selectedRequest.dropLocation}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Request Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  >
                    <option value="Requested">Requested</option>
                    <option value="Driver Assigned">Driver Assigned</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Assign Driver Details</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Driver Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={editDriverName}
                      onChange={(e) => setEditDriverName(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Rating</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={editDriverRating}
                      onChange={(e) => setEditDriverRating(Number(e.target.value))}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Driver Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 9876543210"
                    value={editDriverPhone}
                    onChange={(e) => setEditDriverPhone(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Customer / Admin Notes</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  rows={3}
                  placeholder="Notes from customer request, or administrative details..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-between">
              <button
                type="button"
                onClick={() => handleDeleteRequest(selectedRequest.id)}
                className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg font-medium text-sm transition"
              >
                Delete Request
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={processing === selectedRequest.id}
                  onClick={handleSaveChanges}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition flex items-center gap-1.5"
                >
                  {processing === selectedRequest.id && <Loader2 className="w-4 h-4 animate-spin" />}
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
