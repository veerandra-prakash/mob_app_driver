export type StopStatus = 
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COLLECTED'
  | 'SKIPPED'
  | 'FAILED';

export type RouteStatus = 
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'PAUSED';

export interface TruckLocation {
  latitude: number;
  longitude: number;
  heading?: number;
  speedKmH?: number;
  lastUpdated: string;
}

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  phone: string;
  assignedTruckId: string;
  isOnDuty: boolean;
}

export interface Truck {
  truckId: string;
  licensePlate: string;
  model: string;
  capacityKg: number;
  currentLoadKg: number;
  assignedDriverId: string;
  currentLocation: TruckLocation;
}

export interface Household {
  id: string;
  name: string;
  address: string;
  contactPhone: string;
  binType: 'ORGANIC' | 'RECYCLABLE' | 'GENERAL' | 'HAZARDOUS';
  notes?: string;
}

export interface RouteStop {
  id: string;
  householdId: string;
  householdName: string;
  address: string;
  latitude: number;
  longitude: number;
  status: StopStatus;
  sequence: number;
  estimatedWeightKg: number;
  binCategory: 'ORGANIC' | 'RECYCLABLE' | 'GENERAL' | 'HAZARDOUS';
  accessNotes?: string;
  completedAt?: string;
}

export interface Route {
  id: string;
  routeNumber: string;
  truckId: string;
  driverId: string;
  status: RouteStatus;
  startTime?: string;
  endTime?: string;
  stops: RouteStop[];
  totalStops: number;
  completedStops: number;
  totalDistanceKm: number;
  routeCoordinates?: Array<[number, number]>;
}

