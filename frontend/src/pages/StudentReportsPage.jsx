import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  Clock,
  Filter,
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowRight,
  Layers,
  Wrench,
  Droplets,
  Zap,
  Sparkles,
  HelpCircle,
  FileText,
} from 'lucide-react';
import reportService from '../services/reportService';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import Alert from '../components/common/Alert';
import { formatDate } from '../utils/formatters';

const STATUS_FILTERS = [
  { key: '', label: 'All Reports' },
  { key: 'PENDING', label: 'Pending', variant: 'warning' },
  { key: 'IN_PROGRESS', label: 'In Progress', variant: 'primary' },
  { key: 'RESOLVED', label: 'Resolved', variant: 'success' },
  { key: 'REJECTED', label: 'Rejected', variant: 'danger' },
];

const ISSUE_TYPE_META = {
  MAINTENANCE: { label: 'General Maintenance', icon: Wrench, color: 'text-amber-600 bg-amber-50' },
  CLEANLINESS: { label: 'Cleanliness & Sanitation', icon: Sparkles, color: 'text-emerald-600 bg-emerald-50' },
  WATER: { label: 'Water & Plumbing', icon: Droplets, color: 'text-blue-600 bg-blue-50' },
  ELECTRICAL: { label: 'Electrical & Lighting', icon: Zap, color: 'text-purple-600 bg-purple-50' },
  EQUIPMENT: { label: 'Equipment & Hardware', icon: Layers, color: 'text-indigo-600 bg-indigo-50' },
  OTHER: { label: 'Other Concern', icon: HelpCircle, color: 'text-slate-600 bg-slate-50' },
};

const STATUS_BADGE_META = {
  PENDING: { label: 'Pending Review', variant: 'warning' },
  IN_PROGRESS: { label: 'In Progress', variant: 'primary' },
  RESOLVED: { label: 'Resolved', variant: 'success' },
  REJECTED: { label: 'Rejected', variant: 'danger' },
};

const PAGE_SIZE = 6;

