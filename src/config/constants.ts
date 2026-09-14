export const APP_CONFIG = {
  appName: 'EcoCircle Driver',
  version: '1.0.0',
  defaultDriverId: 'DRV-8842',
  refreshIntervalMs: 15000,
};

export const PICKUP_STATUS = {
  PENDING: 'PENDING',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export const WASTE_CATEGORY = {
  RECYCLABLE: 'RECYCLABLE',
  ORGANIC: 'ORGANIC',
  HAZARDOUS: 'HAZARDOUS',
  E_WASTE: 'E_WASTE',
  GENERAL: 'GENERAL',
} as const;

export const PRIORITY_LEVEL = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const;
