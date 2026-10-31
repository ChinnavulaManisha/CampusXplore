import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Phone, ArrowRight } from 'lucide-react';
import Badge from '../common/Badge';

export default function FacilityCard({ facility }) {
  if (!facility) return null;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between text-left space-y-4">
      <div className="space-y-3">
        {/* Header: Category & Active status */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Badge variant="primary" size="xs">
            {facility.category?.name || 'General Facility'}
          </Badge>

          {facility.is_active ? (
            <Badge variant="success" size="xs">Active</Badge>
          ) : (
            <Badge variant="warning" size="xs">Inactive (Soft-Deleted)</Badge>
          )}
        </div>

        {/* Title & Building */}
        <div>
          <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
            {facility.name}
          </h3>
          <div className="flex items-center text-xs text-slate-500 mt-1 gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-medium">{facility.building}</span>
          </div>
        </div>

        {/* Description snippet */}
        {facility.description && (
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {facility.description}
          </p>
        )}
      </div>

      {/* Meta Footer */}
      <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-500">
        {facility.opening_hours && (
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{facility.opening_hours}</span>
          </div>
        )}

        {facility.contact_number && (
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{facility.contact_number}</span>
          </div>
        )}

        <div className="pt-1">
          <Link
            to={`/facilities/${facility.id}`}
            className="w-full inline-flex items-center justify-between text-xs font-semibold text-indigo-600 hover:text-indigo-700 py-1"
          >
            <span>View Full Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
