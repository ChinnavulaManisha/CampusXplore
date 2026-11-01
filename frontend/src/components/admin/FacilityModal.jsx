import React, { useState, useEffect } from 'react';
import { X, Building2 } from 'lucide-react';
import Button from '../common/Button';
import Alert from '../common/Alert';

export default function FacilityModal({
  isOpen,
  onClose,
  onSuccess,
  facility = null,
  categories = [],
  facilityService,
}) {
  const isEditing = Boolean(facility);

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [building, setBuilding] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (facility) {
      setName(facility.name || '');
      setCategoryId(facility.category?.id ? String(facility.category.id) : '');
      setBuilding(facility.building || '');
      setDescription(facility.description || '');
      setLatitude(facility.latitude !== null && facility.latitude !== undefined ? String(facility.latitude) : '');
      setLongitude(facility.longitude !== null && facility.longitude !== undefined ? String(facility.longitude) : '');
      setOpeningHours(facility.opening_hours || '');
      setContactNumber(facility.contact_number || '');
      setIsActive(facility.is_active !== undefined ? facility.is_active : true);
    } else {
      setName('');
      setCategoryId(categories.length > 0 ? String(categories[0].id) : '');
      setBuilding('');
      setDescription('');
      setLatitude('');
      setLongitude('');
      setOpeningHours('');
      setContactNumber('');
      setIsActive(true);
    }
    setError(null);
    setValidationErrors({});
  }, [facility, categories, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Facility name is required.';
    if (!categoryId) errs.categoryId = 'Please select a category.';
    if (!building.trim()) errs.building = 'Building identifier is required (e.g. Block 34).';

    if (latitude && (isNaN(Number(latitude)) || Number(latitude) < -90 || Number(latitude) > 90)) {
      errs.latitude = 'Latitude must be between -90 and 90.';
    }
    if (longitude && (isNaN(Number(longitude)) || Number(longitude) < -180 || Number(longitude) > 180)) {
      errs.longitude = 'Longitude must be between -180 and 180.';
    }

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const payload = {
      name: name.trim(),
      category_id: parseInt(categoryId, 10),
      building: building.trim(),
      description: description.trim(),
      opening_hours: openingHours.trim(),
      contact_number: contactNumber.trim(),
      is_active: isActive,
    };

    if (latitude.trim()) payload.latitude = Number(latitude.trim());
    if (longitude.trim()) payload.longitude = Number(longitude.trim());

    try {
      if (isEditing) {
        await facilityService.updateFacility(facility.id, payload);
      } else {
        await facilityService.createFacility(payload);
      }
      onSuccess(isEditing ? 'Facility updated successfully.' : 'Facility created successfully.');
      onClose();
    } catch (err) {
      console.error('Facility save failed:', err);
      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data === 'object' && !data.detail) {
          const fieldErrs = {};
          Object.keys(data).forEach((key) => {
            const val = data[key];
            fieldErrs[key] = Array.isArray(val) ? val.join(' ') : String(val);
          });
          setValidationErrors(fieldErrs);
          setError('Please resolve the highlighted form errors.');
        } else {
          setError(data.detail || 'Failed to save facility.');
        }
      } else {
        setError('Network connectivity error. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 text-left">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              {isEditing ? `Edit Facility: ${facility.name}` : 'Add New Campus Facility'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Facility Name */}
            <div className="space-y-1 sm:col-span-2">
              <label htmlFor="facilityName" className="block text-xs font-semibold text-slate-700">
                Facility Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="facilityName"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (validationErrors.name) setValidationErrors((p) => ({ ...p, name: undefined }));
                }}
                placeholder="e.g. Central Library Reading Hall"
                className={`w-full px-3 py-2 text-sm rounded-lg border bg-white focus:outline-hidden focus:ring-2 ${
                  validationErrors.name
                    ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20'
                    : 'border-slate-300 focus:ring-indigo-500'
                }`}
              />
              {validationErrors.name && (
                <p className="text-xs text-rose-600 font-medium">{validationErrors.name}</p>
              )}
            </div>

            {/* Category Select */}
            <div className="space-y-1">
              <label htmlFor="facilityCat" className="block text-xs font-semibold text-slate-700">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                id="facilityCat"
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  if (validationErrors.categoryId) setValidationErrors((p) => ({ ...p, categoryId: undefined }));
                }}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Choose Category --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {validationErrors.categoryId && (
                <p className="text-xs text-rose-600 font-medium">{validationErrors.categoryId}</p>
              )}
            </div>

            {/* Building */}
            <div className="space-y-1">
              <label htmlFor="facilityBuilding" className="block text-xs font-semibold text-slate-700">
                Building / Block <span className="text-rose-500">*</span>
              </label>
              <input
                id="facilityBuilding"
                type="text"
                value={building}
                onChange={(e) => {
                  setBuilding(e.target.value);
                  if (validationErrors.building) setValidationErrors((p) => ({ ...p, building: undefined }));
                }}
                placeholder="e.g. Block 34, 2nd Floor"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              {validationErrors.building && (
                <p className="text-xs text-rose-600 font-medium">{validationErrors.building}</p>
              )}
            </div>

            {/* Latitude */}
            <div className="space-y-1">
              <label htmlFor="facilityLat" className="block text-xs font-semibold text-slate-700">
                Latitude (GPS)
              </label>
              <input
                id="facilityLat"
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => {
                  setLatitude(e.target.value);
                  if (validationErrors.latitude) setValidationErrors((p) => ({ ...p, latitude: undefined }));
                }}
                placeholder="e.g. 31.2530"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              {validationErrors.latitude && (
                <p className="text-xs text-rose-600 font-medium">{validationErrors.latitude}</p>
              )}
            </div>

            {/* Longitude */}
            <div className="space-y-1">
              <label htmlFor="facilityLng" className="block text-xs font-semibold text-slate-700">
                Longitude (GPS)
              </label>
              <input
                id="facilityLng"
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => {
                  setLongitude(e.target.value);
                  if (validationErrors.longitude) setValidationErrors((p) => ({ ...p, longitude: undefined }));
                }}
                placeholder="e.g. 75.7040"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              {validationErrors.longitude && (
                <p className="text-xs text-rose-600 font-medium">{validationErrors.longitude}</p>
              )}
            </div>

            {/* Opening Hours */}
            <div className="space-y-1">
              <label htmlFor="facilityHours" className="block text-xs font-semibold text-slate-700">
                Opening Hours
              </label>
              <input
                id="facilityHours"
                type="text"
                value={openingHours}
                onChange={(e) => setOpeningHours(e.target.value)}
                placeholder="e.g. 08:00 AM - 08:00 PM"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Contact Number */}
            <div className="space-y-1">
              <label htmlFor="facilityContact" className="block text-xs font-semibold text-slate-700">
                Contact Number / Extension
              </label>
              <input
                id="facilityContact"
                type="text"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="e.g. +91 1824 517000"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Description */}
            <div className="space-y-1 sm:col-span-2">
              <label htmlFor="facilityDesc" className="block text-xs font-semibold text-slate-700">
                Description
              </label>
              <textarea
                id="facilityDesc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Key equipment, seating capacity, or floor directions..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Active Status Toggle */}
            <div className="sm:col-span-2 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Operational Status</span>
                <span className="text-[11px] text-slate-500">
                  {isActive
                    ? 'Active (Visible to students and faculty across directory and map)'
                    : 'Inactive (Soft-deleted: hidden from students and faculty)'}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="secondary" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
              {isEditing ? 'Save Changes' : 'Create Facility'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
