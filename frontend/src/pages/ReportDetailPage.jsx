import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Layers,
  Wrench,
  Droplets,
  Zap,
  Sparkles,
  HelpCircle,
  ExternalLink,
  ShieldAlert,
  User,
  Calendar,
} from 'lucide-react';
import reportService from '../services/reportService';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import { formatDateTime } from '../utils/formatters';

const STATUS_META = {
  PENDING: {
    label: 'Pending Review',
    variant: 'warning',
    description: 'Your report has been received and logged into campus dispatch. Operations staff will review and prioritize inspection.',
    stepIndex: 0,
  },
  IN_PROGRESS: {
    label: 'In Progress',
    variant: 'primary',
    description: 'Maintenance or facilities personnel have been dispatched to inspect, repair, or resolve the reported issue.',
    stepIndex: 1,
  },
  RESOLVED: {
    label: 'Resolved',
    variant: 'success',
    description: 'The issue has been addressed and verified complete by campus administration.',
    stepIndex: 2,
  },
  REJECTED: {
    label: 'Rejected / Closed',
    variant: 'danger',
    description: 'This report was evaluated and determined to be duplicate, out of scope, or non-actionable.',
    stepIndex: 2,
  },
};

const ISSUE_TYPE_META = {
  MAINTENANCE: { label: 'General Maintenance', icon: Wrench, color: 'text-amber-600 bg-amber-50' },
  CLEANLINESS: { label: 'Cleanliness & Sanitation', icon: Sparkles, color: 'text-emerald-600 bg-emerald-50' },
  WATER: { label: 'Water & Plumbing', icon: Droplets, color: 'text-blue-600 bg-blue-50' },
  ELECTRICAL: { label: 'Electrical & Lighting', icon: Zap, color: 'text-purple-600 bg-purple-50' },
  EQUIPMENT: { label: 'Equipment & Hardware', icon: Layers, color: 'text-indigo-600 bg-indigo-50' },
  OTHER: { label: 'Other Concern', icon: HelpCircle, color: 'text-slate-600 bg-slate-50' },
};

