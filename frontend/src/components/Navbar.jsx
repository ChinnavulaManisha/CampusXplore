import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="bg-slate-900 text-white shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-3">
            <Compass className="h-8 w-8 text-indigo-400" />
            <span className="font-bold text-xl tracking-tight text-white">CampusXplore</span>
          </Link>
          <div className="text-xs sm:text-sm text-slate-400">
            Lovely Professional University
          </div>
        </div>
      </div>
    </nav>
  );
}
