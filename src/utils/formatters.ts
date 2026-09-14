/**
 * Utility functions for formatting numbers, weights, and distances.
 */

export const formatWeight = (weightKg: number): string => {
  if (weightKg >= 1000) {
    return `${(weightKg / 1000).toFixed(1)} Tonnes`;
  }
  return `${weightKg} kg`;
};

export const formatDistance = (distanceKm: number): string => {
  return `${distanceKm.toFixed(1)} km`;
};

export const formatTimeWindow = (window: { start: string; end: string }): string => {
  return `${window.start} - ${window.end}`;
};
