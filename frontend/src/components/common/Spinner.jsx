import React from 'react';

export default function Spinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3',
    xl: 'w-16 h-16 border-4',
  }[size] || 'w-6 h-6 border-2';

  return (
    <div
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-slate-300 border-t-indigo-600 ${sizeClasses} ${className}`}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
