import {
  Driver,
  Truck,
  Household,
  RouteStop,
  Route,
  TruckLocation,
} from '../types/routeModels';

/**
 * 1. Simulated Current T1 Truck Location
 */
export const MOCK_TRUCK_LOCATION: TruckLocation = {
  latitude: 37.7752,
  longitude: -122.4180,
  heading: 90,
  speedKmH: 24,
  lastUpdated: new Date().toISOString(),
};

/**
 * 2. Driver assigned to T1
 */
export const MOCK_DRIVER: Driver = {
  id: 'DRV-101',
  name: 'Alex Rivera',
  licenseNumber: 'DL-883920-ECO',
  phone: '+1 (555) 234-5678',
  assignedTruckId: 'T1',
  isOnDuty: true,
};

/**
 * 3. Truck T1 Definition
 */
export const MOCK_TRUCK: Truck = {
  truckId: 'T1',
  licensePlate: 'ECO-7821-EV',
  model: 'EcoVolt Heavy Waste Carrier V2',
  capacityKg: 2500,
  currentLoadKg: 0,
  assignedDriverId: 'DRV-101',
  currentLocation: MOCK_TRUCK_LOCATION,
};

/**
 * 4. Household Definitions (12 Collection Households)
 */
export const MOCK_HOUSEHOLDS: Household[] = [
  {
    id: 'HH-001',
    name: 'Oakwood Apartments - Block A',
    address: '101 Oakwood Lane, Bay Area',
    contactPhone: '+1 (555) 111-0001',
    binType: 'RECYCLABLE',
    notes: 'Bins located next to garage door.',
  },
  {
    id: 'HH-002',
    name: 'Green Villa Estate',
    address: '205 Pinecrest Boulevard',
    contactPhone: '+1 (555) 111-0002',
    binType: 'ORGANIC',
    notes: 'Ring doorbell if gate is closed.',
  },
  {
    id: 'HH-003',
    name: 'Sunset Heights Residence',
    address: '312 Sunset Drive',
    contactPhone: '+1 (555) 111-0003',
    binType: 'GENERAL',
  },
  {
    id: 'HH-004',
    name: 'Bayview Tech Office Park',
    address: '400 Bayview Terrace',
    contactPhone: '+1 (555) 111-0004',
    binType: 'E_WASTE' as any,
    notes: 'Loading dock entrance via West Gate.',
  },
  {
    id: 'HH-005',
    name: 'Maplewood Family Home',
    address: '520 Maple Avenue',
    contactPhone: '+1 (555) 111-0005',
    binType: 'ORGANIC',
  },
  {
    id: 'HH-006',
    name: 'Cedar Grove Condos',
    address: '615 Cedar Street',
    contactPhone: '+1 (555) 111-0006',
    binType: 'RECYCLABLE',
    notes: '4 large blue rolling bins in alleyway.',
  },
  {
    id: 'HH-007',
    name: 'Hilltop Community Hub',
    address: '730 Hilltop Way',
    contactPhone: '+1 (555) 111-0007',
    binType: 'GENERAL',
  },
  {
    id: 'HH-008',
    name: 'Riverfront Plaza Shops',
    address: '845 Riverfront Drive',
    contactPhone: '+1 (555) 111-0008',
    binType: 'HAZARDOUS',
    notes: 'Hazardous seal verification required.',
  },
  {
    id: 'HH-009',
    name: 'Highland Park Villa 12',
    address: '910 Highland Court',
    contactPhone: '+1 (555) 111-0009',
    binType: 'ORGANIC',
  },
  {
    id: 'HH-010',
    name: 'Valley View Apartments',
    address: '1025 Valley View Road',
    contactPhone: '+1 (555) 111-0010',
    binType: 'RECYCLABLE',
  },
  {
    id: 'HH-011',
    name: 'Ocean breeze Residences',
    address: '1140 Ocean Avenue',
    contactPhone: '+1 (555) 111-0011',
    binType: 'GENERAL',
  },
  {
    id: 'HH-012',
    name: 'EcoCentral Transfer Hub',
    address: '1250 EcoCentral Highway',
    contactPhone: '+1 (555) 111-0012',
    binType: 'RECYCLABLE',
    notes: 'Final depot dump stop.',
  },
];

/**
 * 5. Route Stops Sequence (12 Ordered Collection Stops)
 */
