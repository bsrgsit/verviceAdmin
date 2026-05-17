'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  FileText,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  Clock,
  ArrowRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { formatCurrency, timeAgo } from '@/lib/utils';

interface DashboardStats {
  totalUsers: number;
  activeBookings: number;
  pendingPayments: number;
  overdueBookings: number;
  monthlyRevenue: number;
}

interface AuditEntry {
  id: string;
  adminEmail: string;
  action: string;
  targetId: string;
  targetType: string;
  details: string;
  timestamp: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<AuditEntry[]>([]);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/stats').then((r) => r.json()),
      fetch('/api/dashboard/activity').then((r) => r.json()),
      fetch('/api/dashboard/pending').then((r) => r.json()),
    ])
      .then(([statsData, activityData, pendingData]) => {
        setStats(statsData);
        setRecentActivity(activityData);
        setPendingPayments(pendingData);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'bg-blue-500',
      href: '/users',
    },
    {
      label: 'Active Bookings',
      value: stats?.activeBookings || 0,
      icon: FileText,
      color: 'bg-green-500',
      href: '/bookings',
    },
    {
      label: 'Pending Payments',
      value: stats?.pendingPayments || 0,
      icon: Clock,
      color: 'bg-amber-500',
      href: '/payments',
    },
    {
      label: 'Overdue Bookings',
      value: stats?.overdueBookings || 0,
      icon: AlertTriangle,
      color: 'bg-red-500',
      href: '/bookings',
    },
    {
      label: 'Monthly Revenue',
      value: formatCurrency(stats?.monthlyRevenue || 0),
      icon: TrendingUp,
      color: 'bg-purple-500',
      href: '/payments',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-500">{card.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Payments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Pending Payments</h3>
            <Link href="/payments" className="text-sm text-green-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="p-5">
            {pendingPayments.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                No pending payments
              </p>
            ) : (
              <div className="space-y-3">
                {pendingPayments.slice(0, 5).map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {payment.userName || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">{payment.upiAppName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(payment.amount)}
                      </p>
                      <p className="text-xs text-gray-500">{timeAgo(payment.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Recent Activity</h3>
            <Link href="/audit-log" className="text-sm text-green-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="p-5">
            {recentActivity.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                No recent activity
              </p>
            ) : (
              <div className="space-y-3">
                {recentActivity.slice(0, 5).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    {entry.action.includes('verified') || entry.action === 'login' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{entry.adminEmail}</span>{' '}
                        {entry.action}
                      </p>
                      <p className="text-xs text-gray-500">{entry.details}</p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {timeAgo(entry.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
