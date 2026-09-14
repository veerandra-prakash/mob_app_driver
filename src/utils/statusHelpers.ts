import { COLORS } from '../config/theme';
import { StopStatus, RouteStatus } from '../types/routeModels';

export const getStatusColor = (status: StopStatus | RouteStatus | string): string => {
  switch (status) {
    case 'IN_PROGRESS':
      return COLORS.statusInProgress;
    case 'COLLECTED':
    case 'COMPLETED':
      return COLORS.statusCompleted;
    case 'SKIPPED':
    case 'FAILED':
    case 'CANCELLED':
      return COLORS.statusCancelled;
    case 'NOT_STARTED':
      return COLORS.textSecondary;
    case 'PENDING':
    default:
      return COLORS.secondary;
  }
};

export const getStatusLabel = (status: StopStatus | RouteStatus | string): string => {
  switch (status) {
    case 'IN_PROGRESS':
      return 'In Progress';
    case 'COLLECTED':
      return 'Collected';
    case 'COMPLETED':
      return 'Completed';
    case 'SKIPPED':
      return 'Skipped';
    case 'FAILED':
      return 'Failed';
    case 'NOT_STARTED':
      return 'Not Started';
    case 'PENDING':
      return 'Pending';
    default:
      return String(status);
  }
};

export const getWasteCategoryColor = (category: string): string => {
  switch (category) {
    case 'RECYCLABLE':
      return COLORS.recyclable;
    case 'ORGANIC':
      return COLORS.organic;
    case 'HAZARDOUS':
      return COLORS.hazardous;
    case 'E_WASTE':
      return COLORS.eWaste;
    case 'GENERAL':
    default:
      return COLORS.general;
  }
};

export const getWasteCategoryLabel = (category: string): string => {
  switch (category) {
    case 'RECYCLABLE':
      return 'Recyclable';
    case 'ORGANIC':
      return 'Organic';
    case 'HAZARDOUS':
      return 'Hazardous';
    case 'E_WASTE':
      return 'E-Waste';
    case 'GENERAL':
      return 'General Waste';
    default:
      return String(category);
  }
};
