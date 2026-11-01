import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, MapPin, ShieldCheck, Layers, ArrowUpRight } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200/90 text-slate-600 text-xs mt-auto transition-colors">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand & Mission (Span 2 cols on LG) */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center space-x-2.5 text-slate-900 hover:opacity-90 transition-opacity">
              <Compass className="h-7 w-7 text-violet-600" />
              <div className="flex flex-col text-left">
                <span className="font-bold text-base tracking-tight text-slate-900 leading-tight">
                  CampusXplore
                </span>
                <span className="text-[10px] text-slate-500 tracking-wider uppercase font-semibold">
                  LPU Smart Campus GIS
                </span>
              </div>
            </Link>
            <p className="text-slate-500 text-xs leading-relaxed max-w-sm">
              Next-generation spatial navigation and campus asset management platform engineered for Lovely Professional University. Digitizing 600+ acres with verified GPS coordinates and transparent institutional governance.
            </p>
            <div className="pt-1 flex items-center gap-2 text-[11px] text-emerald-700 font-mono">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-medium text-slate-700">All Campus GIS & API Systems Operational</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="text-slate-600 hover:text-violet-600 transition-colors">
                  Home Overview
                </Link>
              </li>
              <li>
                <a href="/#directory" className="text-slate-600 hover:text-violet-600 transition-colors">
                  Campus Directory
                </a>
              </li>
              <li>
                <a href="/#features" className="text-slate-600 hover:text-violet-600 transition-colors">
                  Platform Features
                </a>
              </li>
              <li>
                <a href="/#how-it-works" className="text-slate-600 hover:text-violet-600 transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="/#about" className="text-slate-600 hover:text-violet-600 transition-colors">
                  About LPU Initiative
                </a>
              </li>
              <li>
                <Link to="/map" className="text-slate-600 hover:text-violet-600 transition-colors inline-flex items-center gap-1">
                  <span>Interactive Map</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-400" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Portals & Governance */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
              Portals
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/login" className="text-slate-600 hover:text-violet-600 transition-colors">
                  Student Portal
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-slate-600 hover:text-violet-600 transition-colors">
                  Faculty Workspace
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-slate-600 hover:text-violet-600 transition-colors">
                  Administrative Console
                </Link>
              </li>
              <li>
                <Link to="/reports" className="text-slate-600 hover:text-violet-600 transition-colors">
                  Issue Reporting System
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-violet-600 hover:text-violet-700 font-medium transition-colors">
                  Create Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Campus & Technical Specs */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
              Institution & Tech
            </h4>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                <span>Lovely Professional University, Phagwara, Punjab 144411</span>
              </div>
              <div className="flex items-start gap-2 pt-1">
                <Layers className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                <span>React 19 • Tailwind CSS • Django REST Framework • Leaflet GIS</span>
              </div>
              <div className="flex items-start gap-2 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Role-Based Access Control & JWT Token Authentication</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {CURRENT_YEAR} CampusXplore. Engineered as a Final-Year B.Tech Capstone Project.</p>
          <div className="flex items-center space-x-6">
            <span className="hover:text-slate-700 transition-colors">Designed for Lovely Professional University</span>
            <span>•</span>
            <span className="text-slate-600 font-medium font-mono">Production Architecture Ready</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
