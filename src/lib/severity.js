export const SEVERITY_COLORS = {
  low:      { badge: 'bg-green-950 text-green-400 border-green-800',   dot: 'bg-green-400' },
  medium:   { badge: 'bg-amber-950 text-amber-400 border-amber-800',   dot: 'bg-amber-400' },
  high:     { badge: 'bg-orange-950 text-orange-400 border-orange-800', dot: 'bg-orange-400' },
  critical: { badge: 'bg-red-950 text-red-400 border-red-800',          dot: 'bg-red-400' },
};

export const SEVERITY_BORDER_COLOR = {
  low:      '#4ade80',
  medium:   '#fbbf24',
  high:     '#fb923c',
  critical: '#f87171',
};

export function getSeverityColors(severity) {
  return SEVERITY_COLORS[severity] ?? SEVERITY_COLORS.medium;
}
