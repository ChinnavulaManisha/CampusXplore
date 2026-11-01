import React, { useState, useEffect } from 'react';
import { X, Layers } from 'lucide-react';
import Button from '../common/Button';
import Alert from '../common/Alert';

export default function CategoryModal({
  isOpen,
  onClose,
  onSuccess,
  category = null,
  facilityService,
}) {
  const isEditing = Boolean(category);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (category) {
      setName(category.name || '');
      setDescription(category.description || '');
    } else {
      setName('');
      setDescription('');
    }
    setError(null);
    setValidationErrors({});
  }, [category, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!name.trim()) {
      errs.name = 'Category name is required.';
    } else if (name.trim().length < 2) {
      errs.name = 'Category name must be at least 2 characters.';
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
      description: description.trim(),
    };

    try {
      if (isEditing) {
        await facilityService.updateCategory(category.id, payload);
      } else {
        await facilityService.createCategory(payload);
      }
      onSuccess(isEditing ? 'Category updated successfully.' : 'Category created successfully.');
      onClose();
    } catch (err) {
      console.error('Category save failed:', err);
      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data === 'object' && !data.detail) {
          const fieldErrs = {};
          Object.keys(data).forEach((key) => {
            const val = data[key];
            fieldErrs[key] = Array.isArray(val) ? val.join(' ') : String(val);
          });
          setValidationErrors(fieldErrs);
          setError('Please resolve the highlighted errors.');
        } else {
          setError(data.detail || 'Failed to save category.');
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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 text-left">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">
              {isEditing ? `Edit Category: ${category.name}` : 'Add Facility Category'}
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
          {/* Category Name */}
          <div className="space-y-1">
            <label htmlFor="catName" className="block text-xs font-semibold text-slate-700">
              Category Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="catName"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (validationErrors.name) setValidationErrors((p) => ({ ...p, name: undefined }));
              }}
              placeholder="e.g. Laboratories, Dining Halls"
              className={`w-full px-3 py-2 text-sm rounded-lg border bg-white focus:outline-hidden focus:ring-2 ${
                validationErrors.name
                  ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20'
                  : 'border-slate-300 focus:ring-emerald-500'
              }`}
            />
            {validationErrors.name && (
              <p className="text-xs text-rose-600 font-medium">{validationErrors.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label htmlFor="catDesc" className="block text-xs font-semibold text-slate-700">
              Description
            </label>
            <textarea
              id="catDesc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of facilities grouped under this category..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="secondary" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
              {isEditing ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
