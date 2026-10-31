import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Building2, Layers, AlertCircle, ArrowRight } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import facilityService from '../../services/facilityService';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [totalFacilities, setTotalFacilities] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      facilityService.getFacilities({ pageSize: 1 }),
      facilityService.getCategories(),
    ])
      .then(([facData, catData]) => {
        if (isMounted) {
          setTotalFacilities(facData.count || 0);
          setCategories(catData || []);
        }
      })
      .catch((err) => {
        console.error('Failed to load admin metrics:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

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
            Signed in as <strong>{user?.email}</strong>. Manage university facilities, visibility states, and taxonomy.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/facilities"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-colors shadow-xs"
          >
            <Building2 className="w-4 h-4" />
            <span>Manage Directory</span>
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Total Facilities</span>
            <Building2 className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {loading ? <Spinner size="sm" /> : totalFacilities}
          </div>
          <p className="text-xs text-slate-500">Active and inactive facility rows in database</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Categories</span>
            <Layers className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {loading ? <Spinner size="sm" /> : categories.length}
          </div>
          <p className="text-xs text-slate-500">Classifications with unique lowercase enforcement</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Security Scope</span>
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5 pt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Role.ADMIN Verified</span>
          </div>
          <p className="text-xs text-slate-500">Authorization enforced strictly at the database & API levels</p>
        </div>
      </div>

      {/* Admin Notice on Phase Scope */}
      <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-start space-x-3 text-sm text-indigo-900">
        <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-semibold text-indigo-950">Phase 5 Management Scope</h4>
          <p className="text-xs text-indigo-800 leading-relaxed">
            As an Administrator, you can view both active and soft-deleted (inactive) facilities directly in the Facilities Directory. Comprehensive admin creation forms, category editing modals, and batch controls will be expanded in Phase 10.
          </p>
          <div className="pt-2">
            <Link
              to="/facilities"
              className="inline-flex items-center text-xs font-bold text-indigo-700 hover:text-indigo-900"
            >
              <span>Inspect active and inactive facilities</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
