/**
 * Utility formatting functions for CampusXplore
 */

export const formatCoordinate = (val) => {
  if (val === null || val === undefined || val === '') return 'N/A';
  const num = parseFloat(val);
  return isNaN(num) ? 'N/A' : num.toFixed(6);
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};
