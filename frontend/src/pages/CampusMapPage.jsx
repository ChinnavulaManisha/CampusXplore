import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Building2, Filter, RotateCcw, LayoutGrid, Map as MapIcon, AlertTriangle, Info } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import facilityService from '../services/facilityService';
import CategoryPill from '../components/facilities/CategoryPill';
import CampusMap from '../components/map/CampusMap';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';

/**
 * Validate GPS coordinates against physical boundaries and integrity rules.
 * Rejects null, undefined, empty strings, NaN, non-finite values,
 * coordinates outside physical limits (-90..90 lat, -180..180 lng),
 * and origin clamps (0, 0).
 */
function isValidCoordinate(latitude, longitude) {
  if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
    return false;
  }
  if (typeof latitude === 'string' && latitude.trim() === '') return false;
  if (typeof longitude === 'string' && longitude.trim() === '') return false;

  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  if (lat === 0 && lng === 0) return false;

  return true;
}

export default function CampusMapPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [facilities, setFacilities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isComplete, setIsComplete] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state synced with searchParams
  const selectedCategory = searchParams.get('category') || '';
  const searchKeyword = searchParams.get('search') || '';
  const buildingFilter = searchParams.get('building') || '';
  const activeFilter = searchParams.get('is_active') || '';
  const selectedFacilityId = searchParams.get('facility') || '';

  const [searchInput, setSearchInput] = useState(searchKeyword);
  const [buildingInput, setBuildingInput] = useState(buildingFilter);

  // Synchronize input fields with URL search parameters (browser navigation, resets, external links)
  const [prevSearchKeyword, setPrevSearchKeyword] = useState(searchKeyword);
  const [prevBuildingFilter, setPrevBuildingFilter] = useState(buildingFilter);

  if (prevSearchKeyword !== searchKeyword) {
    setPrevSearchKeyword(searchKeyword);
    setSearchInput(searchKeyword);
  }
  if (prevBuildingFilter !== buildingFilter) {
    setPrevBuildingFilter(buildingFilter);
    setBuildingInput(buildingFilter);
  }

  // Load categories taxonomy
  useEffect(() => {
    let isMounted = true;
    facilityService
      .getCategories()
      .then((data) => {
        if (isMounted) setCategories(data || []);
      })
      .catch((err) => {
        console.error('Failed to load categories:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch all facilities matching filters with sequential pagination
  useEffect(() => {
    let isMounted = true;

    facilityService
      .getAllFacilities({
        category: selectedCategory || undefined,
        building: buildingFilter || undefined,
        search: searchKeyword || undefined,
        isActive: user?.role === 'ADMIN' && activeFilter !== '' ? activeFilter : undefined,
      })
      .then((data) => {
        if (isMounted) {
          setFacilities(data.facilities || []);
          setTotalCount(data.totalCount || 0);
          setIsComplete(data.isComplete);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(
            err.response?.data?.detail ||
              'Failed to load campus facilities for map. Please try again.'
          );
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCategory, buildingFilter, searchKeyword, activeFilter, user]);

  // Update query params helper
  const updateFilter = (key, value) => {
    setIsLoading(true);
    const nextParams = new URLSearchParams(searchParams);
    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }
    // Remove facility highlight on filter change
    if (key !== 'facility') {
      nextParams.delete('facility');
    }
    setSearchParams(nextParams);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateFilter('search', searchInput.trim());
  };

  const handleBuildingSubmit = (e) => {
    e.preventDefault();
    updateFilter('building', buildingInput.trim());
  };

  const handleResetFilters = () => {
    setIsLoading(true);
    setSearchInput('');
    setBuildingInput('');
    setSearchParams(new URLSearchParams());
  };

  const handleSwitchToGrid = () => {
    const paramsString = searchParams.toString();
    navigate(paramsString ? `/facilities?${paramsString}` : '/facilities');
  };

  // Filter facilities with valid coordinates for the map
  const mappedFacilities = facilities.filter((f) => isValidCoordinate(f.latitude, f.longitude));

  const unmappedCount = facilities.length - mappedFacilities.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-left w-full">
      {/* Page Header with Grid/Map View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Interactive Campus Map</span>
          </h1>
          <p className="text-sm text-slate-500">
            Explore facilities, buildings, and navigation markers across Lovely Professional University.
          </p>
        </div>

        {/* View Switcher */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={handleSwitchToGrid}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all cursor-pointer"
            title="Switch to Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Grid View</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white text-indigo-600 shadow-xs border border-slate-200/60 cursor-default"
            aria-current="page"
          >
            <MapIcon className="w-4 h-4" />
            <span>Map View</span>
          </button>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Incomplete Data Warning Banner */}
      {!isComplete && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-800">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold">Notice: Incomplete Map Data.</span> Displaying {facilities.length} of {totalCount} campus facilities. Some pages could not be retrieved from the server.
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* Search Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <form onSubmit={handleSearchSubmit} className="md:col-span-6 flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search facility name or keywords..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
            <Button type="submit" variant="secondary" size="sm">
              Search
            </Button>
          </form>

          <form onSubmit={handleBuildingSubmit} className="md:col-span-4 flex gap-2">
            <div className="relative flex-1">
              <Building2 className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Filter building (e.g. Block 37)..."
                value={buildingInput}
                onChange={(e) => setBuildingInput(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
            <Button type="submit" variant="secondary" size="sm">
              Filter
            </Button>
          </form>

          {/* Admin Active/Inactive Toggle */}
          {user?.role === 'ADMIN' ? (
            <div className="md:col-span-2">
              <select
                value={activeFilter}
                onChange={(e) => updateFilter('is_active', e.target.value)}
                className="w-full py-2 px-3 text-sm rounded-lg border border-indigo-300 bg-indigo-50/50 text-indigo-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="">All States</option>
                <option value="true">Active Only</option>
                <option value="false">Inactive Only</option>
              </select>
            </div>
          ) : (
            <div className="md:col-span-2 flex justify-end">
              {(selectedCategory || searchKeyword || buildingFilter) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  icon={RotateCcw}
                  className="text-xs text-slate-500"
                >
                  Reset
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Category Pills Row */}
        {categories.length > 0 && (
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3" />
              <span>Category:</span>
            </span>

            <CategoryPill
              category={{ name: 'All Categories' }}
              isSelected={!selectedCategory}
              onClick={() => updateFilter('category', '')}
            />

            {categories.map((cat) => {
              const isSelected = selectedCategory === String(cat.id) || selectedCategory === cat.name;
              return (
                <CategoryPill
                  key={cat.id}
                  category={cat}
                  isSelected={isSelected}
                  onClick={() => updateFilter('category', isSelected ? '' : String(cat.id))}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Facilities Count & Unmapped Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2 px-1">
        <span>
          Showing <strong className="text-slate-800">{mappedFacilities.length}</strong> markers on campus map
          {totalCount > 0 && ` (out of ${totalCount} matching facilities)`}
        </span>
        {unmappedCount > 0 && (
          <span className="inline-flex items-center gap-1.5 text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full text-[11px]">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>{unmappedCount} facility without GPS coordinates</span>
          </span>
        )}
      </div>

      {/* Map Content Area */}
      {isLoading ? (
        <div className="w-full h-[600px] bg-slate-100 rounded-2xl border border-slate-200 flex flex-col items-center justify-center space-y-3 animate-pulse">
          <MapIcon className="w-10 h-10 text-slate-300" />
          <span className="text-sm font-medium text-slate-500">Loading campus facilities and coordinates...</span>
        </div>
      ) : facilities.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">No Facilities Match Your Criteria</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search terms, clearing category filters, or browsing all buildings.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleResetFilters} icon={RotateCcw}>
            Clear All Filters
          </Button>
        </div>
      ) : (
        <div className="w-full h-[620px] rounded-2xl overflow-hidden shadow-xs border border-slate-200">
          <CampusMap
            facilities={mappedFacilities}
            selectedFacilityId={selectedFacilityId}
            height="100%"
          />
        </div>
      )}
    </div>
  );
}
