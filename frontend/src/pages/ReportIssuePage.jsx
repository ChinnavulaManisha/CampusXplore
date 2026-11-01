import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Wrench,
  Sparkles,
  Droplets,
  Zap,
  Monitor,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  Send,
  RotateCcw,
} from 'lucide-react';
import facilityService from '../services/facilityService';
import reportService from '../services/reportService';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import Badge from '../components/common/Badge';
import Spinner from '../components/common/Spinner';

const ISSUE_TYPES = [
  {
    id: 'MAINTENANCE',
    label: 'Maintenance',
    description: 'Broken doors, damaged fixtures, furniture repairs',
    icon: Wrench,
  },
  {
    id: 'CLEANLINESS',
    label: 'Cleanliness',
    description: 'Trash overflow, sanitation, hygiene concerns',
    icon: Sparkles,
  },
  {
    id: 'WATER',
    label: 'Water & Plumbing',
    description: 'Leaking taps, washroom pipes, drinking water issues',
    icon: Droplets,
  },
  {
    id: 'ELECTRICAL',
    label: 'Electrical',
    description: 'Power outages, broken lights, switchboard hazards',
    icon: Zap,
  },
  {
    id: 'EQUIPMENT',
    label: 'Equipment',
    description: 'Projector failures, lab machines, AC malfunction',
    icon: Monitor,
  },
  {
    id: 'OTHER',
    label: 'Other',
    description: 'General safety hazards or unlisted campus concerns',
    icon: HelpCircle,
  },
];

