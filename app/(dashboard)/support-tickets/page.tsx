'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  Loader2,
  Trash2,
  AlertTriangle,
  Eye,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userEmail: string;
  issueType: string;
  description: string;
  status: string;
  createdAt: number;
  community: string;
  resolutionNotes?: string;
  updatedAt?: number;
}

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [communityFilter, setCommunityFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Modal State
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  // Edit form state
  const [editStatus, setEditStatus] = useState('');
  const [editResolutionNotes, setEditResolutionNotes] = useState('');

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
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/support-tickets');
      const data = await res.json();
      if (Array.isArray(data)) setTickets(data);
    } catch (error) {
      console.error('Failed to fetch support tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedTicket) return;
    setProcessing(selectedTicket.id);
    try {
      const res = await fetch(`/api/support-tickets/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editStatus,
          resolutionNotes: editResolutionNotes,
        }),
      });

      if (res.ok) {
        setSelectedTicket(null);
        await fetchTickets();
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

  const handleDeleteTicket = async (id: string) => {
    if (!confirm('Are you sure you want to delete this support ticket?')) return;
    setProcessing(id);
    try {
      const res = await fetch(`/api/support-tickets/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSelectedTicket(null);
        await fetchTickets();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete ticket');
      }
    } catch (error) {
      console.error('Failed to delete ticket:', error);
    } finally {
      setProcessing(null);
    }
  };

  const openDetailsModal = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setEditStatus(ticket.status);
    setEditResolutionNotes(ticket.resolutionNotes || '');
  };

  const uniqueCommunities = Array.from(new Set(tickets.map((t) => t.community).filter(Boolean)));

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (communityFilter !== 'all' && t.community !== communityFilter) return false;
    if (debouncedSearch) {
      const s = debouncedSearch.toLowerCase();
      return (
        t.userName?.toLowerCase().includes(s) ||
        t.userPhone?.toLowerCase().includes(s) ||
        t.issueType?.toLowerCase().includes(s) ||
        t.description?.toLowerCase().includes(s) ||
        t.community?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const paginatedTickets = filteredTickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      open: 'bg-red-100 text-red-700',
      in_progress: 'bg-amber-100 text-amber-700',
      resolved: 'bg-green-100 text-green-700',
      closed: 'bg-gray-100 text-gray-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
          <HelpCircle className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-500">{tickets.length} total support tickets</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
          <span className="text-xs text-gray-500 px-2">Status:</span>
          {['all', 'open', 'in_progress', 'resolved', 'closed'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                statusFilter === s
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
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
            placeholder="Search by customer, issue type, description..."
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
      ) : filteredTickets.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No support tickets found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Community</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Issue Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 text-sm">{ticket.userName}</p>
                      <p className="text-xs text-gray-500">{ticket.userPhone}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {ticket.community}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-semibold">
                      <span className="px-2 py-0.5 bg-gray-100 border rounded text-xs text-gray-700">{ticket.issueType}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={ticket.description}>
                      {ticket.description}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full capitalize ${getStatusBadge(ticket.status)}`}>
                        {ticket.status === 'in_progress' ? 'In Progress' : ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {formatDateTime(ticket.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDetailsModal(ticket)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTicket(ticket.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-lg transition"
                          title="Delete Ticket"
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
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(filteredTickets.length, currentPage * itemsPerPage)} of {filteredTickets.length} entries
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
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Manage Support Ticket</h3>
              <button onClick={() => setSelectedTicket(null)} className="text-gray-400 hover:text-gray-500 font-medium">Close</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl text-sm border border-gray-100">
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase">Customer</p>
                  <p className="font-semibold text-gray-900">{selectedTicket.userName}</p>
                  <p className="text-xs text-gray-500">{selectedTicket.userPhone}</p>
                  <p className="text-xs text-gray-400">{selectedTicket.userEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase">Community</p>
                  <p className="font-bold text-green-700">{selectedTicket.community}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase">Issue Category</p>
                  <p className="font-semibold text-gray-900">{selectedTicket.issueType}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase">Created On</p>
                  <p className="text-gray-950 font-medium">{formatDateTime(selectedTicket.createdAt)}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Issue Description</p>
                <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-800 border border-gray-100 whitespace-pre-wrap">
                  {selectedTicket.description}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Ticket Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Admin Resolution / Chat Notes</label>
                <textarea
                  value={editResolutionNotes}
                  onChange={(e) => setEditResolutionNotes(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  rows={4}
                  placeholder="Resolution details or internal notes about ticket progress..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-between">
              <button
                type="button"
                onClick={() => handleDeleteTicket(selectedTicket.id)}
                className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg font-medium text-sm transition"
              >
                Delete Ticket
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={processing === selectedTicket.id}
                  onClick={handleSaveChanges}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition flex items-center gap-1.5"
                >
                  {processing === selectedTicket.id && <Loader2 className="w-4 h-4 animate-spin" />}
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
