import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, GraduationCap, ArrowRight, Layers } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import facilityService from '../../services/facilityService';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    facilityService
      .getFacilities({ pageSize: 4 })
      .then((data) => {
        if (isMounted) {
          setFacilities(data.results || []);
        }
      })
      .catch((err) => {
        console.error('Failed to load faculty facilities:', err);
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
            <Badge variant="faculty">Faculty Portal</Badge>
            <span className="text-xs text-slate-500">University Staff</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Welcome, Professor {user?.first_name || user?.email}!
          </h1>
          <p className="text-sm text-slate-600">
            Access departmental buildings, academic lecture halls, and staff coordination facilities.
          </p>
        </div>

        <Link
          to="/facilities"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm transition-colors shadow-xs"
        >
          <Building2 className="w-4 h-4" />
          <span>Campus Directory</span>
        </Link>
      </div>

      {/* Quick Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <GraduationCap className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-700">Academic Facilities</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Quickly locate department blocks, faculty lounges, and examination halls.
          </p>
          <Link
            to="/facilities?category=Academic"
            className="inline-flex items-center text-xs font-semibold text-purple-600 hover:text-purple-700 pt-1"
          >
            <span>Filter academic blocks</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-700">Campus Infrastructure</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Browse verified campus blocks with coordinate metadata and contact details.
          </p>
          <Link
            to="/facilities"
            className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-700 pt-1"
          >
            <span>All facilities</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 sm:col-span-2 lg:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
            <Building2 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-700">Facility Operations</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Campus issue reporting and maintenance tracking will activate in Phase 9.
          </p>
          <span className="inline-block text-[11px] font-medium text-slate-400 pt-1">
            Phase 9 Feature
          </span>
        </div>
      </div>

      {/* Facilities Preview */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Campus Infrastructure Directory</h2>
        {loading ? (
          <div className="py-8 flex justify-center">
            <Spinner size="md" />
          </div>
        ) : facilities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {facilities.map((facility) => (
              <div
                key={facility.id}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2 flex flex-col justify-between"
              >
                <div>
                  <Badge variant="primary" size="xs">
                    {facility.category?.name || 'General'}
                  </Badge>
                  <h4 className="font-bold text-slate-900 text-sm mt-2">{facility.name}</h4>
                  <p className="text-xs text-slate-500">{facility.building}</p>
                </div>
                <Link
                  to={`/facilities/${facility.id}`}
                  className="text-xs font-semibold text-purple-600 hover:text-purple-700 inline-flex items-center pt-2 border-t border-slate-100"
                >
                  <span>Details</span>
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
