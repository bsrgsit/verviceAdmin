import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toLowerCase().replace(/_/g, ' ');
  
  let classes = 'bg-slate-100 text-slate-700';
  
  if (
    normalized === 'success' ||
    normalized === 'verified' ||
    normalized === 'paid' ||
    normalized === 'active' ||
    normalized === 'approved' ||
    normalized === 'completed'
  ) {
    classes = 'bg-emerald-50 text-emerald-700 border border-emerald-200/50';
  } else if (
    normalized === 'pending' ||
    normalized === 'pending manual verify' ||
    normalized === 'pending verification' ||
    normalized === 'submitted' ||
    normalized === 'in progress' ||
    normalized === 'open'
  ) {
    classes = 'bg-amber-50 text-amber-700 border border-amber-200/50';
  } else if (
    normalized === 'failure' ||
    normalized === 'failed' ||
    normalized === 'overdue' ||
    normalized === 'cancelled' ||
    normalized === 'rejected' ||
    normalized === 'restricted'
  ) {
    classes = 'bg-rose-50 text-rose-700 border border-rose-200/50';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${classes}`}>
      {normalized}
    </span>
  );
}
