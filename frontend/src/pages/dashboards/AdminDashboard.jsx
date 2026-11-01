import React, { useEffect, useState, useCallback } from 'react';
import {
  Building2,
  Layers,
  AlertTriangle,
  Users,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import facilityService from '../../services/facilityService';
import studentService from '../../services/studentService';
import reportService from '../../services/reportService';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import FacilityManagementSection from '../../components/admin/FacilityManagementSection';
import CategoryManagementSection from '../../components/admin/CategoryManagementSection';
import StudentManagementSection from '../../components/admin/StudentManagementSection';
import ReportManagementSection from '../../components/reports/ReportManagementSection';

export default function AdminDashboard() {
  const { user } = useAuth();

  // Metrics State
  const [totalFacilities, setTotalFacilities] = useState(0);
  const [totalCategories, setTotalCategories] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [pendingReports, setPendingReports] = useState(0);
  const [resolvedReports, setResolvedReports] = useState(0);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  // Active Navigation Tab: 'facilities' | 'categories' | 'complaints' | 'students'
  const [activeTab, setActiveTab] = useState('facilities');

  const loadMetrics = useCallback(async () => {
    try {
      const [facData, catData, studentData, pendingData, resolvedData] = await Promise.all([
        facilityService.getFacilities({ pageSize: 1 }),
        facilityService.getCategories(),
        studentService.getStudents({ pageSize: 1 }),
        reportService.getReports({ status: 'PENDING', pageSize: 1 }),
        reportService.getReports({ status: 'RESOLVED', pageSize: 1 }),
      ]);

      setTotalFacilities(facData.count || 0);
      setTotalCategories(catData?.length || 0);
      setTotalStudents(studentData.count || 0);
      setPendingReports(pendingData.count || 0);
      setResolvedReports(resolvedData.count || 0);
    } catch (err) {
      console.error('Failed to load admin metrics:', err);
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left w-full">
      {/* Welcome Hero */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="admin">System Administrator</Badge>
            <span className="text-xs text-slate-500">Privileged Session</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Administrator Portal
          </h1>
          <p className="text-sm text-slate-600">
            Signed in as <strong>{user?.email}</strong>. Manage campus facilities, taxonomy, student accounts, and complaint resolutions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('complaints')}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border font-semibold text-sm transition-colors shadow-xs ${
              activeTab === 'complaints'
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Manage Reports</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('facilities')}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-colors shadow-xs"
          >
            <Building2 className="w-4 h-4" />
            <span>Manage Facilities</span>
          </button>
        </div>
      </div>

      {/* Useful Metrics Grid: 5 Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Facilities */}
        <div
          onClick={() => setActiveTab('facilities')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 cursor-pointer hover:border-indigo-300 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Facilities
            </span>
            <Building2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {loadingMetrics ? <Spinner size="sm" /> : totalFacilities}
          </div>
          <p className="text-[11px] text-slate-500">Active & inactive facilities</p>
        </div>

        {/* Categories */}
        <div
          onClick={() => setActiveTab('categories')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 cursor-pointer hover:border-emerald-300 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Categories
            </span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {loadingMetrics ? <Spinner size="sm" /> : totalCategories}
          </div>
          <p className="text-[11px] text-slate-500">Facility taxonomy types</p>
        </div>

        {/* Registered Students */}
        <div
          onClick={() => setActiveTab('students')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 cursor-pointer hover:border-sky-300 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Students
            </span>
            <Users className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {loadingMetrics ? <Spinner size="sm" /> : totalStudents}
          </div>
          <p className="text-[11px] text-slate-500">Enrolled student accounts</p>
        </div>

        {/* Pending Reports */}
        <div
          onClick={() => setActiveTab('complaints')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 cursor-pointer hover:border-amber-300 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Pending Reports
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">
            {loadingMetrics ? <Spinner size="sm" /> : pendingReports}
          </div>
          <p className="text-[11px] text-slate-500">Awaiting review / triage</p>
        </div>

        {/* Resolved Reports */}
        <div
          onClick={() => setActiveTab('complaints')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 cursor-pointer hover:border-emerald-300 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Resolved Reports
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
            {loadingMetrics ? <Spinner size="sm" /> : resolvedReports}
          </div>
          <p className="text-[11px] text-slate-500">Successfully closed</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 pb-px overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('facilities')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-all whitespace-nowrap border-b-2 ${
            activeTab === 'facilities'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Facility Management</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-all whitespace-nowrap border-b-2 ${
            activeTab === 'categories'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Category Taxonomy</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('complaints')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-all whitespace-nowrap border-b-2 ${
            activeTab === 'complaints'
              ? 'border-amber-600 text-amber-700 bg-amber-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Complaint Management</span>
          {pendingReports > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
              {pendingReports}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-all whitespace-nowrap border-b-2 ${
            activeTab === 'students'
              ? 'border-sky-600 text-sky-700 bg-sky-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Student Directory</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'facilities' && (
          <FacilityManagementSection onMetricUpdate={loadMetrics} />
        )}

        {activeTab === 'categories' && (
          <CategoryManagementSection onMetricUpdate={loadMetrics} />
        )}

        {activeTab === 'complaints' && (
          <div id="admin-reports-management">
            <ReportManagementSection
              role="ADMIN"
              title="Campus Issue Reports & Incident Management"
              description="Master administrator control center to inspect, filter, search, transition operational statuses, or permanently delete issue reports across all university facilities."
            />
          </div>
        )}

        {activeTab === 'students' && (
          <StudentManagementSection />
        )}
      </div>
    </div>
  );
}