export const MOCK_ROUTE_STOPS: RouteStop[] = [
  {
    id: 'STOP-01',
    householdId: 'HH-001',
    householdName: 'Oakwood Apartments - Block A',
    address: '101 Oakwood Lane, Bay Area',
    latitude: 37.7749,
    longitude: -122.4194,
    status: 'PENDING',
    sequence: 1,
    estimatedWeightKg: 110,
    binCategory: 'RECYCLABLE',
  },
  {
    id: 'STOP-02',
    householdId: 'HH-002',
    householdName: 'Green Villa Estate',
    address: '205 Pinecrest Boulevard',
    latitude: 37.7758,
    longitude: -122.4182,
    status: 'PENDING',
    sequence: 2,
    estimatedWeightKg: 140,
    binCategory: 'ORGANIC',
  },
  {
    id: 'STOP-03',
    householdId: 'HH-003',
    householdName: 'Sunset Heights Residence',
    address: '312 Sunset Drive',
    latitude: 37.7765,
    longitude: -122.4170,
    status: 'PENDING',
    sequence: 3,
    estimatedWeightKg: 95,
    binCategory: 'GENERAL',
  },
  {
    id: 'STOP-04',
    householdId: 'HH-004',
    householdName: 'Bayview Tech Office Park',
    address: '400 Bayview Terrace',
    latitude: 37.7772,
    longitude: -122.4158,
    status: 'PENDING',
    sequence: 4,
    estimatedWeightKg: 295,
    binCategory: 'RECYCLABLE',
    accessNotes: 'Loading dock entrance via West Gate.',
  },
  {
    id: 'STOP-05',
    householdId: 'HH-005',
    householdName: 'Maplewood Family Home',
    address: '520 Maple Avenue',
    latitude: 37.7780,
    longitude: -122.4145,
    status: 'PENDING',
    sequence: 5,
    estimatedWeightKg: 85,
    binCategory: 'ORGANIC',
  },
  {
    id: 'STOP-06',
    householdId: 'HH-006',
    householdName: 'Cedar Grove Condos',
    address: '615 Cedar Street',
    latitude: 37.7788,
    longitude: -122.4132,
    status: 'PENDING',
    sequence: 6,
    estimatedWeightKg: 180,
    binCategory: 'RECYCLABLE',
    accessNotes: '4 large blue rolling bins in alleyway.',
  },
  {
    id: 'STOP-07',
    householdId: 'HH-007',
    householdName: 'Hilltop Community Hub',
    address: '730 Hilltop Way',
    latitude: 37.7795,
    longitude: -122.4120,
    status: 'PENDING',
    sequence: 7,
    estimatedWeightKg: 210,
    binCategory: 'GENERAL',
  },
  {
    id: 'STOP-08',
    householdId: 'HH-008',
    householdName: 'Riverfront Plaza Shops',
    address: '845 Riverfront Drive',
    latitude: 37.7802,
    longitude: -122.4108,
    status: 'PENDING',
    sequence: 8,
    estimatedWeightKg: 65,
    binCategory: 'HAZARDOUS',
    accessNotes: 'Hazardous seal verification required.',
  },
  {
    id: 'STOP-09',
    householdId: 'HH-009',
    householdName: 'Highland Park Villa 12',
    address: '910 Highland Court',
    latitude: 37.7810,
    longitude: -122.4095,
    status: 'PENDING',
    sequence: 9,
    estimatedWeightKg: 125,
    binCategory: 'ORGANIC',
  },
  {
    id: 'STOP-10',
    householdId: 'HH-010',
    householdName: 'Valley View Apartments',
    address: '1025 Valley View Road',
    latitude: 37.7818,
    longitude: -122.4082,
    status: 'PENDING',
    sequence: 10,
    estimatedWeightKg: 175,
    binCategory: 'RECYCLABLE',
  },
  {
    id: 'STOP-11',
    householdId: 'HH-011',
    householdName: 'Ocean breeze Residences',
    address: '1140 Ocean Avenue',
    latitude: 37.7825,
    longitude: -122.4070,
    status: 'PENDING',
    sequence: 11,
    estimatedWeightKg: 150,
    binCategory: 'GENERAL',
  },
  {
    id: 'STOP-12',
    householdId: 'HH-012',
    householdName: 'EcoCentral Transfer Hub',
    address: '1250 EcoCentral Highway',
    latitude: 37.7832,
    longitude: -122.4058,
    status: 'PENDING',
    sequence: 12,
    estimatedWeightKg: 350,
    binCategory: 'RECYCLABLE',
    accessNotes: 'Final depot dump stop.',
  },
];

/**
 * 6. Active Daily Route for Truck T1 and Driver Alex Rivera
 * Initial status: NOT_STARTED
 */
export const MOCK_ROUTE: Route = {
  id: 'ROUTE-2026-0913-T1',
  routeNumber: 'RT-T1-NORTH',
  truckId: 'T1',
  driverId: 'DRV-101',
  status: 'NOT_STARTED',
  stops: MOCK_ROUTE_STOPS,
  totalStops: MOCK_ROUTE_STOPS.length,
  completedStops: 0,
  totalDistanceKm: 22.4,
};