export default function StudentReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state
  const statusFilter = searchParams.get('status') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const searchKeyword = searchParams.get('search') || '';

  // Local state
  const [searchInput, setSearchInput] = useState(searchKeyword);
  const [prevSearchKeyword, setPrevSearchKeyword] = useState(searchKeyword);
  const [reports, setReports] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync search input with URL search param during render (React recommended pattern)
  if (prevSearchKeyword !== searchKeyword) {
    setPrevSearchKeyword(searchKeyword);
    setSearchInput(searchKeyword);
  }

  // Update query params helper
  const updateQuery = useCallback(
    (newParams) => {
      setIsLoading(true);
      const updated = new URLSearchParams(searchParams);
      Object.entries(newParams).forEach(([key, val]) => {
        if (val === null || val === undefined || val === '') {
          updated.delete(key);
        } else {
          updated.set(key, String(val));
        }
      });
      setSearchParams(updated);
    },
    [searchParams, setSearchParams]
  );

  // Fetch reports from API
  useEffect(() => {
    let isMounted = true;

    const params = {
      page: currentPage,
      page_size: PAGE_SIZE,
    };
    if (statusFilter) params.status = statusFilter;
    if (searchKeyword.trim()) params.search = searchKeyword.trim();

    reportService
      .getReports(params)
      .then((data) => {
        if (!isMounted) return;
        setReports(data.results || []);
        setTotalCount(data.count || 0);
        setError(null);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to fetch reports:', err);
        setError(
          err.response?.data?.detail ||
            'Unable to load your issue reports. Please check your connectivity and try again.'
        );
        setReports([]);
        setTotalCount(0);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentPage, statusFilter, searchKeyword]);

  // Filter handlers
  const handleStatusChange = (status) => {
    updateQuery({ status, page: 1 });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateQuery({ search: searchInput.trim(), page: 1 });
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  // Status summary count indicators
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter) count++;
    if (searchKeyword) count++;
    return count;
  }, [statusFilter, searchKeyword]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-left w-full">
      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Campus Issue Tracker</span>
            </span>
            <span className="text-xs text-slate-400">Student Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Reported Issues
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
            Track real-time status updates, review past maintenance tickets, and monitor resolution progress for issues you submitted.
          </p>
        </div>

        <Link
          to="/reports/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Report New Issue</span>
        </Link>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert
          type="error"
          title="Error Loading Reports"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by issue title or facility..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
            <Button type="submit" variant="secondary" size="sm">
              Search
            </Button>
          </form>

          {/* Reset Filters Action */}
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              icon={RotateCcw}
              className="text-xs text-slate-500 shrink-0 self-start md:self-auto"
            >
              Reset Filters ({activeFiltersCount})
            </Button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-2">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </span>

          {STATUS_FILTERS.map((f) => {
            const isSelected = statusFilter === f.key;
            return (
              <button
                key={f.key || 'ALL'}
                type="button"
                onClick={() => handleStatusChange(f.key)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Reports Content */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 flex flex-col items-center justify-center space-y-3">
          <Spinner size="lg" />
          <p className="text-sm font-medium text-slate-500">Loading your reported issues...</p>
        </div>
      ) : reports.length > 0 ? (
        <div className="space-y-4">
          {/* Results Summary */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Showing <strong className="text-slate-800">{(currentPage - 1) * PAGE_SIZE + 1}</strong> to{' '}
              <strong className="text-slate-800">{Math.min(currentPage * PAGE_SIZE, totalCount)}</strong> of{' '}
              <strong className="text-slate-800">{totalCount}</strong> reports
            </span>
            {statusFilter && (
              <span className="font-medium text-indigo-600">
                Filtered by: {STATUS_BADGE_META[statusFilter]?.label || statusFilter}
              </span>
            )}
          </div>

          {/* Report Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map((report) => {
              const statusMeta = STATUS_BADGE_META[report.status] || {
                label: report.status,
                variant: 'default',
              };
              const typeMeta = ISSUE_TYPE_META[report.issue_type] || {
                label: report.issue_type,
                icon: HelpCircle,
                color: 'text-slate-600 bg-slate-50',
              };
              const TypeIcon = typeMeta.icon;

              return (
                <div
                  key={report.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Top Badges Row */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          #{report.id}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${typeMeta.color}`}
                        >
                          <TypeIcon className="w-3 h-3" />
                          <span>{typeMeta.label}</span>
                        </span>
                      </div>

                      <Badge variant={statusMeta.variant} size="xs">
                        {statusMeta.label}
                      </Badge>
                    </div>

                    {/* Report Title */}
                    <div>
                      <Link
                        to={`/reports/${report.id}`}
                        className="text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-1"
                      >
                        {report.title}
                      </Link>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        {report.description}
                      </p>
                    </div>
                  </div>

                  {/* Metadata and Footer */}
                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-slate-500 gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <Link
                          to={`/facilities/${report.facility?.id}`}
                          className="font-medium text-slate-700 hover:text-indigo-600 transition-colors truncate"
                        >
                          {report.facility?.name} ({report.facility?.building})
                        </Link>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(report.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-1">
                      <Link
                        to={`/reports/${report.id}`}
                        className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors gap-1"
                      >
                        <span>View Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => updateQuery({ page: currentPage - 1 })}
                icon={ChevronLeft}
              >
                Previous
              </Button>

              <span className="text-xs font-semibold text-slate-700 px-3">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => updateQuery({ page: currentPage + 1 })}
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      ) : activeFiltersCount > 0 ? (
        /* Filter Empty State */
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <Filter className="w-12 h-12 text-slate-300 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">No Reports Match Your Criteria</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are no issue reports matching the selected status or search keywords.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleResetFilters} icon={RotateCcw}>
            Clear All Filters
          </Button>
        </div>
      ) : (
        /* Global Empty State */
        <div className="p-12 sm:p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto">
            <FileText className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-900">No Reports Submitted Yet</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              You haven&apos;t filed any facility issue reports. Notice broken equipment, lighting failures, or cleanliness issues? Submit a report to notify campus operations.
            </p>
          </div>
          <Link
            to="/reports/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Report an Issue</span>
          </Link>
        </div>
      )}
    </div>
  );
}
