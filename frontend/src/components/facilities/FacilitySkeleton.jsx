import React from 'react';

export default function FacilitySkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs animate-pulse space-y-4 text-left">
      <div className="flex items-center justify-between">
        <div className="h-5 bg-slate-200 rounded-md w-24"></div>
        <div className="h-5 bg-slate-200 rounded-md w-14"></div>
      </div>

      <div className="space-y-2">
        <div className="h-5 bg-slate-200 rounded-md w-3/4"></div>
        <div className="h-4 bg-slate-100 rounded-md w-1/2"></div>
      </div>

      <div className="space-y-1.5 pt-2">
        <div className="h-3 bg-slate-100 rounded-md w-full"></div>
        <div className="h-3 bg-slate-100 rounded-md w-5/6"></div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
        <div className="h-4 bg-slate-100 rounded-md w-28"></div>
        <div className="h-4 bg-slate-200 rounded-md w-16"></div>
      </div>
    </div>
  );
}
