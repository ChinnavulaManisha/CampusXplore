import React from 'react';

export default function CategoryPill({
  category,
  isSelected = false,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
        isSelected
          ? 'bg-indigo-600 text-white shadow-xs'
          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
      }`}
    >
      <span>{category.name}</span>
      {category.facility_count !== undefined && (
        <span
          className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {category.facility_count}
        </span>
      )}
    </button>
  );
}
