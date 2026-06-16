export const SEVERITY_COLORS = {
  low:      { badge: 'bg-green-100 text-green-800 border-green-200',   dot: 'bg-green-500' },
  medium:   { badge: 'bg-yellow-100 text-yellow-800 border-yellow-200', dot: 'bg-yellow-500' },
  high:     { badge: 'bg-orange-100 text-orange-800 border-orange-200', dot: 'bg-orange-500' },
  critical: { badge: 'bg-red-100 text-red-800 border-red-200',          dot: 'bg-red-500' },
};

export const SEVERITY_BORDER_COLOR = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
};

export function getSeverityColors(severity) {
  return SEVERITY_COLORS[severity] ?? SEVERITY_COLORS.medium;
}
