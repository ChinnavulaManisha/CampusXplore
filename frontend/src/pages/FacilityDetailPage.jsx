import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Phone, Building2, Navigation, AlertTriangle, Map as MapIcon } from 'lucide-react';
import facilityService from '../services/facilityService';
import CampusMap from '../components/map/CampusMap';
import Badge from '../components/common/Badge';
import Spinner from '../components/common/Spinner';
import Button from '../components/common/Button';

export default function FacilityDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const cameFromMap = location.state?.fromMap;
  const mapSearch = location.state?.mapSearch;
  const [facility, setFacility] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore complete map query while preserving facility highlight
  const returnToMapUrl = React.useMemo(() => {
    if (!cameFromMap) return '/facilities';
    const params = new URLSearchParams(mapSearch ? mapSearch.replace(/^\?/, '') : '');
    if (facility?.id) {
      params.set('facility', String(facility.id));
    }
    const qs = params.toString();
    return qs ? `/map?${qs}` : '/map';
  }, [cameFromMap, mapSearch, facility]);

  useEffect(() => {
    let isMounted = true;

    facilityService
      .getFacilityById(id)
      .then((data) => {
        if (isMounted) setFacility(data);
      })
      .catch((err) => {
        if (isMounted) {
          if (err.response?.status === 404) {
            setError('This facility could not be found or is currently inactive.');
          } else {
            setError(err.response?.data?.detail || 'Failed to load facility information.');
          }
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8">
        <Spinner size="lg" />
        <p className="mt-4 text-sm text-slate-500 font-medium">Fetching facility coordinates...</p>
      </div>
    );
  }

  if (error || !facility) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-14 h-14 mx-auto rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">Facility Unavailable</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {error || 'Unable to retrieve location details for this facility.'}
          </p>
        </div>
        <Link to="/facilities">
          <Button variant="secondary" icon={ArrowLeft} size="sm">
            Back to Facilities Directory
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-left w-full">
      {/* Back button */}
      <div>
        <Link
          to={returnToMapUrl}
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{cameFromMap ? 'Back to Campus Map' : 'Back to Directory'}</span>
        </Link>
      </div>

      {/* Main Facility Details Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Banner Header */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-900 to-indigo-950 text-white space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-bold text-indigo-300 bg-indigo-900/60 px-3 py-1 rounded-full border border-indigo-700/50">
              {facility.category?.name || 'Campus Spot'}
            </span>

            <div className="flex items-center gap-2">
              {facility.is_active ? (
                <Badge variant="success" size="sm">Active Facility</Badge>
              ) : (
                <Badge variant="warning" size="sm">Inactive (Soft-Deleted)</Badge>
              )}
              {facility.is_active && (
                <Link
                  to={`/reports/new?facility=${facility.id}`}
                  state={{ fromFacility: facility.id }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/30 transition-colors"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Report Issue</span>
                </Link>
              )}
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {facility.name}
          </h1>

          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span className="font-medium">{facility.building}</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">About Facility</h3>
            <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
              {facility.description || 'No detailed operational description provided for this campus facility.'}
            </p>
          </div>

          {/* Quick Specifications Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Operating Schedule</span>
              </div>
              <p className="text-sm font-semibold text-slate-900">
                {facility.opening_hours || 'Schedule not published'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase">
                <Phone className="w-4 h-4 text-indigo-600" />
                <span>Contact Department</span>
              </div>
              <p className="text-sm font-semibold text-slate-900">
                {facility.contact_number || 'No contact listed'}
              </p>
            </div>
          </div>

          {/* Geographical Coordinates & Mini-Map */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-indigo-600" />
                <span>Campus Map Positioning</span>
              </h3>
              {facility.latitude && facility.longitude && (
                <Link
                  to={`/map?facility=${facility.id}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span>View on Interactive Map</span>
                </Link>
              )}
            </div>

            {facility.latitude && facility.longitude ? (
              <div className="space-y-3">
                {/* Embedded Mini-Map */}
                <div className="rounded-xl overflow-hidden border border-slate-200 shadow-xs">
                  <CampusMap
                    facilities={[facility]}
                    isMiniMap={true}
                    height="260px"
                    initialCenter={[parseFloat(facility.latitude), parseFloat(facility.longitude)]}
                    initialZoom={17}
                  />
                </div>

                {/* Numerical GPS Details and Google Maps Link */}
                <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-900">
                      GPS Coordinates: {facility.latitude}, {facility.longitude}
                    </div>
                    <div className="text-slate-500">
                      Validated within campus boundaries (-90° to 90° Lat, -180° to 180° Lon).
                    </div>
                  </div>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${facility.latitude},${facility.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-indigo-200 text-indigo-700 font-semibold shadow-2xs hover:bg-indigo-50"
                  >
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    <span>External Maps</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                Physical GPS coordinates not yet registered for this facility.
              </div>
            )}
          </div>

          {/* Facility Issue Reporting Action Banner */}
          {facility.is_active && (
            <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Observed a problem with this facility?</span>
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Help keep campus facilities operating smoothly. Submit a maintenance, cleanliness, water, electrical, or equipment report.
                </p>
              </div>
              <Link
                to={`/reports/new?facility=${facility.id}`}
                state={{ fromFacility: facility.id }}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Report Issue</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
