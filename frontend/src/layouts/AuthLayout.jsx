import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { 
  Compass, 
  GraduationCap, 
  BookOpen, 
  MapPin, 
  Building2, 
  Sparkles, 
  ArrowLeft, 
  ShieldCheck,
  School
} from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* =========================================================================
          1. PHOTOGRAPHIC LPU CAMPUS BACKGROUND & CINEMATIC GRADIENT OVERLAY
          ========================================================================= */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat scale-105 pointer-events-none transform transition-transform duration-1000"
        style={{ backgroundImage: "url('/lpu_campus_hero.jpg')" }}
      />
      {/* Multi-layer gradient backdrop for optimal contrast and readability */}
      <div className="fixed inset-0 bg-slate-950/75 pointer-events-none" />
      <div className="fixed inset-0 bg-linear-to-tr from-slate-950/90 via-indigo-950/70 to-slate-900/80 pointer-events-none" />

      {/* Subtle Ambient Glow Orbs */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* =========================================================================
          2. TOP NAVIGATION BAR (BACK BUTTON & LPU CAMPUS BADGE)
          ========================================================================= */}
      <header className="relative z-20 w-full px-4 sm:px-8 py-5 flex items-center justify-between">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-white text-xs sm:text-sm font-medium transition-all duration-200 shadow-sm hover:scale-105 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-indigo-300" />
          <span>Back to Campus</span>
        </Link>

        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-white text-xs sm:text-sm font-medium shadow-sm">
          <MapPin className="w-4 h-4 text-indigo-300" />
          <span className="hidden sm:inline">Lovely Professional University,</span>
          <span>Punjab</span>
        </div>
      </header>

      {/* =========================================================================
          3. MAIN CONTENT AREA: CENTER AUTH CARD & EDUCATIONAL HIGHLIGHTS
          ========================================================================= */}
      <main className="relative z-20 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-6">
        <div className="w-full max-w-6xl flex items-center justify-center lg:justify-between gap-12">
          
          {/* Left Side: Educational Campus Highlights (Desktop Only) */}
          <div className="hidden lg:flex flex-col gap-6 max-w-sm text-white">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
                <School className="w-3.5 h-3.5" />
                <span>Smart Campus Portal</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
                Welcome to <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-300 via-purple-300 to-pink-300">
                  CampusXplore LPU
                </span>
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Discover facilities, navigate academic blocks, and track campus maintenance in real time across 600+ acres.
              </p>
            </div>

            {/* Educational Feature Cards */}
            <div className="space-y-3.5">
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors">
                <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">50+ Academic Blocks</h3>
                  <p className="text-xs text-slate-300">Detailed floor plans, lecture theaters, and advanced research labs.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors">
                <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Central Library & UniMall</h3>
                  <p className="text-xs text-slate-300">Find operating hours, study spaces, food courts, and campus services.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Instant Facility Support</h3>
                  <p className="text-xs text-slate-300">Report campus infrastructure concerns and track real-time resolution.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Center / Auth Card Container */}
          <div className="w-full max-w-md">
            <div className="relative">
              {/* Outer Glow */}
              <div className="absolute -inset-1 rounded-3xl bg-linear-to-r from-indigo-500 to-purple-600 opacity-25 blur-xl" />

              {/* Card Body */}
              <div className="relative bg-white/95 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/40 p-7 sm:p-9">
                {/* Branding Header inside card */}
                <div className="text-center space-y-2 mb-6">
                  <Link to="/" className="inline-flex items-center justify-center space-x-2.5 group">
                    <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30 group-hover:scale-105 transition-transform">
                      <Compass className="h-6 w-6" />
                    </div>
                    <span className="font-extrabold text-2xl tracking-tight text-slate-900">
                      CampusXplore
                    </span>
                  </Link>
                  <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-widest">
                    Lovely Professional University
                  </p>
                </div>

                {/* Outlet renders LoginPage or RegisterPage */}
                <Outlet />
              </div>
            </div>
          </div>

          {/* Right Side: Campus Stats / Badges (Desktop Only) */}
          <div className="hidden xl:flex flex-col gap-4 max-w-xs text-white">
            <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 space-y-1">
              <div className="flex items-center gap-2 text-indigo-300">
                <Building2 className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Campus Scale</span>
              </div>
              <p className="text-2xl font-black text-white">600+ Acres</p>
              <p className="text-xs text-slate-300">One of India's largest single-campus universities</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 space-y-1">
              <div className="flex items-center gap-2 text-purple-300">
                <GraduationCap className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Student Body</span>
              </div>
              <p className="text-2xl font-black text-white">30,000+ Students</p>
              <p className="text-xs text-slate-300">Scholars & faculty from all Indian states & 50+ countries</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 space-y-1">
              <div className="flex items-center gap-2 text-emerald-300">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Security & Access</span>
              </div>
              <p className="text-sm font-semibold text-white">Role-Based Access</p>
              <p className="text-xs text-slate-300">Encrypted JWT authentication with @lpu.in credentials</p>
            </div>
          </div>

        </div>
      </main>

      {/* =========================================================================
          4. FOOTER NOTE
          ========================================================================= */}
      <footer className="relative z-20 w-full py-4 px-4 text-center text-xs text-slate-400">
        <p>
          © {new Date().getFullYear()} CampusXplore • Lovely Professional University, Punjab • Transforming Education, Transforming India
        </p>
      </footer>
    </div>
  );
}
