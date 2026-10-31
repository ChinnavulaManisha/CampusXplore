import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import Button from '../components/common/Button';

export default function NotFoundPage() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8 bg-slate-50 text-center">
      <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-sm border border-slate-200 space-y-6">
        <div className="w-14 h-14 mx-auto rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
          <Compass className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase">404 Error</span>
          <h1 className="text-2xl font-bold text-slate-900">Page Not Found</h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            The page you are looking for does not exist on the campus platform.
          </p>
        </div>

        <div className="pt-2">
          <Link to="/">
            <Button variant="primary" icon={Home} className="w-full sm:w-auto">
              Return to Homepage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
