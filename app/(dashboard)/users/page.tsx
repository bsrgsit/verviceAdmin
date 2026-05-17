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
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  community: string;
  block: string;
  flatNumber: string;
  vehicles: any[];
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
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [restrictReason, setRestrictReason] = useState('');

  useEffect(() => {
    fetchUsers();
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
    } finally {
      setProcessing(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(s) ||
      u.phoneNumber?.includes(search) ||
      u.community?.toLowerCase().includes(s) ||
      u.email?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500">{users.length} total users</p>
        </div>
      </div>

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

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-green-500" />
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
                      <span className="text-sm text-gray-700">{user.community}</span>
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
                          onClick={() => {
                            setSelectedUser(user);
                            setRestrictReason(user.paymentFlags?.restrictedReason || '');
                          }}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {user.paymentFlags?.accountRestricted ? (
                          <button
                            onClick={() => handleUnrestrict(user.id)}
                            disabled={processing === user.id}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition disabled:opacity-50"
                            title="Unrestrict"
                          >
                            {processing === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setRestrictReason('');
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Restrict account"
                          >
                            <Ban className="w-4 h-4" />
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

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">User Details</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="font-medium text-gray-900">{selectedUser.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900">{selectedUser.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Community</p>
                  <p className="font-medium text-gray-900">{selectedUser.community}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Block / Flat</p>
                  <p className="font-medium text-gray-900">
                    {selectedUser.block} - {selectedUser.flatNumber}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Vehicles</p>
                  <p className="font-medium text-gray-900">{selectedUser.vehicles?.length || 0}</p>
                </div>
              </div>

              {selectedUser.paymentFlags && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-2">Payment Summary</p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-lg font-bold text-green-600">
                        ₹{selectedUser.paymentFlags.totalPaid || 0}
                      </p>
                      <p className="text-xs text-gray-500">Total Paid</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-amber-600">
                        ₹{selectedUser.paymentFlags.totalDue || 0}
                      </p>
                      <p className="text-xs text-gray-500">Total Due</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-red-600">
                        {selectedUser.paymentFlags.overdueCount || 0}
                      </p>
                      <p className="text-xs text-gray-500">Overdue</p>
                    </div>
                  </div>
                </div>
              )}

              {!selectedUser.paymentFlags?.accountRestricted && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Restrict Account</p>
                  <textarea
                    value={restrictReason}
                    onChange={(e) => setRestrictReason(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    rows={2}
                    placeholder="Reason for restriction..."
                  />
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              {!selectedUser.paymentFlags?.accountRestricted && (
                <button
                  onClick={() => handleRestrict(selectedUser.id)}
                  disabled={processing === selectedUser.id}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                  {processing === selectedUser.id ? 'Restricting...' : 'Restrict Account'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
