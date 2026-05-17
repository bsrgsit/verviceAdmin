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
  const [actionFilter, setActionFilter] = useState('all');

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
    if (action.includes('verified') || action.includes('login')) return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    if (action.includes('rejected') || action.includes('suspended') || action.includes('restricted')) return <XCircle className="w-4 h-4 text-red-500" />;
    if (action.includes('reactivated') || action.includes('unrestricted')) return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
    return <AlertTriangle className="w-4 h-4 text-amber-500" />;
  };

  const filteredEntries = entries.filter((e) => {
    if (actionFilter !== 'all' && !e.action.includes(actionFilter)) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        e.adminEmail.toLowerCase().includes(s) ||
        e.details.toLowerCase().includes(s) ||
        e.targetId.toLowerCase().includes(s)
      );
    }
    return true;
  });

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
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No audit entries found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="divide-y divide-gray-100">
            {filteredEntries.map((entry) => (
              <div key={entry.id} className="p-4 flex items-start gap-4 hover:bg-gray-50 transition">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {getActionIcon(entry.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900 text-sm">{entry.adminEmail}</span>
                    <span className="text-sm text-gray-600">{entry.action}</span>
                    <span className="text-xs text-gray-400">
                      {entry.targetType}: {entry.targetId.slice(0, 12)}...
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
        </div>
      )}
    </div>
  );
}
