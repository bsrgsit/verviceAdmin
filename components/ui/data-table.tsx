import React from 'react';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

interface FilterOption {
  label: string;
  value: string;
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
}

interface DataTableProps {
  children: React.ReactNode;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  filterValue?: string;
  onFilterChange?: (val: any) => void;
  filterOptions?: FilterOption[];
  pagination?: PaginationProps;
  extraFilters?: React.ReactNode;
}

export default function DataTable({
  children,
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
  filterValue,
  onFilterChange,
  filterOptions,
  pagination,
  extraFilters,
}: DataTableProps) {
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-premium overflow-hidden">
      {/* Search & Filter Bar */}
      {(onSearchChange || onFilterChange || extraFilters) && (
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex-1 w-full sm:max-w-xs relative">
            {onSearchChange && (
              <>
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchValue || ''}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
              </>
            )}
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {extraFilters}
            {onFilterChange && filterOptions && (
              <div className="relative flex items-center">
                <Filter className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <select
                  value={filterValue}
                  onChange={(e) => onFilterChange(e.target.value)}
                  className="pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all appearance-none cursor-pointer"
                >
                  {filterOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table Frame */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          {children}
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && pagination.totalPages > 1 && (
        <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            {pagination.totalItems !== undefined && pagination.itemsPerPage !== undefined ? (
              <>
                Showing{' '}
                <span className="font-semibold text-slate-900">
                  {Math.min((pagination.currentPage - 1) * pagination.itemsPerPage + 1, pagination.totalItems)}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-slate-900">
                  {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-900">{pagination.totalItems}</span> entries
              </>
            ) : (
              `Page ${pagination.currentPage} of ${pagination.totalPages}`
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(p => Math.abs(p - pagination.currentPage) <= 1 || p === 1 || p === pagination.totalPages)
              .map((p, idx, arr) => (
                <React.Fragment key={p}>
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span className="px-1.5 text-slate-400 text-xs">...</span>
                  )}
                  <button
                    onClick={() => pagination.onPageChange(p)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      pagination.currentPage === p
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {p}
                  </button>
                </React.Fragment>
              ))}
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