export default function ReportIssuePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Facility preselection ID from URL query ?facility=ID or location state
  const paramFacilityId = searchParams.get('facility') || location.state?.fromFacility;

  // Form State
  const [facilityId, setFacilityId] = useState(paramFacilityId ? String(paramFacilityId) : '');
  const [issueType, setIssueType] = useState('MAINTENANCE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // UI / Async State
  const [facilities, setFacilities] = useState([]);
  const [isLoadingFacilities, setIsLoadingFacilities] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [apiError, setApiError] = useState(null);
  const [preselectionWarning, setPreselectionWarning] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [submittedReport, setSubmittedReport] = useState(null);

  // Fetch active facilities on mount for selector
  useEffect(() => {
    let isMounted = true;

    facilityService
      .getAllFacilities({ isActive: true })
      .then((data) => {
        if (!isMounted) return;
        const list = data?.facilities || [];
        setFacilities(list);

        // Preselection reconciliation: ensure preselected ID exists in active list
        if (paramFacilityId) {
          const match = list.find((f) => String(f.id) === String(paramFacilityId));
          if (match) {
            setFacilityId(String(match.id));
            setPreselectionWarning(null);
          } else {
            setFacilityId('');
            setPreselectionWarning(
              `The requested facility (ID #${paramFacilityId}) could not be found or is currently inactive. Please choose an active facility from the list below.`
            );
          }
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to load facilities list:', err);
        setApiError('Unable to load facilities for selection. Please refresh or try again.');
      })
      .finally(() => {
        if (isMounted) setIsLoadingFacilities(false);
      });

    return () => {
      isMounted = false;
    };
  }, [paramFacilityId]);

  // Selected facility object memo
  const selectedFacility = useMemo(() => {
    if (!facilityId) return null;
    return facilities.find((f) => String(f.id) === String(facilityId)) || null;
  }, [facilityId, facilities]);

  // Back navigation URL: returns to preselected facility if available, or /facilities
  const backNavigationUrl = useMemo(() => {
    if (paramFacilityId) {
      return `/facilities/${paramFacilityId}`;
    }
    return '/facilities';
  }, [paramFacilityId]);

  // Client-side validation
  const validateForm = () => {
    const errors = {};

    if (!facilityId) {
      errors.facility = 'Please select the affected campus facility.';
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      errors.title = 'Title is required.';
    } else if (trimmedTitle.length < 3) {
      errors.title = 'Title must be at least 3 characters.';
    } else if (trimmedTitle.length > 200) {
      errors.title = 'Title must not exceed 200 characters.';
    }

    const trimmedDesc = description.trim();
    if (!trimmedDesc) {
      errors.description = 'Description is required.';
    } else if (trimmedDesc.length < 10) {
      errors.description = 'Description must be at least 10 characters.';
    }

    if (!issueType) {
      errors.issueType = 'Please select an issue categorization.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form Submission Handler with Synchronous Duplicate Guard
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent duplicate submissions synchronously if already in-flight
    if (isSubmittingRef.current || isSubmitting) return;

    setApiError(null);

    if (!validateForm()) {
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const payload = {
        facility: parseInt(facilityId, 10),
        title: title.trim(),
        description: description.trim(),
        issue_type: issueType,
      };

      const response = await reportService.createReport(payload);
      setSubmittedReport(response);
    } catch (err) {
      console.error('Report submission failed:', err);
      if (err.response?.data) {
        const errorData = err.response.data;
        if (typeof errorData === 'object' && !errorData.detail) {
          // Field-specific validation errors from backend
          const fieldErrors = {};
          Object.keys(errorData).forEach((key) => {
            const val = errorData[key];
            fieldErrors[key] = Array.isArray(val) ? val.join(' ') : String(val);
          });
          setValidationErrors(fieldErrors);
          setApiError('Please resolve the highlighted validation errors.');
        } else {
          setApiError(errorData.detail || 'Failed to submit issue report. Please try again.');
        }
      } else {
        setApiError('Network connection issue. Please check your connectivity and try again.');
      }
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSubmittedReport(null);
    setTitle('');
    setDescription('');
    setIssueType('MAINTENANCE');
    setValidationErrors({});
    setApiError(null);
    setPreselectionWarning(null);
  };

  // Render Success Screen upon confirmation
  if (submittedReport) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full text-left">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 sm:p-8 bg-gradient-to-r from-emerald-900 to-teal-950 text-white space-y-2">
            <div className="flex items-center gap-2 text-emerald-300">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider">Report Filed</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Issue Report Submitted
            </h1>
            <p className="text-sm text-emerald-100">
              Campus administration and operations have been notified for inspection and resolution.
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Report Reference Details */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Report ID: #{submittedReport.id}
                </span>
                <Badge variant="warning" size="sm">
                  Status: {submittedReport.status || 'PENDING'}
                </Badge>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">{submittedReport.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Category:{' '}
                  <span className="font-semibold text-slate-700">
                    {submittedReport.issue_type}
                  </span>
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center gap-2 text-xs text-slate-600">
                <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="font-medium">
                  {submittedReport.facility?.name} ({submittedReport.facility?.building})
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 flex-wrap">
              <Button
                variant="primary"
                onClick={handleResetForm}
                icon={RotateCcw}
                className="w-full sm:w-auto"
              >
                Submit Another Report
              </Button>

              <Button
                variant="secondary"
                onClick={() => navigate(`/reports/${submittedReport.id}`)}
                className="w-full sm:w-auto"
              >
                View Ticket Details
              </Button>

              <Button
                variant="secondary"
                onClick={() => navigate('/reports')}
                className="w-full sm:w-auto"
              >
                My Reported Issues
              </Button>

              {paramFacilityId ? (
                <Button
                  variant="ghost"
                  onClick={() => navigate(`/facilities/${paramFacilityId}`)}
                  className="w-full sm:w-auto text-xs text-slate-500"
                >
                  Return to Facility
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-left w-full">
      {/* Return Link */}
      <div>
        <Link
          to={backNavigationUrl}
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>
            {paramFacilityId && selectedFacility
              ? `Back to ${selectedFacility.name}`
              : 'Back to Facilities Directory'}
          </span>
        </Link>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Banner Header */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-900 to-indigo-950 text-white space-y-2">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider">Campus Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Report Campus Issue</h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Report maintenance, cleanliness, water, electrical, or equipment problems directly to campus authorities.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {preselectionWarning && (
            <Alert
              type="warning"
              title="Facility Notice"
              message={preselectionWarning}
              onClose={() => setPreselectionWarning(null)}
            />
          )}

          {apiError && (
            <Alert type="error" title="Submission Error" message={apiError} />
          )}

          {/* Facility Selection */}
          <div className="space-y-2">
            <label htmlFor="facilitySelect" className="block text-sm font-semibold text-slate-900">
              Affected Facility <span className="text-rose-500">*</span>
            </label>

            {isLoadingFacilities ? (
              <div className="flex items-center gap-2 p-3 text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
                <Spinner size="sm" />
                <span>Loading campus facilities...</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                <select
                  id="facilitySelect"
                  value={facilityId}
                  onChange={(e) => {
                    setFacilityId(e.target.value);
                    if (validationErrors.facility) {
                      setValidationErrors((prev) => ({ ...prev, facility: undefined }));
                    }
                  }}
                  disabled={isSubmitting}
                  className={`block w-full rounded-lg border px-3.5 py-2.5 text-slate-900 bg-white focus:outline-hidden focus:ring-2 sm:text-sm ${
                    validationErrors.facility
                      ? 'border-rose-300 bg-rose-50/20 focus:ring-rose-500 focus:border-rose-500'
                      : 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                >
                  <option value="">-- Choose a facility --</option>
                  {facilities.map((fac) => (
                    <option key={fac.id} value={fac.id}>
                      {fac.name} ({fac.building})
                    </option>
                  ))}
                </select>

                {validationErrors.facility && (
                  <p className="text-xs text-rose-600 font-medium">{validationErrors.facility}</p>
                )}

                {selectedFacility && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 font-medium">
                    <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>
                      Selected:{' '}
                      <strong className="font-semibold">{selectedFacility.name}</strong> &middot;{' '}
                      {selectedFacility.building}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Issue Type Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-900">
              Issue Category <span className="text-rose-500">*</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {ISSUE_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = issueType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => {
                      setIssueType(type.id);
                      if (validationErrors.issueType) {
                        setValidationErrors((prev) => ({ ...prev, issueType: undefined }));
                      }
                    }}
                    disabled={isSubmitting}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 bg-white'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900">{type.label}</div>
                      <div className="text-[11px] text-slate-500 leading-snug line-clamp-2 mt-0.5">
                        {type.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {validationErrors.issueType && (
              <p className="text-xs text-rose-600 font-medium">{validationErrors.issueType}</p>
            )}
          </div>

          {/* Title Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="reportTitle" className="block text-sm font-semibold text-slate-900">
                Issue Summary <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-[11px] ${
                  title.length > 200 ? 'text-rose-600 font-bold' : 'text-slate-400'
                }`}
              >
                {title.length} / 200
              </span>
            </div>

            <input
              id="reportTitle"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (validationErrors.title) {
                  setValidationErrors((prev) => ({ ...prev, title: undefined }));
                }
              }}
              disabled={isSubmitting}
              placeholder="e.g. Broken bench and water cooler leaking near entrance"
              maxLength={200}
              className={`block w-full rounded-lg border px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 sm:text-sm ${
                validationErrors.title
                  ? 'border-rose-300 bg-rose-50/20 focus:ring-rose-500 focus:border-rose-500'
                  : 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 bg-white'
              }`}
            />
            {validationErrors.title ? (
              <p className="text-xs text-rose-600 font-medium">{validationErrors.title}</p>
            ) : (
              <p className="text-xs text-slate-400">Brief, clear summary of the issue (min 3 chars).</p>
            )}
          </div>

          {/* Description Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="reportDescription" className="block text-sm font-semibold text-slate-900">
                Detailed Description <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-[11px] ${
                  description.length < 10 && description.length > 0
                    ? 'text-amber-600 font-medium'
                    : 'text-slate-400'
                }`}
              >
                {description.length >= 10 ? `${description.length} chars` : `${description.length} / 10 min chars`}
              </span>
            </div>

            <textarea
              id="reportDescription"
              rows={4}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (validationErrors.description) {
                  setValidationErrors((prev) => ({ ...prev, description: undefined }));
                }
              }}
              disabled={isSubmitting}
              placeholder="Please provide specific details about the issue location, severity, and any immediate safety hazards..."
              className={`block w-full rounded-lg border px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 sm:text-sm ${
                validationErrors.description
                  ? 'border-rose-300 bg-rose-50/20 focus:ring-rose-500 focus:border-rose-500'
                  : 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 bg-white'
              }`}
            />
            {validationErrors.description ? (
              <p className="text-xs text-rose-600 font-medium">{validationErrors.description}</p>
            ) : (
              <p className="text-xs text-slate-400">
                Include room numbers, floor information, or specific equipment IDs if known.
              </p>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(backNavigationUrl)}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              icon={Send}
              className="w-full sm:w-auto"
            >
              Submit Report
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
