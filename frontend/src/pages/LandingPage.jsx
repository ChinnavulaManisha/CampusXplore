import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { MapPin, Navigation, Building2, ShieldCheck, Activity } from 'lucide-react';

export default function LandingPage() {
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/health/')
      .then((res) => {
        setHealthStatus(res.data);
      })
      .catch((err) => {
        setHealthStatus({ status: 'offline', message: err.message });
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8 text-center bg-slate-50">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* University Badge */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-medium">
          <MapPin className="w-4 h-4 text-indigo-600" />
          <span>Lovely Professional University</span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight">
          CampusXplore
        </h1>

        {/* Subtitle */}
        <p className="text-xl sm:text-2xl text-slate-700 font-semibold max-w-2xl mx-auto leading-relaxed">
          Smart Campus Navigation and Facility Management System
        </p>

        {/* Location */}
        <p className="text-base text-slate-500 font-medium">
          Lovely Professional University, Punjab, India
        </p>

        {/* Simple Introductory Section */}
        <div className="mt-8 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm text-left max-w-2xl mx-auto space-y-4">
          <h2 className="text-lg font-bold text-slate-900 text-center sm:text-left">
            About the Platform
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Welcome to CampusXplore, the centralized digital campus companion for students, faculty, and visitors at Lovely Professional University. The platform is designed to simplify on-campus movement, help you locate buildings and facilities across the 600+ acre campus, and streamline university facility operations.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="flex items-center space-x-2 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <Navigation className="w-5 h-5 text-indigo-600 flex-shrink-0" />
              <span className="text-xs font-semibold text-slate-800">Smart Navigation</span>
            </div>
            <div className="flex items-center space-x-2 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <Building2 className="w-5 h-5 text-indigo-600 flex-shrink-0" />
              <span className="text-xs font-semibold text-slate-800">Facility Tracking</span>
            </div>
            <div className="flex items-center space-x-2 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <ShieldCheck className="w-5 h-5 text-indigo-600 flex-shrink-0" />
              <span className="text-xs font-semibold text-slate-800">Campus Services</span>
            </div>
          </div>
        </div>

        {/* Live Backend Connection Status */}
        <div className="pt-4">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-700 shadow-xs">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">Backend API Status:</span>
            {loading ? (
              <span className="text-amber-600 font-semibold">Connecting...</span>
            ) : healthStatus?.status === 'ok' ? (
              <span className="text-emerald-600 font-semibold">Online ({healthStatus.message})</span>
            ) : (
              <span className="text-rose-600 font-semibold">Offline</span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
