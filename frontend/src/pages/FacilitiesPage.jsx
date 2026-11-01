import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Building2, Filter, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import facilityService from '../services/facilityService';
import FacilityCard from '../components/facilities/FacilityCard';
import FacilitySkeleton from '../components/facilities/FacilitySkeleton';
import CategoryPill from '../components/facilities/CategoryPill';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';

export default function FacilitiesPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [facilities, setFacilities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state synced with searchParams
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const selectedCategory = searchParams.get('category') || '';
  const searchKeyword = searchParams.get('search') || '';
  const buildingFilter = searchParams.get('building') || '';
  const activeFilter = searchParams.get('is_active') || '';

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

  // Fetch facilities
  useEffect(() => {
    let isMounted = true;

    facilityService
      .getFacilities({
        page: currentPage,
        pageSize: 9,
        category: selectedCategory || undefined,
        building: buildingFilter || undefined,
        search: searchKeyword || undefined,
        isActive: user?.role === 'ADMIN' && activeFilter !== '' ? activeFilter : undefined,
      })
      .then((data) => {
        if (isMounted) {
          setFacilities(data.results || []);
          setTotalCount(data.count || 0);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(
            err.response?.data?.detail ||
              'Failed to load facilities from campus API. Please try again.'
          );
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentPage, selectedCategory, buildingFilter, searchKeyword, activeFilter, user]);

  // Update query params helper
  const updateFilter = (key, value) => {
    setIsLoading(true);
    const nextParams = new URLSearchParams(searchParams);
    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }
    // Reset to page 1 on filter changes
    if (key !== 'page') {
      nextParams.set('page', '1');
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

  const totalPages = Math.ceil(totalCount / 9) || 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-left w-full">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Campus Facilities Directory
        </h1>
        <p className="text-sm text-slate-500">
          Search and discover buildings, service points, and study halls across Lovely Professional University.
        </p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

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
                placeholder="Filter building (e.g. Block 34)..."
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

      {/* Facilities Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <FacilitySkeleton key={i} />
          ))}
        </div>
      ) : facilities.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Showing {facilities.length} of {totalCount} campus facilities
            </span>
            <span>
              Page {currentPage} of {totalPages}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {facilities.map((facility) => (
              <FacilityCard key={facility.id} facility={facility} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-6 border-t border-slate-200">
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => updateFilter('page', String(currentPage - 1))}
                icon={ChevronLeft}
              >
                Previous
              </Button>

              <span className="text-xs font-semibold text-slate-700 px-3">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => updateFilter('page', String(currentPage + 1))}
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      ) : (
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
      )}
    </div>
  );
}
