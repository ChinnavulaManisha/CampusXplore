import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link to="/" className="inline-flex items-center space-x-2.5">
          <Compass className="h-10 w-10 text-indigo-600" />
          <span className="font-extrabold text-2xl tracking-tight text-slate-900">
            CampusXplore
          </span>
        </Link>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Lovely Professional University
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-slate-200 rounded-2xl">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
