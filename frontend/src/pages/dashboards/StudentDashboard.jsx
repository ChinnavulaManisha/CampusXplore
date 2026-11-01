import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Compass, ArrowRight, BookOpen, Layers, AlertTriangle } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import facilityService from '../../services/facilityService';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [facilities, setFacilities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      facilityService.getFacilities({ pageSize: 3 }),
      facilityService.getCategories(),
    ])
      .then(([facData, catData]) => {
        if (isMounted) {
          setFacilities(facData.results || []);
          setCategories(catData || []);
        }
      })
      .catch((err) => {
        console.error('Failed to load dashboard data:', err);
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
            <Badge variant="student">Student Portal</Badge>
            <span className="text-xs text-slate-500">Academic Session</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Welcome, {user?.first_name || 'Student'}!
          </h1>
          <p className="text-sm text-slate-600">
            Explore facilities, classrooms, cafeterias, and campus services at Lovely Professional University.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/reports"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors shadow-xs"
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>My Reported Issues</span>
          </Link>

          <Link
            to="/facilities"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-xs"
          >
            <Building2 className="w-4 h-4" />
            <span>Browse Facilities</span>
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Building2 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-700">Campus Facilities</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Locate lecture halls, laboratories, food courts, and campus study spaces.
          </p>
          <Link
            to="/facilities"
            className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-700 pt-1"
          >
            <span>View all directory</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-700">Facility Categories</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {categories.length > 0 ? `${categories.length} categories available` : 'Classification directory'}
          </p>
          <Link
            to="/facilities"
            className="inline-flex items-center text-xs font-semibold text-emerald-600 hover:text-emerald-700 pt-1"
          >
            <span>Filter by category</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <Compass className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-700">Campus Roadmap</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Interactive GPS navigation and issue reporting are planned in subsequent phases.
          </p>
          <Link
            to="/map"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 pt-1"
          >
            <span>Explore Campus Map</span>
            <span>&rarr;</span>
          </Link>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-700">Reported Issues</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Track status updates, inspection progress, and resolution history for your reports.
          </p>
          <Link
            to="/reports"
            className="inline-flex items-center text-xs font-semibold text-amber-600 hover:text-amber-700 pt-1"
          >
            <span>View my reports</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>
      </div>

      {/* Featured Campus Facilities Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <span>Featured Campus Spots</span>
          </h2>
          <Link
            to="/facilities"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <span>See full list</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-8 flex justify-center">
            <Spinner size="md" />
          </div>
        ) : facilities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {facilities.map((facility) => (
              <div
                key={facility.id}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {facility.category?.name || 'Campus Spot'}
                    </span>
                    <Badge variant="success" size="xs">Active</Badge>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{facility.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">{facility.building}</p>
                </div>
                <Link
                  to={`/facilities/${facility.id}`}
                  className="text-xs font-medium text-slate-700 hover:text-indigo-600 inline-flex items-center pt-2 border-t border-slate-100"
                >
                  <span>View location details</span>
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 py-4">No facilities registered yet.</p>
        )}
      </div>
    </div>
  );
}
