import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Compass, Menu, X, LogOut, User as UserIcon, Building2, LayoutDashboard, Map, AlertTriangle } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import Badge from '../common/Badge';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const roleBadgeVariant = {
    STUDENT: 'student',
    FACULTY: 'faculty',
    ADMIN: 'admin',
  }[user?.role] || 'default';

  return (
    <nav className="bg-white/95 backdrop-blur-xl text-slate-800 shadow-xs border-b border-slate-200/90 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link
            to="/"
            className="flex items-center space-x-3 hover:opacity-90 transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Compass className="h-8 w-8 text-violet-600" />
            <div className="flex flex-col text-left">
              <span className="font-bold text-lg tracking-tight text-slate-900 leading-tight">
                CampusXplore
              </span>
              <span className="text-[10px] text-slate-500 tracking-wider uppercase font-semibold">
                LPU Smart Campus
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {!isAuthenticated && (
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/') ? 'bg-violet-50 text-violet-700 font-semibold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                Home
              </Link>
            )}

            <a
              href="/#directory"
              className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              Directory
            </a>

            <a
              href="/#features"
              className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              Features
            </a>

            <a
              href="/#about"
              className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              About
            </a>

            {isAuthenticated && (
              <>
                <Link
                  to="/facilities"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/facilities') ? 'bg-violet-50 text-violet-700 font-semibold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  Facilities
                </Link>
                <Link
                  to="/map"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/map') ? 'bg-violet-50 text-violet-700 font-semibold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Map className="w-4 h-4" />
                  Campus Map
                </Link>
                <Link
                  to="/reports"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname.startsWith('/reports')
                      ? 'bg-violet-50 text-violet-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  Reports
                </Link>
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname.includes('/dashboard')
                      ? 'bg-violet-50 text-violet-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
              </>
            )}
          </div>

          {/* Desktop User Section */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-right">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-800">
                      {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.email}
                    </span>
                    <span className="text-[11px] text-slate-500">{user?.email}</span>
                  </div>
                  <Badge variant={roleBadgeVariant} size="xs">
                    {user?.role}
                  </Badge>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                  title="Sign out of your session"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-violet-600/20 transition-all"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-hidden cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3 shadow-lg">
          <div className="space-y-1">
            {!isAuthenticated && (
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-800 hover:bg-slate-100"
              >
                Home
              </Link>
            )}
            <a
              href="/#directory"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-800 hover:bg-slate-100"
            >
              Directory
            </a>
            <a
              href="/#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-800 hover:bg-slate-100"
            >
              Features
            </a>
            <a
              href="/#about"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-800 hover:bg-slate-100"
            >
              About
            </a>
            {isAuthenticated && (
              <>
                <Link
                  to="/facilities"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-slate-800 hover:bg-slate-100"
                >
                  Facilities Directory
                </Link>
                <Link
                  to="/map"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-slate-800 hover:bg-slate-100"
                >
                  Campus Map
                </Link>
                <Link
                  to="/reports"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-slate-800 hover:bg-slate-100"
                >
                  Reports
                </Link>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-slate-800 hover:bg-slate-100"
                >
                  My Dashboard
                </Link>
              </>
            )}
          </div>

          <div className="pt-4 border-t border-slate-200">
            {isAuthenticated ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center space-x-2">
                    <UserIcon className="w-5 h-5 text-violet-600" />
                    <span className="text-sm font-medium text-slate-800 truncate max-w-[180px]">
                      {user?.email}
                    </span>
                  </div>
                  <Badge variant={roleBadgeVariant} size="xs">
                    {user?.role}
                  </Badge>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-800 hover:bg-slate-200"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold bg-linear-to-r from-violet-600 to-indigo-600 text-white shadow-xs"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
