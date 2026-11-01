import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import useAuth from '../hooks/useAuth';
import {
  Compass,
  Building2,
  Navigation,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  MapPin,
  Layers,
  Sparkles,
  ChevronRight,
  Cpu,
  Radio,
  FileCheck,
  Check,
  Zap,
  Search,
} from 'lucide-react';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [healthStatus, setHealthStatus] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('ALL');
  const [activeReportStep, setActiveReportStep] = useState(1); // 0: PENDING, 1: IN_PROGRESS, 2: RESOLVED

  useEffect(() => {
    let isMounted = true;
    api
      .get('/health/')
      .then((res) => {
        if (isMounted) setHealthStatus(res.data);
      })
      .catch((err) => {
        if (isMounted) setHealthStatus({ status: 'offline', message: err.message });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle hero search form submission - routes to actual facilities directory
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      navigate(`/facilities?search=${encodeURIComponent(query)}`);
    } else {
      navigate('/facilities');
    }
  };

  const handleQuickTagClick = (tag) => {
    navigate(`/facilities?search=${encodeURIComponent(tag)}`);
  };

  // Real campus facility nodes across LPU's 600+ acre grounds
  const campusFacilities = [
    {
      id: 0,
      name: 'Central Library',
      block: 'Block 37',
      category: 'ACADEMIC',
      categoryLabel: 'Academic & Research',
      status: 'Open Today',
      hours: '08:00 AM – 10:00 PM',
      coordinates: '31.2536° N, 75.7032° E',
      specs: '4 Floors • 150,000+ Volumes • Digital Media Wing',
      floor: 'Floors 1–4',
      contact: '+91 1824 517100',
    },
    {
      id: 1,
      name: 'Indoor Sports Complex',
      block: 'Shanti Devi Stadium',
      category: 'SPORTS',
      categoryLabel: 'Athletics & Fitness',
      status: 'Open Today',
      hours: '06:00 AM – 09:00 PM',
      coordinates: '31.2570° N, 75.7080° E',
      specs: 'Olympic Badminton • Basketball Arena • High-Performance Gym',
      floor: 'Ground & Mezzanine',
      contact: '+91 1824 517350',
    },
    {
      id: 2,
      name: 'UniMall & Student Plaza',
      block: 'Central Avenue',
      category: 'COMMERCIAL',
      categoryLabel: 'Dining & Commerce',
      status: 'Open Today',
      hours: '08:00 AM – 11:00 PM',
      coordinates: '31.2534° N, 75.7036° E',
      specs: '40+ Dining Outlets • Banking Hub • Stationery & Postal Service',
      floor: 'Floors G–3',
      contact: '+91 1824 517400',
    },
    {
      id: 3,
      name: 'Computer Science Dept',
      block: 'Block 38',
      category: 'ACADEMIC',
      categoryLabel: 'Engineering & Labs',
      status: 'Open Today',
      hours: '09:00 AM – 06:00 PM',
      coordinates: '31.2548° N, 75.7061° E',
      specs: 'AI Innovation Hub • Robotics Cluster • Cloud Datacenter',
      floor: 'Floors 2–5',
      contact: '+91 1824 517220',
    },
    {
      id: 4,
      name: 'Baldev Raj Mittal Auditorium',
      block: 'Block 13',
      category: 'SERVICES',
      categoryLabel: 'Arts & Convocations',
      status: 'Event Access Only',
      hours: '09:00 AM – 08:00 PM',
      coordinates: '31.2562° N, 75.7045° E',
      specs: '2,500 Seater Acoustic Hall • Global Symposia Stage',
      floor: 'Ground & Balcony',
      contact: '+91 1824 517112',
    },
  ];

  // Filtered facilities for Directory section
  const filteredFacilities =
    activeCategoryFilter === 'ALL'
      ? campusFacilities
      : campusFacilities.filter((f) => f.category === activeCategoryFilter);

  // Ticket states for Issue Reporting showcase
  const reportStages = [
    {
      step: 0,
      title: 'Report Submitted',
      badge: 'PENDING',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      timestamp: 'Today at 09:14 AM',
      actor: 'Student (Reg: 12108422)',
      desc: 'Elevator 2 in Block 37 (Library) displays floor sensor calibration fault. Submitted with geolocated photo.',
    },
    {
      step: 1,
      title: 'Triage & In Progress',
      badge: 'IN PROGRESS',
      badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
      timestamp: 'Today at 10:25 AM',
      actor: 'Campus Estate Services (Faculty/Admin)',
      desc: 'Technician team dispatched. Sensor hardware recalibrated; final safety inspection in progress.',
    },
    {
      step: 2,
      title: 'Audited & Resolved',
      badge: 'RESOLVED',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      timestamp: 'Today at 01:40 PM',
      actor: 'Chief Facility Officer (Admin)',
      desc: 'Hydraulic sensor calibrated, 10-point safety test passed. Ticket closed with signed audit entry.',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-violet-100 selection:text-violet-900 font-sans">
      {/* =========================================================================
          1. HERO SECTION: CINEMATIC PHOTOGRAPHIC BACKDROP (STUVÉDA-INSPIRED COMPOSITION)
          ========================================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 max-w-7xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200/90 min-h-[620px] lg:min-h-[720px] lg:max-h-[820px] flex flex-col justify-between">
          {/* High-Resolution Aerial Campus Photographic Background */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105 pointer-events-none"
            style={{
              backgroundImage: "url('/lpu_campus_hero.jpg')",
            }}
          />

          {/* Sophisticated Dark Multi-Layer Gradient Overlays for Supreme Readability */}
          <div className="absolute inset-0 bg-linear-to-r from-slate-950/92 via-slate-950/75 to-slate-900/35 pointer-events-none" />
          <div className="absolute inset-0 bg-linear-to-t from-slate-950/90 via-transparent to-slate-950/30 pointer-events-none" />

          {/* Top Bar: Location Badge & Status Pulse */}
          <div className="relative z-10 p-6 sm:p-10 flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-medium tracking-wide shadow-lg">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Lovely Professional University, Punjab</span>
            </div>

            <div className="flex items-center space-x-3 text-xs font-mono text-slate-300">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/70 backdrop-blur-md border border-slate-700/80">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{healthStatus?.status === 'ok' ? 'API MESH LIVE' : 'CONNECTING...'}</span>
              </span>
              <span className="hidden md:inline text-slate-400">31.2536° N, 75.7032° E</span>
            </div>
          </div>

          {/* Hero Main Content (Headline, Supporting Copy, Form, CTAs) */}
          <div className="relative z-10 px-6 sm:px-10 pb-8 sm:pb-12 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 text-cyan-300 font-mono text-xs tracking-widest uppercase font-semibold">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Spatial Campus Navigation & Discovery</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] text-white">
              Explore Your Campus{' '}
              <span className="bg-linear-to-r from-violet-300 via-indigo-200 to-cyan-300 bg-clip-text text-transparent">
                Like Never Before.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-normal max-w-2xl drop-shadow-xs">
              The centralized spatial intelligence and facility governance ecosystem for Lovely Professional University. Seamlessly locate academic blocks, access verified operating schedules, and track campus maintenance in real time.
            </p>

            {/* Interactive Campus Search Bar Form */}
            <form onSubmit={handleSearchSubmit} className="pt-2">
              <div className="bg-white/10 backdrop-blur-xl border border-white/25 rounded-2xl p-2 sm:p-2.5 shadow-2xl flex flex-col sm:flex-row items-center gap-2 max-w-2xl">
                <div className="flex items-center w-full px-3 gap-2">
                  <Search className="w-5 h-5 text-cyan-300 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search facilities, blocks, libraries, stadiums..."
                    className="w-full bg-transparent text-white placeholder-white/70 text-sm sm:text-base focus:outline-hidden"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
                >
                  <span>Search</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Search Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-3 text-xs text-slate-300">
                <span className="text-slate-400 font-medium">Popular:</span>
                {['Central Library', 'Block 37', 'Indoor Sports Complex', 'UniMall Plaza', 'Block 38'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleQuickTagClick(tag)}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all text-[11px] cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </form>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/facilities"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm shadow-xl transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Compass className="w-4 h-4 text-violet-600" />
                <span>Explore Campus</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {!isAuthenticated ? (
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm border border-white/20 backdrop-blur-md transition-all cursor-pointer"
                >
                  <span>Get Started</span>
                </Link>
              ) : (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm border border-white/20 backdrop-blur-md transition-all cursor-pointer"
                >
                  <span>Go to My Dashboard</span>
                </Link>
              )}
            </div>
          </div>

          {/* Floating Location Markers Over The Campus Aerial Photograph */}
          {/* Marker 1: Central Library */}
          <div className="hidden lg:flex absolute top-[28%] right-[24%] z-20 animate-fade-in">
            <Link
              to="/facilities"
              className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-white/20 text-white shadow-2xl hover:scale-105 transition-transform"
            >
              <div className="w-7 h-7 rounded-xl bg-violet-600 flex items-center justify-center text-white">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold leading-tight">Central Library</span>
                <span className="block text-[10px] text-cyan-300 font-mono">Block 37 • Open Today</span>
              </div>
            </Link>
          </div>

          {/* Marker 2: Indoor Sports Complex */}
          <div className="hidden lg:flex absolute top-[44%] right-[8%] z-20 animate-fade-in">
            <Link
              to="/facilities"
              className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-white/20 text-white shadow-2xl hover:scale-105 transition-transform"
            >
              <div className="w-7 h-7 rounded-xl bg-cyan-600 flex items-center justify-center text-white">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold leading-tight">Indoor Sports Complex</span>
                <span className="block text-[10px] text-emerald-300 font-mono">Shanti Devi Stadium</span>
              </div>
            </Link>
          </div>

          {/* Marker 3: GPS Telemetry Badge */}
          <div className="hidden xl:flex absolute bottom-8 right-10 z-20 items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/70 backdrop-blur-md border border-white/15 text-[11px] font-mono text-slate-300">
            <Radio className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
            <span>OpenStreetMap Calibrated • 600+ Acres Bounded</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. BELOW HERO: ELEGANT COMPACT STATISTICS STRIP
          ========================================================================= */}
      <section className="border-y border-slate-200/90 bg-slate-50/70 py-8 mb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <span className="block text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                600+
              </span>
              <span className="text-xs sm:text-sm font-medium text-slate-600">Acres Digitized</span>
              <span className="block text-[11px] text-slate-400 font-mono">Full university spatial footprint</span>
            </div>

            <div className="space-y-1">
              <span className="block text-3xl sm:text-4xl font-extrabold text-violet-700 tracking-tight">
                11
              </span>
              <span className="text-xs sm:text-sm font-medium text-slate-600">Verified Categories</span>
              <span className="block text-[11px] text-slate-400 font-mono">Classified campus facility groups</span>
            </div>

            <div className="space-y-1">
              <span className="block text-3xl sm:text-4xl font-extrabold text-cyan-700 tracking-tight">
                100%
              </span>
              <span className="text-xs sm:text-sm font-medium text-slate-600">Audit Transparency</span>
              <span className="block text-[11px] text-slate-400 font-mono">End-to-end incident report tracking</span>
            </div>

            <div className="space-y-1">
              <span className="block text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                3
              </span>
              <span className="text-xs sm:text-sm font-medium text-slate-600">Integrated Portals</span>
              <span className="block text-[11px] text-slate-400 font-mono">Student, Faculty, & Admin hubs</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. CAMPUS EXPLORATION & FACILITY DIRECTORY SHOWCASE
          ========================================================================= */}
      <section id="directory" className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-semibold">
              <Building2 className="w-3.5 h-3.5 text-cyan-600" />
              <span>Campus Taxonomy Ledger</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Instant Discovery Across Campus
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Every lecture hall, food plaza, sports facility, and administrative wing cataloged with precise door coordinates, current operating hours, and floor numbers.
            </p>
          </div>

          {/* Taxonomy Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: 'ALL', label: 'All Facilities' },
              { key: 'ACADEMIC', label: 'Academic & Labs' },
              { key: 'SPORTS', label: 'Sports & Fitness' },
              { key: 'COMMERCIAL', label: 'Food & Commercial' },
              { key: 'SERVICES', label: 'Auditoriums & Services' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveCategoryFilter(tab.key)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeCategoryFilter === tab.key
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                    : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Facility Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFacilities.map((fac) => (
            <div
              key={fac.id}
              className="rounded-2xl bg-white border border-slate-200/90 hover:border-violet-400 p-6 transition-all duration-200 shadow-xs hover:shadow-xl hover:shadow-violet-950/5 group flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                    {fac.categoryLabel}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-700 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {fac.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-violet-700 transition-colors">
                    {fac.name}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 font-mono">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{fac.block}</span>
                    <span>•</span>
                    <span>{fac.floor}</span>
                  </p>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {fac.specs}
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">{fac.hours}</span>
                <Link
                  to="/facilities"
                  className="inline-flex items-center gap-1 text-violet-600 hover:text-violet-700 font-semibold transition-colors"
                >
                  <span>Locate</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          4. ASYMMETRIC BENTO FEATURE SHOWCASE
          ========================================================================= */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-100">
        <div className="space-y-4 mb-16 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 text-violet-600" />
            <span>Engineered Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Built for Institutional Scale
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Replacing obsolete paper maps and fragmented directories with a unified, audit-locked GIS operations suite.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bento Card 1 (Span 2 cols): Precision GIS Engine */}
          <div className="lg:col-span-2 rounded-3xl bg-linear-to-br from-violet-50/40 via-white to-slate-50 border border-slate-200/90 p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden group shadow-xs">
            <div className="space-y-4 max-w-xl relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-700">
                <Navigation className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-violet-700">
                Core Pillar 01 // Spatial Intelligence
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Precision OpenStreetMap GIS Mapping
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Every building coordinate is mathematically bounded to the Lovely Professional University geographic perimeter (31.24°–31.26° N, 75.69°–75.72° E). Includes interactive pan/zoom, custom vector pin markers, and real-time route path rendering.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs text-slate-600 relative z-10">
              <div>
                <span className="block text-slate-400 text-[10px] uppercase">Calibration</span>
                <span className="text-slate-900 font-semibold">0.5m GPS Accuracy</span>
              </div>
              <div>
                <span className="block text-slate-400 text-[10px] uppercase">Bounding Engine</span>
                <span className="text-slate-900 font-semibold">LPU Geographic Clamp</span>
              </div>
              <div>
                <span className="block text-slate-400 text-[10px] uppercase">Library</span>
                <span className="text-slate-900 font-semibold">Leaflet + GeoJSON</span>
              </div>
            </div>
          </div>

          {/* Bento Card 2 (Span 1 col): Hierarchical Taxonomies */}
          <div className="rounded-3xl bg-white border border-slate-200/90 p-8 flex flex-col justify-between relative overflow-hidden group shadow-xs">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700">
                <Layers className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-cyan-800">
                Core Pillar 02 // Categorization
              </span>
              <h3 className="text-2xl font-bold text-slate-900">
                11 Verified Facility Taxonomies
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                From high-security academic laboratories to dining plazas, sports grounds, and ATM kiosks. Managed with relational category deletion protection to safeguard active campus facilities.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 space-y-2 text-xs">
              {['Academic Blocks & Research', 'Athletics & Stadia', 'Healthcare & Dining'].map(
                (item, i) => (
                  <div key={i} className="flex items-center gap-2 text-slate-600">
                    <Check className="w-3.5 h-3.5 text-cyan-600" />
                    <span>{item}</span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Bento Card 3 (Span 1 col): Role-Based Cryptographic Access */}
          <div className="rounded-3xl bg-white border border-slate-200/90 p-8 flex flex-col justify-between relative overflow-hidden group shadow-xs">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-emerald-800">
                Core Pillar 03 // Authorization
              </span>
              <h3 className="text-2xl font-bold text-slate-900">
                Tri-Role Institutional Security
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Cryptographically separated portals for Students, Faculty, and University Administrators powered by JWT token rotation, blacklisting, and server-side RBAC validation.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-600">
                <span>Student Portal</span>
                <span className="text-emerald-700 font-semibold">Browse & Report</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Faculty Console</span>
                <span className="text-sky-700 font-semibold">Triage & Resolve</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Admin Authority</span>
                <span className="text-violet-700 font-semibold">Full CRUD Governance</span>
              </div>
            </div>
          </div>

          {/* Bento Card 4 (Span 2 cols): Incident Governance State Machine */}
          <div className="lg:col-span-2 rounded-3xl bg-linear-to-br from-cyan-50/40 via-white to-slate-50 border border-slate-200/90 p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden group shadow-xs">
            <div className="space-y-4 max-w-xl relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-amber-800">
                Core Pillar 04 // Maintenance Ops
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Audit-Locked Issue Reporting State Machine
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Encounter broken equipment or closed facilities? Students submit geolocated tickets in seconds. Staff and administrators manage lifecycle transitions with an immutable audit log, resolution notes, and status verification.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap items-center gap-3 text-xs font-mono relative z-10">
              <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                PENDING ➔ IN PROGRESS ➔ RESOLVED
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-700">Automatic Timestamp Verification</span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-700 font-medium">Strict Non-Admin Edit Protection</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. ISSUE REPORTING & LIFECYCLE TRACKING SHOWCASE
          ========================================================================= */}
      <section className="py-20 bg-slate-50/80 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
              <FileCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Transparent Maintenance Pipeline</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              From Broken Elevator to Verified Resolution
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Click through the lifecycle stages below to see how campus defect reports are captured, triaged, and transparently verified by university staff.
            </p>
          </div>

          {/* Interactive Step Simulator */}
          <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl shadow-slate-900/5">
            {/* Step Navigation Buttons */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 mb-8">
              {reportStages.map((stage) => (
                <button
                  key={stage.step}
                  onClick={() => setActiveReportStep(stage.step)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center ${
                    activeReportStep === stage.step
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/25'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="hidden sm:inline">Stage 0{stage.step + 1}: </span>
                  <span>{stage.badge}</span>
                </button>
              ))}
            </div>

            {/* Simulated Live Ticket Card */}
            <div className="rounded-2xl bg-slate-50/90 border border-slate-200 p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div className="space-y-1">
                  <span className="text-xs font-mono text-slate-500">
                    TICKET #CPX-2026-0842 // BLOCK 37
                  </span>
                  <h3 className="text-xl font-bold text-slate-900">
                    Elevator 2 Sensor Fault — Central Library
                  </h3>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${reportStages[activeReportStep].badgeClass}`}
                >
                  STATUS: {reportStages[activeReportStep].badge}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1 shadow-2xs">
                  <span className="text-slate-500 block">Logged Time & Audit Anchor</span>
                  <span className="text-slate-900 font-semibold">
                    {reportStages[activeReportStep].timestamp}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1 shadow-2xs">
                  <span className="text-slate-500 block">Current Action Authority</span>
                  <span className="text-violet-700 font-semibold">
                    {reportStages[activeReportStep].actor}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block">
                  Operational Log Update
                </span>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
                  {reportStages[activeReportStep].desc}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. HOW CAMPUSXPLORE WORKS — THE VISUAL JOURNEY
          ========================================================================= */}
      <section id="how-it-works" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-semibold">
            <Compass className="w-3.5 h-3.5 text-cyan-600" />
            <span>User Journey</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Three Steps to Frictionless Campus Mobility
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Designed for incoming freshmen, 30,000+ enrolled students, faculty researchers, and campus operations teams.
          </p>
        </div>

        {/* 3-Step Journey Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Step 1 */}
          <div className="rounded-3xl bg-white border border-slate-200 p-8 space-y-6 relative hover:border-violet-300 shadow-sm hover:shadow-lg transition-all">
            <div className="w-12 h-12 rounded-2xl bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-700 font-mono font-bold text-lg">
              01
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">Search & Filter</h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Enter any building block (e.g., Block 37, Block 38), department name, ATM kiosk, or food plaza. Instant keyword matching filters through all 11 taxonomy groups.
              </p>
            </div>
            <div className="pt-2 text-xs font-mono text-violet-700 font-semibold flex items-center gap-1">
              <span>Instant Auto-Complete</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Step 2 */}
          <div className="rounded-3xl bg-white border border-slate-200 p-8 space-y-6 relative hover:border-violet-300 shadow-sm hover:shadow-lg transition-all">
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700 font-mono font-bold text-lg">
              02
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">Locate & Inspect</h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Pinpoint exact building entrances on high-resolution OpenStreetMap tiles. Confirm live opening schedules, floor directories, and department emergency extensions before heading out.
              </p>
            </div>
            <div className="pt-2 text-xs font-mono text-cyan-700 font-semibold flex items-center gap-1">
              <span>Sub-Meter GPS Bounds</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Step 3 */}
          <div className="rounded-3xl bg-white border border-slate-200 p-8 space-y-6 relative hover:border-violet-300 shadow-sm hover:shadow-lg transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-mono font-bold text-lg">
              03
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">Report & Resolve</h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Encounter equipment failures or facility issues? Snap a photo, file a ticket in under 30 seconds, and receive transparent updates as university maintenance resolves it.
              </p>
            </div>
            <div className="pt-2 text-xs font-mono text-emerald-700 font-semibold flex items-center gap-1">
              <span>Guaranteed Audit Trail</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. INSTITUTIONAL STORY & TECHNICAL STACK SPEC
          ========================================================================= */}
      <section id="about" className="py-20 border-t border-slate-200 bg-slate-50/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Institutional Story */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                <span>Capstone Engineering Initiative</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Engineered for Lovely Professional University
              </h2>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                With a university footprint spanning more than 600 acres in Phagwara, Punjab, accommodating over 30,000 students and 5,000 faculty, finding lecture halls and navigating facilities presents daily spatial friction.
              </p>

              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                CampusXplore was engineered as a final-year B.Tech capstone project to demonstrate how modern web GIS architecture (Django REST Framework, PostgreSQL, and React) can replace legacy static campus maps with an interactive, verified spatial platform with cryptographic security and role accountability.
              </p>

              <div className="flex flex-wrap gap-6 pt-2 font-mono text-xs text-slate-600">
                <div>
                  <span className="block text-2xl font-bold text-slate-900 font-sans">600+</span>
                  <span className="text-slate-400">Acres Bounded</span>
                </div>
                <div>
                  <span className="block text-2xl font-bold text-violet-700 font-sans">11</span>
                  <span className="text-slate-400">Facility Taxonomies</span>
                </div>
                <div>
                  <span className="block text-2xl font-bold text-cyan-700 font-sans">100%</span>
                  <span className="text-slate-400">Audit Transparency</span>
                </div>
              </div>
            </div>

            {/* Technical Stack Architecture Card */}
            <div className="lg:col-span-5 rounded-3xl bg-white border border-slate-200 p-7 shadow-xl shadow-slate-900/5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-violet-700 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-violet-600" />
                  <span>Technical Architecture</span>
                </span>
                <span className="text-[11px] font-mono text-emerald-700 font-semibold">Production Ready</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Backend API Framework</span>
                  <span className="font-semibold text-slate-800">Django 5.2 + DRF</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Relational Database</span>
                  <span className="font-semibold text-slate-800">PostgreSQL 18</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Frontend Client</span>
                  <span className="font-semibold text-slate-800">React 19 + Vite + Tailwind</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">GIS & Cartography Engine</span>
                  <span className="font-semibold text-slate-800">Leaflet + OpenStreetMap</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Authentication Protocol</span>
                  <span className="font-semibold text-slate-800">JWT Token Rotation & RBAC</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. CLOSING CALL TO ACTION
          ========================================================================= */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-900 text-white border border-slate-800 p-10 sm:p-16 text-center relative overflow-hidden shadow-2xl">
          {/* Ambient Radial Spotlight */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.35),transparent_70%)] pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-violet-300 text-xs font-semibold">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ready to Explore?</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Step Onto Campus with Complete Confidence
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Join students and faculty across Lovely Professional University in discovering facilities, locating lecture halls, and tracking campus maintenance in real time.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                to={isAuthenticated ? '/dashboard' : '/login'}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-violet-600/30 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <span>{isAuthenticated ? 'Open My Dashboard' : 'Sign In to Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {!isAuthenticated && (
                <Link
                  to="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-colors"
                >
                  <span>Create Student Account</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
