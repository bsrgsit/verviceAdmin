'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  Loader2,
  Ban,
  CheckCircle2,
  Eye,
  AlertTriangle,
  Users as UsersIcon,
  Plus,
  Edit2,
  Trash2,
  Lock,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface Vehicle {
  registrationNumber: string;
  type: '2 Wheeler' | '4 Wheeler';
  make: string;
  model: string;
  fuelType: string;
  vehicleClass?: string;
  parkingSlot: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  community: string;
  block: string;
  flatNumber: string;
  vehicles: Vehicle[];
  createdAt: number;
  paymentFlags?: {
    totalPaid: number;
    totalDue: number;
    overdueCount: number;
    accountRestricted: boolean;
    restrictedReason: string;
  };
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
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
  }, [debouncedSearch]);

  // Modals and Forms State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [restrictReason, setRestrictReason] = useState('');

  // User Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    community: '',
    block: '',
    flatNumber: '',
  });

  // Nested Vehicles State (during Add/Edit)
  const [userVehicles, setUserVehicles] = useState<Vehicle[]>([]);
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [editingVehicleIndex, setEditingVehicleIndex] = useState<number | null>(null);
  const [vehicleData, setVehicleData] = useState<Vehicle>({
    registrationNumber: '',
    type: '4 Wheeler',
    make: '',
    model: '',
    fuelType: '',
    parkingSlot: '',
  });

  useEffect(() => {
    fetchUsers();
    fetchCommunities();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommunities = async () => {
    try {
      const res = await fetch('/api/communities');
      const data = await res.json();
      if (Array.isArray(data)) setCommunities(data);
    } catch (error) {
      console.error('Failed to fetch communities:', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing('create');
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          vehicles: userVehicles,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to create user');
      } else {
        setShowCreateModal(false);
        resetForm();
        await fetchUsers();
      }
    } catch (error) {
      console.error('Failed to create user:', error);
      alert('An error occurred during user creation');
    } finally {
      setProcessing(null);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setProcessing(selectedUser.id);
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          vehicles: userVehicles,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to update user');
      } else {
        setIsEditMode(false);
        setSelectedUser(null);
        resetForm();
        await fetchUsers();
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      alert('An error occurred during user update');
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!confirm(`WARNING: Are you sure you want to delete user "${name}"?\nThis will cascade delete all bookings, payments, and invoices for this user, and delete their Firebase Auth credentials.`)) {
      return;
    }
    setProcessing(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to delete user');
      } else {
        setSelectedUser(null);
        await fetchUsers();
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('An error occurred during user deletion');
    } finally {
      setProcessing(null);
    }
  };

  const handleRestrict = async (userId: string) => {
    setProcessing(userId);
    try {
      await fetch(`/api/users/${userId}/restrict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: restrictReason }),
      });
      await fetchUsers();
      setSelectedUser(null);
    } finally {
      setProcessing(null);
    }
  };

  const handleUnrestrict = async (userId: string) => {
    setProcessing(userId);
    try {
      await fetch(`/api/users/${userId}/unrestrict`, { method: 'POST' });
      await fetchUsers();
      setSelectedUser(null);
    } finally {
      setProcessing(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phoneNumber: '',
      community: '',
      block: '',
      flatNumber: '',
    });
    setUserVehicles([]);
    setIsAddingVehicle(false);
    setEditingVehicleIndex(null);
  };

  const openViewModal = (user: User) => {
    setSelectedUser(user);
    setIsEditMode(false);
    setRestrictReason(user.paymentFlags?.restrictedReason || '');
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      community: user.community || '',
      block: user.block || '',
      flatNumber: user.flatNumber || '',
    });
    setUserVehicles(user.vehicles || []);
  };

  const startEditMode = () => {
    setIsEditMode(true);
  };

  // Nested Vehicles Helpers
  const handleSaveVehicle = () => {
    if (!vehicleData.registrationNumber.trim()) {
      alert('Registration number is required');
      return;
    }
    const cleanReg = vehicleData.registrationNumber.trim().toUpperCase();

    // Check for duplicates in local list
    const isDuplicate = userVehicles.some((v, idx) => 
      v.registrationNumber.toUpperCase() === cleanReg && idx !== editingVehicleIndex
    );
    if (isDuplicate) {
      alert('A vehicle with this registration number already exists.');
      return;
    }

    const updated = [...userVehicles];
    const newV = { ...vehicleData, registrationNumber: cleanReg };

    if (editingVehicleIndex !== null) {
      updated[editingVehicleIndex] = newV;
    } else {
      updated.push(newV);
    }

    setUserVehicles(updated);
    setIsAddingVehicle(false);
    setEditingVehicleIndex(null);
    setVehicleData({
      registrationNumber: '',
      type: '4 Wheeler',
      make: '',
      model: '',
      fuelType: '',
      parkingSlot: '',
    });
  };

  const startEditVehicle = (idx: number) => {
    setEditingVehicleIndex(idx);
    setVehicleData(userVehicles[idx]);
    setIsAddingVehicle(true);
  };

  const handleDeleteVehicle = (idx: number) => {
    if (!confirm('Are you sure you want to remove this vehicle?')) return;
    setUserVehicles(userVehicles.filter((_, i) => i !== idx));
  };

  const filteredUsers = users.filter((u) => {
    if (!debouncedSearch) return true;
    const s = debouncedSearch.toLowerCase();
    return (
      u.name?.toLowerCase().includes(s) ||
      u.phoneNumber?.includes(debouncedSearch) ||
      u.community?.toLowerCase().includes(s) ||
      u.email?.toLowerCase().includes(s)
    );
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500">{users.length} total users</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, phone, community, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
        />
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
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No users found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Community</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Vehicles</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700">{user.phoneNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700">{user.community || 'N/A'}</span>
                      {user.block && (
                        <p className="text-xs text-gray-500">
                          {user.block} - {user.flatNumber}
                        </p>
                      )}
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
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openViewModal(user)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            openViewModal(user);
                            startEditMode();
                          }}
                          className="p-2 text-gray-400 hover:text-amber-600 hover:bg-gray-100 rounded-lg transition"
                          title="Edit User"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          disabled={processing === user.id}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-lg transition"
                          title="Delete User"
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
                Showing {Math.min(filteredUsers.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(filteredUsers.length, currentPage * itemsPerPage)} of {filteredUsers.length} entries
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

      {/* User Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreateUser} className="bg-white rounded-2xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-900">Add New User</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-500 text-sm font-medium"
              >
                Close
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="Enter name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="Enter email"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="10-digit number"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Community</label>
                  <select
                    value={formData.community}
                    onChange={(e) => setFormData({ ...formData, community: e.target.value })}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  >
                    <option value="">Choose Community...</option>
                    {communities.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Block</label>
                  <input
                    type="text"
                    value={formData.block}
                    onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="e.g. A Block"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Flat Number</label>
                  <input
                    type="text"
                    value={formData.flatNumber}
                    onChange={(e) => setFormData({ ...formData, flatNumber: e.target.value })}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="e.g. 302"
                  />
                </div>
              </div>

              {/* Nested Vehicles Form */}
              <div className="border-t border-gray-100 pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Vehicles ({userVehicles.length})</h4>
                  {!isAddingVehicle && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingVehicleIndex(null);
                        setVehicleData({
                          registrationNumber: '',
                          type: '4 Wheeler',
                          make: '',
                          model: '',
                          fuelType: '',
                          parkingSlot: '',
                        });
                        setIsAddingVehicle(true);
                      }}
                      className="text-xs text-green-600 hover:text-green-700 font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Vehicle
                    </button>
                  )}
                </div>

                {isAddingVehicle && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                    <h5 className="text-xs font-bold text-gray-700">{editingVehicleIndex !== null ? 'Edit Vehicle' : 'New Vehicle'}</h5>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Registration Number</label>
                        <input
                          type="text"
                          value={vehicleData.registrationNumber}
                          disabled={editingVehicleIndex !== null}
                          onChange={(e) => setVehicleData({ ...vehicleData, registrationNumber: e.target.value })}
                          className="w-full p-2 border border-gray-200 rounded-lg text-xs outline-none uppercase disabled:bg-gray-100"
                          placeholder="e.g. MH12AB1234"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Type</label>
                        <select
                          value={vehicleData.type}
                          disabled={editingVehicleIndex !== null}
                          onChange={(e) => setVehicleData({ ...vehicleData, type: e.target.value as Vehicle['type'] })}
                          className="w-full p-2 border border-gray-200 rounded-lg text-xs outline-none disabled:bg-gray-100"
                        >
                          <option value="4 Wheeler">4 Wheeler</option>
                          <option value="2 Wheeler">2 Wheeler</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Make</label>
                        <input
                          type="text"
                          value={vehicleData.make}
                          onChange={(e) => setVehicleData({ ...vehicleData, make: e.target.value })}
                          className="w-full p-2 border border-gray-200 rounded-lg text-xs outline-none"
                          placeholder="e.g. Maruti Suzuki"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Model</label>
                        <input
                          type="text"
                          value={vehicleData.model}
                          onChange={(e) => setVehicleData({ ...vehicleData, model: e.target.value })}
                          className="w-full p-2 border border-gray-200 rounded-lg text-xs outline-none"
                          placeholder="e.g. Swift"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Fuel Type</label>
                        <input
                          type="text"
                          value={vehicleData.fuelType}
                          onChange={(e) => setVehicleData({ ...vehicleData, fuelType: e.target.value })}
                          className="w-full p-2 border border-gray-200 rounded-lg text-xs outline-none"
                          placeholder="e.g. Petrol / EV"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Parking Slot</label>
                        <input
                          type="text"
                          value={vehicleData.parkingSlot}
                          onChange={(e) => setVehicleData({ ...vehicleData, parkingSlot: e.target.value })}
                          className="w-full p-2 border border-gray-200 rounded-lg text-xs outline-none"
                          placeholder="e.g. B-102"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setIsAddingVehicle(false)}
                        className="px-3 py-1 bg-white text-gray-600 rounded-lg text-xs border border-gray-200 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveVehicle}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}

                {/* List Vehicles */}
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {userVehicles.map((vehicle, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-gray-50 text-xs">
                      <div>
                        <p className="font-semibold text-gray-900">{vehicle.registrationNumber}</p>
                        <p className="text-gray-500">{vehicle.make} {vehicle.model} ({vehicle.type})</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => startEditVehicle(idx)}
                          className="p-1 text-gray-500 hover:text-amber-600 hover:bg-white rounded transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteVehicle(idx)}
                          className="p-1 text-gray-500 hover:text-red-600 hover:bg-white rounded transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {userVehicles.length === 0 && !isAddingVehicle && (
                    <p className="text-center text-xs text-gray-400 py-4">No vehicles added yet</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
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
                Add User
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User Detail & Edit Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleUpdateUser} className="bg-white rounded-2xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-900">
                {isEditMode ? `Edit User: ${selectedUser.name}` : 'User Details'}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-500 text-sm font-medium"
              >
                Close
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto">
              {!isEditMode ? (
                // View Mode
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="font-semibold text-gray-900">{selectedUser.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="font-semibold text-gray-900">{selectedUser.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="font-semibold text-gray-900">{selectedUser.phoneNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Community</p>
                      <p className="font-semibold text-gray-900">{selectedUser.community || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Block / Flat</p>
                      <p className="font-semibold text-gray-900">
                        {selectedUser.block || 'N/A'} {selectedUser.flatNumber ? `- ${selectedUser.flatNumber}` : ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Created At</p>
                      <p className="font-semibold text-gray-900">{selectedUser.createdAt ? formatDateTime(selectedUser.createdAt) : 'N/A'}</p>
                    </div>
                  </div>

                  {selectedUser.paymentFlags && (
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500 mb-2">Payment Summary</p>
                      <div className="grid grid-cols-3 gap-4 text-center text-sm">
                        <div>
                          <p className="text-base font-bold text-green-600">
                            ₹{selectedUser.paymentFlags.totalPaid || 0}
                          </p>
                          <p className="text-xs text-gray-500">Total Paid</p>
                        </div>
                        <div>
                          <p className="text-base font-bold text-amber-600">
                            ₹{selectedUser.paymentFlags.totalDue || 0}
                          </p>
                          <p className="text-xs text-gray-500">Total Due</p>
                        </div>
                        <div>
                          <p className="text-base font-bold text-red-600">
                            {selectedUser.paymentFlags.overdueCount || 0}
                          </p>
                          <p className="text-xs text-gray-500">Overdue</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* List Vehicles (Read Only) */}
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Vehicles ({selectedUser.vehicles?.length || 0})</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {selectedUser.vehicles?.map((vehicle, idx) => (
                        <div key={idx} className="p-3 border border-gray-100 rounded-xl bg-gray-50 text-xs">
                          <p className="font-semibold text-gray-900">{vehicle.registrationNumber}</p>
                          <p className="text-gray-500">{vehicle.make} {vehicle.model} ({vehicle.type})</p>
                          {vehicle.parkingSlot && <p className="text-gray-400 mt-1">Slot: {vehicle.parkingSlot}</p>}
                        </div>
                      ))}
                      {(!selectedUser.vehicles || selectedUser.vehicles.length === 0) && (
                        <p className="text-xs text-gray-400 py-2">No vehicles registered</p>
                      )}
                    </div>
                  </div>

                  {/* Account Restriction section */}
                  <div className="border-t border-gray-100 pt-4">
                    {selectedUser.paymentFlags?.accountRestricted ? (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
                        <div className="flex items-center gap-2 text-red-800 font-semibold text-sm">
                          <Ban className="w-5 h-5 text-red-600" />
                          Account Restricted
                        </div>
                        <p className="text-xs text-gray-600 italic">Reason: {selectedUser.paymentFlags.restrictedReason}</p>
                        <button
                          type="button"
                          onClick={() => handleUnrestrict(selectedUser.id)}
                          disabled={processing === selectedUser.id}
                          className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition"
                        >
                          Unrestrict Account
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Restrict Account</p>
                        <textarea
                          value={restrictReason}
                          onChange={(e) => setRestrictReason(e.target.value)}
                          className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                          rows={2}
                          placeholder="Reason for restriction..."
                        />
                        <button
                          type="button"
                          onClick={() => handleRestrict(selectedUser.id)}
                          disabled={processing === selectedUser.id || !restrictReason.trim()}
                          className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                        >
                          Restrict Account
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // Edit Mode
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Phone Number</label>
                      <input
                        type="text"
                        required
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Community</label>
                      <select
                        value={formData.community}
                        onChange={(e) => setFormData({ ...formData, community: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                      >
                        <option value="">Choose Community...</option>
                        {communities.map((c) => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Block</label>
                      <input
                        type="text"
                        value={formData.block}
                        onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Flat Number</label>
                      <input
                        type="text"
                        value={formData.flatNumber}
                        onChange={(e) => setFormData({ ...formData, flatNumber: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Nested Vehicles Form */}
                  <div className="border-t border-gray-100 pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Vehicles ({userVehicles.length})</h4>
                      {!isAddingVehicle && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingVehicleIndex(null);
                            setVehicleData({
                              registrationNumber: '',
                              type: '4 Wheeler',
                              make: '',
                              model: '',
                              fuelType: '',
                              parkingSlot: '',
                            });
                            setIsAddingVehicle(true);
                          }}
                          className="text-xs text-green-600 hover:text-green-700 font-semibold flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Vehicle
                        </button>
                      )}
                    </div>

                    {isAddingVehicle && (
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                        <h5 className="text-xs font-bold text-gray-700 flex items-center gap-1">
                          {editingVehicleIndex !== null ? (
                            <>
                              <Lock className="w-3 h-3 text-gray-400" /> Editing Vehicle Number cannot be changed
                            </>
                          ) : (
                            'New Vehicle'
                          )}
                        </h5>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Registration Number</label>
                            <input
                              type="text"
                              value={vehicleData.registrationNumber}
                              disabled={editingVehicleIndex !== null}
                              onChange={(e) => setVehicleData({ ...vehicleData, registrationNumber: e.target.value })}
                              className="w-full p-2 border border-gray-200 rounded-lg text-xs outline-none uppercase disabled:bg-gray-100 disabled:text-gray-400"
                              placeholder="e.g. MH12AB1234"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Type</label>
                            <select
                              value={vehicleData.type}
                              disabled={editingVehicleIndex !== null}
                              onChange={(e) => setVehicleData({ ...vehicleData, type: e.target.value as Vehicle['type'] })}
                              className="w-full p-2 border border-gray-200 rounded-lg text-xs outline-none disabled:bg-gray-100"
                            >
                              <option value="4 Wheeler">4 Wheeler</option>
                              <option value="2 Wheeler">2 Wheeler</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Make</label>
                            <input
                              type="text"
                              value={vehicleData.make}
                              onChange={(e) => setVehicleData({ ...vehicleData, make: e.target.value })}
                              className="w-full p-2 border border-gray-200 rounded-lg text-xs outline-none"
                              placeholder="e.g. Maruti Suzuki"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Model</label>
                            <input
                              type="text"
                              value={vehicleData.model}
                              onChange={(e) => setVehicleData({ ...vehicleData, model: e.target.value })}
                              className="w-full p-2 border border-gray-200 rounded-lg text-xs outline-none"
                              placeholder="e.g. Swift"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Fuel Type</label>
                            <input
                              type="text"
                              value={vehicleData.fuelType}
                              onChange={(e) => setVehicleData({ ...vehicleData, fuelType: e.target.value })}
                              className="w-full p-2 border border-gray-200 rounded-lg text-xs outline-none"
                              placeholder="e.g. Petrol / EV"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Parking Slot</label>
                            <input
                              type="text"
                              value={vehicleData.parkingSlot}
                              onChange={(e) => setVehicleData({ ...vehicleData, parkingSlot: e.target.value })}
                              className="w-full p-2 border border-gray-200 rounded-lg text-xs outline-none"
                              placeholder="e.g. B-102"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                          <button
                            type="button"
                            onClick={() => setIsAddingVehicle(false)}
                            className="px-3 py-1 bg-white text-gray-600 rounded-lg text-xs border border-gray-200 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveVehicle}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    )}

                    {/* List Vehicles */}
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {userVehicles.map((vehicle, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-gray-50 text-xs">
                          <div>
                            <p className="font-semibold text-gray-900">{vehicle.registrationNumber}</p>
                            <p className="text-gray-500">{vehicle.make} {vehicle.model} ({vehicle.type})</p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => startEditVehicle(idx)}
                              className="p-1 text-gray-500 hover:text-amber-600 hover:bg-white rounded transition"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteVehicle(idx)}
                              className="p-1 text-gray-500 hover:text-red-600 hover:bg-white rounded transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {userVehicles.length === 0 && !isAddingVehicle && (
                        <p className="text-center text-xs text-gray-400 py-4">No vehicles added yet</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
              {!isEditMode ? (
                // View Mode actions
                <>
                  <button
                    type="button"
                    onClick={() => startEditMode()}
                    className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition text-sm font-medium flex items-center gap-1.5"
                  >
                    <Edit2 className="w-4 h-4" /> Edit User
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteUser(selectedUser.id, selectedUser.name)}
                    disabled={processing === selectedUser.id}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" /> Delete User
                  </button>
                </>
              ) : (
                // Edit Mode actions
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditMode(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processing === selectedUser.id}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 text-sm font-medium"
                  >
                    {processing === selectedUser.id && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save Changes
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
