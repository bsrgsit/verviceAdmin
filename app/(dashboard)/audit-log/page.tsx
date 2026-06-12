'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  Loader2,
  History,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  LogIn,
  Info,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface AuditEntry {
  id: string;
  adminEmail: string;
  action: string;
  targetId: string;
  targetType: string;
  details: string;
  timestamp: number;
}

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
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
  }, [debouncedSearch, actionFilter]);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit-log');
      const data = await res.json();
      setEntries(data);
    } catch (error) {
      console.error('Failed to fetch audit log:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    const act = action.toLowerCase();
    
    // Login / Session
    if (act.includes('login')) {
      return <LogIn className="w-4 h-4 text-green-500" />;
    }
    
    // Deletions / Cancellations / Rejections / Restrictions
    if (
      act.includes('delete') || 
      act.includes('remove') || 
      act.includes('reject') || 
      act.includes('suspend') || 
      act.includes('restrict') || 
      act.includes('cancel')
    ) {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
    
    // Creations / Plus / Additions
    if (act.includes('create') || act.includes('add') || act.includes('new')) {
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    }
    
    // Updates / Edits / Verifications / Activations
    if (
      act.includes('update') || 
      act.includes('edit') || 
      act.includes('verify') || 
      act.includes('reactivate') || 
      act.includes('unrestrict')
    ) {
      return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
    }
    
    // Fallback info icon (neutral gray)
    return <Info className="w-4 h-4 text-gray-500" />;
  };

  const filteredEntries = entries.filter((e) => {
    if (actionFilter !== 'all' && !e.action.includes(actionFilter)) return false;
    if (debouncedSearch) {
      const s = debouncedSearch.toLowerCase();
      return (
        e.adminEmail.toLowerCase().includes(s) ||
        e.details.toLowerCase().includes(s) ||
        e.targetId.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
  const paginatedEntries = filteredEntries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-gray-500">{entries.length} total entries</p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
          <Filter className="w-4 h-4 text-gray-400" />
          {['all', 'verified', 'rejected', 'suspended', 'login', 'restricted'].map((a) => (
            <button
              key={a}
              onClick={() => setActionFilter(a)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                actionFilter === a
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {a.charAt(0).toUpperCase() + a.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by admin, action, or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="p-4 flex items-start gap-4">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg flex-shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/12"></div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mt-1"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-16 flex-shrink-0"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No audit entries found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {paginatedEntries.map((entry) => (
              <div key={entry.id} className="p-4 flex items-start gap-4 hover:bg-gray-50 transition">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {getActionIcon(entry.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900 text-sm">{entry.adminEmail}</span>
                    <span className="text-sm text-gray-600">{entry.action}</span>
                    <span className="text-xs text-gray-400">
                      {entry.targetType}: {entry.targetId ? (entry.targetId.length > 12 ? `${entry.targetId.slice(0, 12)}...` : entry.targetId) : 'N/A'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{entry.details}</p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {formatDateTime(entry.timestamp)}
                </span>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-white border-t border-gray-200 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Showing {Math.min(filteredEntries.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(filteredEntries.length, currentPage * itemsPerPage)} of {filteredEntries.length} entries
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
    </div>
  );
}
