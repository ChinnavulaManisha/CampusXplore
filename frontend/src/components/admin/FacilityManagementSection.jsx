import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Edit2,
  PowerOff,
  Power,
  ExternalLink,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import facilityService from '../../services/facilityService';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import Alert from '../common/Alert';
import FacilityModal from './FacilityModal';

export default function FacilityManagementSection({ onMetricUpdate }) {
  const [facilities, setFacilities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all'); // 'all', 'true', 'false'
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  // Modals & Action States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState(null);
  const [statusChangingId, setStatusChangingId] = useState(null);

  // Confirmation dialog for deactivation
  const [deactivatingFacility, setDeactivatingFacility] = useState(null);

  // Fetch Categories for Filter & Modal
  const loadCategories = useCallback(async () => {
    try {
      const cats = await facilityService.getCategories();
      setCategories(cats || []);
    } catch (err) {
      console.error('Failed to load categories for facility management:', err);
    }
  }, []);

  // Fetch Facilities
  const loadFacilities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        pageSize,
      };
      if (search.trim()) params.search = search.trim();
      if (selectedCategory) params.category = selectedCategory;
      if (selectedStatus === 'true') params.isActive = true;
      if (selectedStatus === 'false') params.isActive = false;

      const data = await facilityService.getFacilities(params);
      setFacilities(data.results || []);
      setTotalCount(data.count || 0);
    } catch (err) {
      console.error('Failed to load facilities:', err);
      setError('Failed to load campus facilities. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, selectedCategory, selectedStatus]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadFacilities();
  }, [loadFacilities]);

  const handleOpenAdd = () => {
    setEditingFacility(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (fac) => {
    setEditingFacility(fac);
    setIsModalOpen(true);
  };

  const handleModalSuccess = (msg) => {
    setSuccessMessage(msg);
    loadFacilities();
    if (onMetricUpdate) onMetricUpdate();
  };

  // Toggle operational status (Deactivate / Reactivate)
  const handleToggleStatus = async (fac) => {
    if (fac.is_active) {
      // Prompt confirmation before deactivating
      setDeactivatingFacility(fac);
    } else {
      // Reactivate directly
      setStatusChangingId(fac.id);
      try {
        await facilityService.updateFacility(fac.id, { is_active: true });
        setSuccessMessage(`Facility "${fac.name}" has been reactivated.`);
        loadFacilities();
        if (onMetricUpdate) onMetricUpdate();
      } catch (err) {
        console.error('Failed to reactivate facility:', err);
        setError('Failed to reactivate facility. Please try again.');
      } finally {
        setStatusChangingId(null);
      }
    }
  };

  const confirmDeactivate = async () => {
    if (!deactivatingFacility) return;
    setStatusChangingId(deactivatingFacility.id);
    try {
      await facilityService.deleteFacility(deactivatingFacility.id);
      setSuccessMessage(`Facility "${deactivatingFacility.name}" deactivated (soft-deleted).`);
      setDeactivatingFacility(null);
      loadFacilities();
      if (onMetricUpdate) onMetricUpdate();
    } catch (err) {
      console.error('Failed to deactivate facility:', err);
      setError('Failed to deactivate facility.');
    } finally {
      setStatusChangingId(null);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6 text-left">
      {/* Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <span>Facility Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Create, update, inspect details, and toggle operational status for campus facilities.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadFacilities();
              loadCategories();
            }}
            disabled={loading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Facility</span>
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <Alert type="success" message={successMessage} onClose={() => setSuccessMessage(null)} />
      )}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Search Input */}
        <div className="sm:col-span-5 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by facility name or building..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Category Filter */}
        <div className="sm:col-span-4 relative">
          <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 appearance-none"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="sm:col-span-3">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Facilities Table */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-3">
          <Spinner size="lg" />
          <p className="text-xs text-slate-500">Loading facility records...</p>
        </div>
      ) : facilities.length === 0 ? (
        <div className="py-12 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 space-y-2">
          <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">No facilities found</p>
          <p className="text-xs text-slate-500">
            {search || selectedCategory || selectedStatus !== 'all'
              ? 'Try adjusting your filters or search keywords.'
              : 'Get started by creating your first campus facility.'}
          </p>
          {(search || selectedCategory || selectedStatus !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('');
                setSelectedStatus('all');
                setCurrentPage(1);
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline"
            >
              Reset all filters
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Facility Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Location / Building</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {facilities.map((fac) => (
                <tr key={fac.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{fac.name}</div>
                    {fac.description && (
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">
                        {fac.description}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
                      {fac.category?.name || 'Unassigned'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    <div>{fac.building}</div>
                    {fac.latitude && fac.longitude && (
                      <div className="text-[10px] text-slate-400">
                        {Number(fac.latitude).toFixed(4)}, {Number(fac.longitude).toFixed(4)}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    {fac.is_active ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* View Link */}
                      <Link
                        to={`/facilities/${fac.id}`}
                        title="View Facility Details"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(fac)}
                        title="Edit Facility"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Deactivate / Reactivate Toggle */}
                      {fac.is_active ? (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(fac)}
                          disabled={statusChangingId === fac.id}
                          title="Deactivate Facility"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          {statusChangingId === fac.id ? (
                            <Spinner size="xs" />
                          ) : (
                            <PowerOff className="w-4 h-4 text-rose-500" />
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(fac)}
                          disabled={statusChangingId === fac.id}
                          title="Reactivate Facility"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                        >
                          {statusChangingId === fac.id ? (
                            <Spinner size="xs" />
                          ) : (
                            <Power className="w-4 h-4 text-emerald-500" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {totalCount > pageSize && (
        <div className="flex items-center justify-between pt-2 text-xs text-slate-600">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, totalCount)} of {totalCount} facilities
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1 || loading}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              Previous
            </Button>
            <span className="px-2 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages || loading}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 text-xs"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <FacilityModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingFacility(null);
        }}
        onSuccess={handleModalSuccess}
        facility={editingFacility}
        categories={categories}
        facilityService={facilityService}
      />

      {/* Deactivate Confirmation Modal */}
      {deactivatingFacility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4 text-left">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-full bg-rose-50 border border-rose-100">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Deactivate Facility?</h3>
                <p className="text-xs text-slate-500">Soft-delete operational status</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to deactivate{' '}
              <strong className="text-slate-900">{deactivatingFacility.name}</strong>? It will be
              hidden from students and faculty in the directory and map, but can be reactivated
              at any time.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeactivatingFacility(null)}
                disabled={statusChangingId === deactivatingFacility.id}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={confirmDeactivate}
                isLoading={statusChangingId === deactivatingFacility.id}
                disabled={statusChangingId === deactivatingFacility.id}
              >
                Deactivate
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