export default function ReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    reportService
      .getReportById(id)
      .then((data) => {
        if (!isMounted) return;
        setReport(data);
        setError(null);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to load report detail:', err);
        if (err.response?.status === 404 || err.response?.status === 403) {
          setError('Report not found or you do not have permission to view it.');
        } else {
          setError('Unable to load report details. Please check your connectivity and try again.');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center space-y-3 text-left w-full">
        <Spinner size="lg" />
        <p className="text-sm font-medium text-slate-500">Loading report #{id} details...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 text-left w-full">
        <Link
          to="/reports"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Reports</span>
        </Link>

        <div className="p-8 sm:p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">Unable to Display Report</h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {error || 'This report may not exist or does not belong to your account.'}
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={() => navigate('/reports')}>
            Return to My Reports
          </Button>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_META[report.status] || {
    label: report.status,
    variant: 'default',
    description: 'Current status recorded in campus operations database.',
    stepIndex: 0,
  };

  const typeInfo = ISSUE_TYPE_META[report.issue_type] || {
    label: report.issue_type,
    icon: HelpCircle,
    color: 'text-slate-600 bg-slate-50',
  };
  const TypeIcon = typeInfo.icon;

  const isTerminal = report.status === 'RESOLVED' || report.status === 'REJECTED';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-left w-full">
      {/* Return Navigation */}
      <div>
        <Link
          to="/reports"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Reports</span>
        </Link>
      </div>

      {/* Main Report Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Banner Header */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold tracking-wider uppercase bg-white/10 px-2.5 py-1 rounded-md text-slate-200 border border-white/10">
                Ticket #{report.id}
              </span>
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md ${typeInfo.color}`}
              >
                <TypeIcon className="w-3.5 h-3.5" />
                <span>{typeInfo.label}</span>
              </span>
            </div>

            <Badge variant={statusInfo.variant} size="md">
              {statusInfo.label}
            </Badge>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {report.title}
          </h1>

          <div className="flex items-center gap-4 text-xs text-slate-300 flex-wrap pt-1">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Submitted on {formatDateTime(report.created_at)}</span>
            </div>
            {report.updated_at !== report.created_at && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Last updated {formatDateTime(report.updated_at)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Status Lifecycle Stepper */}
        <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/70">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
            Resolution Progress Tracking
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Step 1: Submitted */}
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                statusInfo.stepIndex >= 0
                  ? 'bg-white border-indigo-200 shadow-xs'
                  : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <h4 className="text-xs font-bold text-slate-900">1. Report Submitted</h4>
                <p className="text-[11px] text-slate-500">Logged into dispatch</p>
              </div>
            </div>

            {/* Step 2: In Progress */}
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                statusInfo.stepIndex >= 1
                  ? 'bg-white border-indigo-200 shadow-xs'
                  : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  statusInfo.stepIndex >= 1
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {statusInfo.stepIndex >= 1 ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Clock className="w-4 h-4" />
                )}
              </div>
              <div className="space-y-0.5 min-w-0">
                <h4 className="text-xs font-bold text-slate-900">2. Staff Inspection</h4>
                <p className="text-[11px] text-slate-500">
                  {statusInfo.stepIndex >= 1 ? 'Under evaluation' : 'Pending dispatch'}
                </p>
              </div>
            </div>

            {/* Step 3: Resolution */}
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                isTerminal
                  ? report.status === 'RESOLVED'
                    ? 'bg-emerald-50/60 border-emerald-200 shadow-xs'
                    : 'bg-rose-50/60 border-rose-200 shadow-xs'
                  : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  isTerminal
                    ? report.status === 'RESOLVED'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {isTerminal ? (
                  report.status === 'RESOLVED' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )
                ) : (
                  <Clock className="w-4 h-4" />
                )}
              </div>
              <div className="space-y-0.5 min-w-0">
                <h4 className="text-xs font-bold text-slate-900">
                  {report.status === 'REJECTED' ? '3. Closed / Rejected' : '3. Resolution'}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {isTerminal
                    ? report.status === 'RESOLVED'
                      ? 'Repairs verified complete'
                      : 'Closed by administration'
                    : 'Awaiting completion'}
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-600 mt-3 bg-white p-3 rounded-lg border border-slate-200">
            <strong>Current Status Note:</strong> {statusInfo.description}
          </p>
        </div>

        {/* Report Details Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Issue Description */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900">Issue Description</h3>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {report.description}
            </div>
          </div>

          {/* Facility Location Details */}
          <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600 shrink-0" />
                <h3 className="text-sm font-bold text-slate-900">Reported Facility Location</h3>
              </div>
              <Link
                to={`/facilities/${report.facility?.id}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                <span>View Facility Details</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div>
                <span className="text-slate-500">Facility Name:</span>
                <p className="font-semibold text-slate-900 text-sm">{report.facility?.name}</p>
              </div>
              <div>
                <span className="text-slate-500">Building / Zone:</span>
                <p className="font-semibold text-slate-900 text-sm">{report.facility?.building}</p>
              </div>
            </div>
          </div>

          {/* Reporter & Metadata Details */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-500 shrink-0" />
              <span>
                Reported by:{' '}
                <strong className="text-slate-800">
                  {report.user?.first_name} {report.user?.last_name}
                </strong>{' '}
                ({report.user?.email})
              </span>
            </div>

            <div>
              Status Reference:{' '}
              <span className="font-mono font-semibold text-slate-800">
                {report.status}
              </span>
            </div>
          </div>

          {/* Action Links */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => navigate('/reports')}
              icon={ArrowLeft}
              className="w-full sm:w-auto"
            >
              Back to My Reports
            </Button>

            <Link
              to={`/reports/new?facility=${report.facility?.id}`}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Report Another Issue at this Facility</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
