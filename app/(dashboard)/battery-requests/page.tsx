'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  Loader2,
  Trash2,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Eye,
  BatteryCharging,
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

interface BatteryRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  community: string;
  vehicleName: string;
  vehicleReg: string;
  batteryType: string;
  price: number;
  status: string;
  notes: string;
  createdAt: number;
  technicianName?: string;
  technicianPhone?: string;
  updatedAt?: number;
}

export default function BatteryRequestsPage() {
  const [requests, setRequests] = useState<BatteryRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [communityFilter, setCommunityFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Modals state
  const [selectedRequest, setSelectedRequest] = useState<BatteryRequest | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Edit form state
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editPrice, setEditPrice] = useState(0);
  const [editTechName, setEditTechName] = useState('');
  const [editTechPhone, setEditTechPhone] = useState('');

  // Create form state
  const [newUserId, setNewUserId] = useState('');
  const [newVehicleReg, setNewVehicleReg] = useState('');
  const [newBatteryType, setNewBatteryType] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newNotes, setNewNotes] = useState('');

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
    fetchUsers();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/battery-requests');
      const data = await res.json();
      if (Array.isArray(data)) setRequests(data);
    } catch (error) {
      console.error('Failed to fetch battery requests:', error);
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

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserId || !newBatteryType) return;
    setProcessing('create');
    try {
      const user = users.find((u) => u.id === newUserId);
      const vehicle = user?.vehicles?.find((v) => v.registrationNumber === newVehicleReg);
      const vehicleName = vehicle ? `${vehicle.make} ${vehicle.model}` : 'Unknown Vehicle';

      const res = await fetch('/api/battery-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: newUserId,
          vehicleName,
          vehicleReg: newVehicleReg || 'N/A',
          batteryType: newBatteryType,
          price: Number(newPrice) || 0,
          notes: newNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to create request');
      } else {
        setShowCreateModal(false);
        resetCreateForm();
        await fetchRequests();
      }
    } catch (error) {
      console.error('Failed to create request:', error);
      alert('An error occurred');
    } finally {
      setProcessing(null);
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedRequest) return;
    setProcessing(selectedRequest.id);
    try {
      const res = await fetch(`/api/battery-requests/${selectedRequest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editStatus,
          notes: editNotes,
          price: Number(editPrice) || 0,
          technicianName: editTechName,
          technicianPhone: editTechPhone,
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
    if (!confirm('Are you sure you want to delete this battery request?')) return;
    setProcessing(id);
    try {
      const res = await fetch(`/api/battery-requests/${id}`, {
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

  const resetCreateForm = () => {
    setNewUserId('');
    setNewVehicleReg('');
    setNewBatteryType('');
    setNewPrice('');
    setNewNotes('');
  };

  const openDetailsModal = (req: BatteryRequest) => {
    setSelectedRequest(req);
    setEditStatus(req.status);
    setEditNotes(req.notes || '');
    setEditPrice(req.price || 0);
    setEditTechName(req.technicianName || '');
    setEditTechPhone(req.technicianPhone || '');
  };

  const activeUser = users.find((u) => u.id === newUserId);
  const activeUserVehicles = activeUser?.vehicles || [];

  const uniqueCommunities = Array.from(new Set(requests.map((r) => r.community).filter(Boolean)));

  const filteredRequests = requests.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (communityFilter !== 'all' && r.community !== communityFilter) return false;
    if (debouncedSearch) {
      const s = debouncedSearch.toLowerCase();
      return (
        r.userName?.toLowerCase().includes(s) ||
        r.vehicleReg?.toLowerCase().includes(s) ||
        r.batteryType?.toLowerCase().includes(s) ||
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
      'In Progress': 'bg-amber-100 text-amber-700',
      Completed: 'bg-green-100 text-green-700',
      Cancelled: 'bg-gray-100 text-gray-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <BatteryCharging className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Battery Requests</h1>
            <p className="text-gray-500">{requests.length} total requests</p>
          </div>
        </div>
        <button
          onClick={() => {
            resetCreateForm();
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Request
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
          <span className="text-xs text-gray-500 px-2">Status:</span>
          {['all', 'Requested', 'In Progress', 'Completed', 'Cancelled'].map((s) => (
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
            placeholder="Search by name, registration, or battery..."
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
          <p className="text-gray-500">No battery requests found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Community</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Battery Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Created</th>
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
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <p className="font-medium">{req.vehicleName}</p>
                      <p className="text-xs text-gray-500">{req.vehicleReg}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-950 font-medium">
                      {req.batteryType}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-semibold">
                      {req.price > 0 ? formatCurrency(req.price) : 'Quote Pending'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadge(req.status)}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {formatDateTime(req.createdAt)}
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

      {/* Add Battery Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreateRequest} className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Add Battery Replacement Request</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Select User</label>
                <select
                  required
                  value={newUserId}
                  onChange={(e) => {
                    setNewUserId(e.target.value);
                    setNewVehicleReg('');
                  }}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value="">Choose a user...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.phoneNumber}) - {u.community}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Select Vehicle</label>
                <select
                  required
                  disabled={!newUserId}
                  value={newVehicleReg}
                  onChange={(e) => setNewVehicleReg(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-100"
                >
                  <option value="">Choose vehicle...</option>
                  {activeUserVehicles.map((v) => (
                    <option key={v.registrationNumber} value={v.registrationNumber}>
                      {v.registrationNumber} - {v.make} {v.model} ({v.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Battery Type / Model</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amaron Hi-Life 12V 55AH"
                  value={newBatteryType}
                  onChange={(e) => setNewBatteryType(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Price Quote (INR, optional)</label>
                <input
                  type="number"
                  placeholder="e.g. 5200"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Problem / Admin Notes</label>
                <textarea
                  placeholder="Additional customer notes or symptoms..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
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
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 text-sm font-medium"
              >
                {processing === 'create' && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Request
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit/Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Manage Battery Request</h3>
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
                  <p className="text-xs text-gray-400 font-semibold uppercase">Vehicle</p>
                  <p className="font-semibold text-gray-900">{selectedRequest.vehicleName}</p>
                  <p className="text-xs text-gray-500">{selectedRequest.vehicleReg}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase">Requested On</p>
                  <p className="text-gray-950 font-medium">{formatDateTime(selectedRequest.createdAt)}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Battery Type / Model</label>
                <div className="p-2.5 bg-gray-100 rounded-lg text-sm text-gray-800 font-medium border border-gray-200">
                  {selectedRequest.batteryType}
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
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Price Quote (INR)</label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Assign Service Technician</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Technician Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={editTechName}
                      onChange={(e) => setEditTechName(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Technician Phone</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 9876543210"
                      value={editTechPhone}
                      onChange={(e) => setEditTechPhone(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Problem / Admin Notes</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  rows={3}
                  placeholder="Add details, symptoms, scheduling info..."
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
