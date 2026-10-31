import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import Button from '../components/common/Button';

export default function UnauthorizedPage() {
  const { user } = useAuth();

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8 bg-slate-50 text-center">
      <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-sm border border-slate-200 space-y-6">
        <div className="w-14 h-14 mx-auto rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">Access Restricted</h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            You do not have the required permissions to view this section.
            {user && (
              <span className="block mt-1 text-slate-500 font-mono text-xs">
                Current role: <strong>{user.role}</strong>
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link to="/dashboard">
            <Button variant="primary" icon={Home} className="w-full sm:w-auto">
              Go to My Dashboard
            </Button>
          </Link>
          <Link to="/">
            <Button variant="secondary" icon={ArrowLeft} className="w-full sm:w-auto">
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
