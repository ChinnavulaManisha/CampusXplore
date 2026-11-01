import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  Filter,
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Trash2,
  CheckCircle2,
  User,
  RefreshCw,
  X,
  Layers,
  Wrench,
  Droplets,
  Zap,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import reportService from '../../services/reportService';
import facilityService from '../../services/facilityService';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import Alert from '../common/Alert';
import { formatDate } from '../../utils/formatters';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending Review' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'REJECTED', label: 'Rejected' },
];

const ISSUE_TYPE_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'MAINTENANCE', label: 'General Maintenance' },
  { value: 'CLEANLINESS', label: 'Cleanliness & Sanitation' },
  { value: 'WATER', label: 'Water & Plumbing' },
  { value: 'ELECTRICAL', label: 'Electrical & Lighting' },
  { value: 'EQUIPMENT', label: 'Equipment & Hardware' },
  { value: 'OTHER', label: 'Other Concern' },
];

const ISSUE_TYPE_META = {
  MAINTENANCE: { label: 'Maintenance', icon: Wrench, color: 'text-amber-700 bg-amber-50 border-amber-200' },
  CLEANLINESS: { label: 'Cleanliness', icon: Sparkles, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  WATER: { label: 'Water', icon: Droplets, color: 'text-blue-700 bg-blue-50 border-blue-200' },
  ELECTRICAL: { label: 'Electrical', icon: Zap, color: 'text-purple-700 bg-purple-50 border-purple-200' },
  EQUIPMENT: { label: 'Equipment', icon: Layers, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  OTHER: { label: 'Other', icon: HelpCircle, color: 'text-slate-700 bg-slate-50 border-slate-200' },
};

const STATUS_BADGE_META = {
  PENDING: { label: 'Pending Review', variant: 'warning' },
  IN_PROGRESS: { label: 'In Progress', variant: 'primary' },
  RESOLVED: { label: 'Resolved', variant: 'success' },
  REJECTED: { label: 'Rejected', variant: 'danger' },
};

// Valid transitions enforced by backend state machine
const VALID_TRANSITIONS = {
  PENDING: [
    { key: 'IN_PROGRESS', label: 'Set In Progress', description: 'Dispatch maintenance staff for inspection' },
    { key: 'REJECTED', label: 'Reject Report', description: 'Deem report duplicate or out of scope' },
  ],
  IN_PROGRESS: [
    { key: 'RESOLVED', label: 'Mark Resolved', description: 'Repairs or service verified complete' },
    { key: 'REJECTED', label: 'Reject Report', description: 'Unable to resolve or invalid ticket' },
  ],
  RESOLVED: [],
  REJECTED: [],
};

const PAGE_SIZE = 8;

export default function ReportManagementSection({
  role = 'FACULTY',
  title = 'Campus Issue Reports Management',
  description = 'Inspect submitted campus maintenance and facility reports, review details, and update operational progress.',
}) {
  const canDelete = role === 'ADMIN';

  // Filters State
  const [statusFilter, setStatusFilter] = useState('');
  const [issueTypeFilter, setIssueTypeFilter] = useState('');
  const [facilityFilter, setFacilityFilter] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Data State
  const [reports, setReports] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [facilities, setFacilities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  // Modals State
  const [statusModalReport, setStatusModalReport] = useState(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState('');
  const [deleteModalReport, setDeleteModalReport] = useState(null);

  // Load facilities for filter dropdown on mount
  useEffect(() => {
    let isMounted = true;
    facilityService
      .getAllFacilities({ isActive: true })
      .then((data) => {
        if (!isMounted) return;
        setFacilities(data.facilities || []);
      })
      .catch((err) => {
        console.error('Failed to load facility filter list:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch reports helper
  const fetchReports = useCallback(async () => {
    try {
      const params = {
        page: currentPage,
        page_size: PAGE_SIZE,
      };
      if (statusFilter) params.status = statusFilter;
      if (issueTypeFilter) params.issue_type = issueTypeFilter;
      if (facilityFilter) params.facility = facilityFilter;
      if (searchKeyword.trim()) params.search = searchKeyword.trim();

      const data = await reportService.getReports(params);
      setReports(data.results || []);
      setTotalCount(data.count || 0);
      setApiError(null);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
      setApiError(
        err.response?.data?.detail ||
          'Failed to load campus issue reports. Please check connectivity and try again.'
      );
      setReports([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, statusFilter, issueTypeFilter, facilityFilter, searchKeyword]);

  // Reactive effect on filter / page change
  useEffect(() => {
    let isMounted = true;

    const params = {
      page: currentPage,
      page_size: PAGE_SIZE,
    };
    if (statusFilter) params.status = statusFilter;
    if (issueTypeFilter) params.issue_type = issueTypeFilter;
    if (facilityFilter) params.facility = facilityFilter;
    if (searchKeyword.trim()) params.search = searchKeyword.trim();

    reportService
      .getReports(params)
      .then((data) => {
        if (!isMounted) return;
        setReports(data.results || []);
        setTotalCount(data.count || 0);
        setApiError(null);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to fetch reports:', err);
        setApiError(
          err.response?.data?.detail ||
            'Failed to load campus issue reports. Please check connectivity and try again.'
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
  }, [currentPage, statusFilter, issueTypeFilter, facilityFilter, searchKeyword]);

  // Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchKeyword(searchInput.trim());
    setCurrentPage(1);
  };

  // Reset filters
  const handleResetFilters = () => {
    setStatusFilter('');
    setIssueTypeFilter('');
    setFacilityFilter('');
    setSearchKeyword('');
    setSearchInput('');
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter) count++;
    if (issueTypeFilter) count++;
    if (facilityFilter) count++;
    if (searchKeyword) count++;
    return count;
  }, [statusFilter, issueTypeFilter, facilityFilter, searchKeyword]);

  // Open Status Transition Modal
  const openStatusModal = (report) => {
    const validNext = VALID_TRANSITIONS[report.status] || [];
    if (validNext.length === 0) return;
    setStatusModalReport(report);
    setSelectedNewStatus(validNext[0].key);
    setApiError(null);
  };

  // Execute Status Transition
  const handleConfirmStatusUpdate = async () => {
    if (!statusModalReport || !selectedNewStatus) return;

    setIsUpdating(true);
    setApiError(null);

    try {
      const updated = await reportService.updateReportStatus(
        statusModalReport.id,
        selectedNewStatus
      );

      setFeedbackMessage(
        `Report #${updated.id} successfully updated to ${STATUS_BADGE_META[updated.status]?.label || updated.status}.`
      );
      setStatusModalReport(null);
      // Refresh list
      await fetchReports();
    } catch (err) {
      console.error('Status transition failed:', err);
      const detail =
        err.response?.data?.status?.[0] ||
        err.response?.data?.detail ||
        'Failed to update report status. Invalid transition.';
      setApiError(detail);
    } finally {
      setIsUpdating(false);
    }
  };

  // Execute Delete Report (Admin only)
  const handleConfirmDelete = async () => {
    if (!deleteModalReport || !canDelete) return;

    setIsUpdating(true);
    setApiError(null);

    try {
      await reportService.deleteReport(deleteModalReport.id);
      setFeedbackMessage(`Report #${deleteModalReport.id} has been permanently deleted.`);
      setDeleteModalReport(null);
      // Refresh list
      await fetchReports();
    } catch (err) {
      console.error('Delete report failed:', err);
      setApiError(
        err.response?.data?.detail ||
          'Failed to delete report. Insufficient administrator permissions.'
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 text-left w-full">
      {/* Section Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Campus Issue Operations</span>
            </span>
            <Badge variant={role === 'ADMIN' ? 'admin' : 'faculty'} size="xs">
              {role === 'ADMIN' ? 'Full Authority' : 'Status Management'}
            </Badge>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {title}
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
            {description}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchReports}
            icon={RefreshCw}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {feedbackMessage && (
        <Alert
          type="success"
          title="Operation Successful"
          message={feedbackMessage}
          onClose={() => setFeedbackMessage(null)}
        />
      )}

      {apiError && (
        <Alert
          type="error"
          title="Operation Error"
          message={apiError}
          onClose={() => setApiError(null)}
        />
      )}

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* Search Row */}
        <div className="flex flex-col md:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search report title, description, or facility..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
            <Button type="submit" variant="secondary" size="sm">
              Search
            </Button>
          </form>

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

        {/* Dropdowns Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          {/* Status Filter */}
          <div>
            <label htmlFor="mgmtStatusFilter" className="block text-xs font-semibold text-slate-600 mb-1">
              Status Filter
            </label>
            <select
              id="mgmtStatusFilter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Issue Category Filter */}
          <div>
            <label htmlFor="mgmtCategoryFilter" className="block text-xs font-semibold text-slate-600 mb-1">
              Issue Category
            </label>
            <select
              id="mgmtCategoryFilter"
              value={issueTypeFilter}
              onChange={(e) => {
                setIssueTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              {ISSUE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Facility Filter */}
          <div>
            <label htmlFor="mgmtFacilityFilter" className="block text-xs font-semibold text-slate-600 mb-1">
              Facility Location
            </label>
            <select
              id="mgmtFacilityFilter"
              value={facilityFilter}
              onChange={(e) => {
                setFacilityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="">All Facilities</option>
              {facilities.map((fac) => (
                <option key={fac.id} value={fac.id}>
                  {fac.name} ({fac.building})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Reports Table / Card Content */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 flex flex-col items-center justify-center space-y-3">
          <Spinner size="lg" />
          <p className="text-sm font-medium text-slate-500">Loading campus reports...</p>
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
            <div className="flex items-center gap-2">
              {statusFilter && (
                <Badge variant={STATUS_BADGE_META[statusFilter]?.variant || 'default'} size="xs">
                  {STATUS_BADGE_META[statusFilter]?.label || statusFilter}
                </Badge>
              )}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left">
                <thead className="bg-slate-50/80">
                  <tr>
                    <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">ID</th>
                    <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">Title & Issue</th>
                    <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">Facility</th>
                    <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">Category</th>
                    <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">Reporter</th>
                    <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
                    <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {reports.map((report) => {
                    const statusMeta = STATUS_BADGE_META[report.status] || {
                      label: report.status,
                      variant: 'default',
                    };
                    const typeMeta = ISSUE_TYPE_META[report.issue_type] || {
                      label: report.issue_type,
                      icon: HelpCircle,
                      color: 'text-slate-700 bg-slate-50 border-slate-200',
                    };
                    const validTransitions = VALID_TRANSITIONS[report.status] || [];
                    const isTerminal = validTransitions.length === 0;

                    return (
                      <tr key={report.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* ID */}
                        <td className="px-4 py-4 font-bold text-slate-500">
                          #{report.id}
                        </td>

                        {/* Title & Preview */}
                        <td className="px-4 py-4 max-w-xs">
                          <Link
                            to={`/reports/${report.id}`}
                            className="font-bold text-slate-900 hover:text-indigo-600 transition-colors block line-clamp-1"
                          >
                            {report.title}
                          </Link>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {report.description}
                          </p>
                        </td>

                        {/* Facility */}
                        <td className="px-4 py-4">
                          <Link
                            to={`/facilities/${report.facility?.id}`}
                            className="font-medium text-slate-700 hover:text-indigo-600 transition-colors flex items-center gap-1 truncate max-w-[150px]"
                          >
                            <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span>{report.facility?.name}</span>
                          </Link>
                          <span className="text-[10px] text-slate-400 block">
                            {report.facility?.building}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold ${typeMeta.color}`}
                          >
                            <span>{typeMeta.label}</span>
                          </span>
                        </td>

                        {/* Reporter */}
                        <td className="px-4 py-4">
                          <div className="font-semibold text-slate-900 truncate max-w-[130px]">
                            {report.user?.first_name} {report.user?.last_name}
                          </div>
                          <span className="text-[10px] text-slate-400 truncate max-w-[130px] block">
                            {report.user?.email}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-4 text-slate-500 whitespace-nowrap">
                          {formatDate(report.created_at)}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4">
                          <Badge variant={statusMeta.variant} size="xs">
                            {statusMeta.label}
                          </Badge>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Update Status Button */}
                            {!isTerminal ? (
                              <button
                                type="button"
                                onClick={() => openStatusModal(report)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
                              >
                                Update Status
                              </button>
                            ) : (
                              <span className="text-[10px] font-medium text-slate-400 italic px-2 py-1">
                                Terminal
                              </span>
                            )}

                            {/* View Details Link */}
                            <Link
                              to={`/reports/${report.id}`}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                              title="View Details"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>

                            {/* Delete Button (Admin Only) */}
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => setDeleteModalReport(report)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete Report"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile & Tablet Card View */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-4">
            {reports.map((report) => {
              const statusMeta = STATUS_BADGE_META[report.status] || {
                label: report.status,
                variant: 'default',
              };
              const typeMeta = ISSUE_TYPE_META[report.issue_type] || {
                label: report.issue_type,
                icon: HelpCircle,
                color: 'text-slate-700 bg-slate-50 border-slate-200',
              };
              const validTransitions = VALID_TRANSITIONS[report.status] || [];
              const isTerminal = validTransitions.length === 0;

              return (
                <div
                  key={report.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          #{report.id}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${typeMeta.color}`}
                        >
                          <span>{typeMeta.label}</span>
                        </span>
                      </div>
                      <Badge variant={statusMeta.variant} size="xs">
                        {statusMeta.label}
                      </Badge>
                    </div>

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

                    <div className="text-xs text-slate-500 space-y-1 pt-1">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="font-medium text-slate-700">
                          {report.facility?.name} ({report.facility?.building})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                        <User className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {report.user?.first_name} {report.user?.last_name} ({report.user?.email})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[11px] text-slate-400">
                      {formatDate(report.created_at)}
                    </span>

                    <div className="flex items-center gap-2">
                      {!isTerminal && (
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => openStatusModal(report)}
                        >
                          Update Status
                        </Button>
                      )}

                      <Link
                        to={`/reports/${report.id}`}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 p-1"
                      >
                        Details
                      </Link>

                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => setDeleteModalReport(report)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
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
                disabled={currentPage <= 1 || isLoading}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                disabled={currentPage >= totalPages || isLoading}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      ) : activeFiltersCount > 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <Filter className="w-12 h-12 text-slate-300 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">No Reports Match Criteria</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try broadening status, category, or facility selections.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleResetFilters} icon={RotateCcw}>
            Clear All Filters
          </Button>
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Campus Reports Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            There are currently no active campus issue reports registered in the operations database.
          </p>
        </div>
      )}

      {/* =================================================================== */}
      {/* STATUS UPDATE MODAL                                                 */}
      {/* =================================================================== */}
      {statusModalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Update Report Status #{statusModalReport.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setStatusModalReport(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-xs font-semibold text-slate-500">Report Title:</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{statusModalReport.title}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-500">Current Status:</span>
                <Badge
                  variant={STATUS_BADGE_META[statusModalReport.status]?.variant || 'default'}
                  size="sm"
                >
                  {STATUS_BADGE_META[statusModalReport.status]?.label || statusModalReport.status}
                </Badge>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Valid Next Status
                </label>
                <div className="space-y-2">
                  {(VALID_TRANSITIONS[statusModalReport.status] || []).map((trans) => {
                    const isSelected = selectedNewStatus === trans.key;
                    return (
                      <button
                        key={trans.key}
                        type="button"
                        onClick={() => setSelectedNewStatus(trans.key)}
                        className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                          isSelected
                            ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-500/20'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-600'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-slate-900 block">
                            {STATUS_BADGE_META[trans.key]?.label || trans.key}
                          </span>
                          <span className="text-[11px] text-slate-500 leading-tight block">
                            {trans.description}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed italic pt-1">
                Note: Terminal states (RESOLVED, REJECTED) cannot be reopened once set.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setStatusModalReport(null)}
                disabled={isUpdating}
              >
                Cancel
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmStatusUpdate}
                disabled={isUpdating || !selectedNewStatus}
              >
                {isUpdating ? 'Updating...' : 'Confirm Status Change'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* DELETE CONFIRMATION DIALOG MODAL (Admin Only)                       */}
      {/* =================================================================== */}
      {deleteModalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 text-left">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Issue Report</h3>
                <span className="text-xs text-slate-500">Permanent Administrator Action</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-slate-900">
                Report #{deleteModalReport.id}: &ldquo;{deleteModalReport.title}&rdquo;
              </strong>
              ? This action cannot be undone and will remove all audit records associated with this report.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeleteModalReport(null)}
                disabled={isUpdating}
              >
                Cancel
              </Button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isUpdating}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isUpdating ? 'Deleting...' : 'Delete Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
