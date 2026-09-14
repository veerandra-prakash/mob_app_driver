import {
  Route,
  RouteStop,
  StopStatus,
  Truck,
  TruckLocation,
  Driver,
} from '../types/routeModels';
import {
  MOCK_ROUTE,
  MOCK_TRUCK,
  MOCK_DRIVER,
  MOCK_TRUCK_LOCATION,
} from '../data/mockRouteData';

/**
 * Service / Repository Abstraction Interface for EcoCircle Driver App.
 * -------------------------------------------------------------------
 * UI screens call this interface without knowing whether data comes
 * from local in-memory mock state or a remote REST API.
 * 
 * To switch to a real REST API backend later:
 * 1. Create `ApiRouteRepository` implementing `IRouteRepository`.
 * 2. Replace `export const routeRepository = new ApiRouteRepository()`.
 * No UI screen or component code needs to be modified.
 */
export interface IRouteRepository {
  getDriver(driverId?: string): Promise<Driver | null>;
  getTruck(truckId?: string): Promise<Truck | null>;
  getRoute(routeId?: string): Promise<Route | null>;
  getTruckLocation(truckId?: string): Promise<TruckLocation | null>;
  startRoute(routeId?: string): Promise<Route | null>;
  collectStop(stopId: string): Promise<RouteStop | null>;
  skipStop(stopId: string, reason?: string): Promise<RouteStop | null>;
  getRouteStopById(stopId: string): Promise<RouteStop | null>;
  getNextStop(routeId?: string): Promise<RouteStop | null>;
  updateTruckLocation(latitude: number, longitude: number, heading?: number, speedKmH?: number): Promise<TruckLocation | null>;
  updateDriverProfile(driverUpdate: Partial<Driver>, truckUpdate?: Partial<Truck>): Promise<Driver | null>;
  subscribe(listener: () => void): () => void;
}

/**
 * In-Memory Mock Implementation of IRouteRepository
 */
class MockRouteRepository implements IRouteRepository {
  private driver: Driver = { ...MOCK_DRIVER };
  private truck: Truck = { ...MOCK_TRUCK };
  private route: Route = { ...MOCK_ROUTE };
  private listeners: Set<() => void> = new Set();

  /**
   * Subscribe to state changes to enable reactive updates across React hooks
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }

  /**
   * 1. getDriver()
   */
  async getDriver(driverId: string = 'DRV-101'): Promise<Driver | null> {
    await this.simulateLatency(50);
    return { ...this.driver };
  }

  /**
   * 2. getTruck()
   */
  async getTruck(truckId: string = 'T1'): Promise<Truck | null> {
    await this.simulateLatency(50);
    return { ...this.truck };
  }

  /**
   * 3. getRoute()
   */
  async getRoute(routeId: string = 'ROUTE-2026-0913-T1'): Promise<Route | null> {
    await this.simulateLatency(50);
    return { ...this.route };
  }

  /**
   * 4. getTruckLocation()
   */
  async getTruckLocation(truckId: string = 'T1'): Promise<TruckLocation | null> {
    await this.simulateLatency(30);
    return { ...this.truck.currentLocation };
  }

  /**
   * 5. startRoute()
   * Validates route, changes status to IN_PROGRESS, promotes first stop, and notifies UI subscribers.
   */
  async startRoute(routeId: string = 'ROUTE-2026-0913-T1'): Promise<Route | null> {
    await this.simulateLatency(100);

    // 1. Validate route availability
    if (!this.route) {
      console.warn(`Route ${routeId} not available.`);
      return null;
    }

    // 2. Prevent starting the same route repeatedly
    if (this.route.status === 'IN_PROGRESS') {
      console.warn(`Route ${this.route.routeNumber} is already IN_PROGRESS.`);
      return { ...this.route };
    }

    if (this.route.status === 'COMPLETED') {
      console.warn(`Route ${this.route.routeNumber} is already COMPLETED.`);
      return { ...this.route };
    }

    // 3. Mutate local state
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Promote sequence #1 (or first PENDING stop) to IN_PROGRESS
    const sortedStops = [...this.route.stops].sort((a, b) => a.sequence - b.sequence);
    let promotedFirst = false;

    const updatedStops = sortedStops.map((stop) => {
      if (!promotedFirst && stop.status === 'PENDING') {
        promotedFirst = true;
        return { ...stop, status: 'IN_PROGRESS' as StopStatus };
      }
      return stop;
    });

    this.route = {
      ...this.route,
      status: 'IN_PROGRESS',
      startTime: nowTime,
      stops: updatedStops,
    };

    // 4. Update UI reactively across all screens (Dashboard, Map, Profile)
    this.notifyListeners();
    return { ...this.route };
  }

  /**
   * 6. collectStop(stopId)
   */
  async collectStop(stopId: string): Promise<RouteStop | null> {
    await this.simulateLatency(150);
    const stopIndex = this.route.stops.findIndex((s) => s.id === stopId);
    if (stopIndex === -1) return null;

    const targetStop = this.route.stops[stopIndex];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updatedStop: RouteStop = {
      ...targetStop,
      status: 'COLLECTED',
      completedAt: nowTime,
    };

    const updatedStops = [...this.route.stops];
    updatedStops[stopIndex] = updatedStop;

    // Advance next pending stop to IN_PROGRESS automatically
    const nextPendingIndex = updatedStops.findIndex((s) => s.status === 'PENDING');
    if (nextPendingIndex !== -1) {
      updatedStops[nextPendingIndex] = {
        ...updatedStops[nextPendingIndex],
        status: 'IN_PROGRESS',
      };
    }

    const completedCount = updatedStops.filter((s) => s.status === 'COLLECTED').length;
    const isAllFinished = completedCount + updatedStops.filter((s) => s.status === 'SKIPPED').length === updatedStops.length;

    // Update truck load weight
    this.truck = {
      ...this.truck,
      currentLoadKg: Math.min(this.truck.capacityKg, this.truck.currentLoadKg + targetStop.estimatedWeightKg),
    };

    // Update active route
    this.route = {
      ...this.route,
      stops: updatedStops,
      completedStops: completedCount,
      status: isAllFinished ? 'COMPLETED' : 'IN_PROGRESS',
      endTime: isAllFinished ? nowTime : undefined,
    };

    this.notifyListeners();
    return updatedStop;
  }

  /**
   * 7. skipStop(stopId, reason)
   */
  async skipStop(stopId: string, reason?: string): Promise<RouteStop | null> {
    await this.simulateLatency(150);
    const stopIndex = this.route.stops.findIndex((s) => s.id === stopId);
    if (stopIndex === -1) return null;

    const targetStop = this.route.stops[stopIndex];
    const updatedStop: RouteStop = {
      ...targetStop,
      status: 'SKIPPED',
      accessNotes: reason ? `${targetStop.accessNotes || ''} [Skipped: ${reason}]` : targetStop.accessNotes,
    };

    const updatedStops = [...this.route.stops];
    updatedStops[stopIndex] = updatedStop;

    // Advance next pending stop to IN_PROGRESS
    const nextPendingIndex = updatedStops.findIndex((s) => s.status === 'PENDING');
    if (nextPendingIndex !== -1) {
      updatedStops[nextPendingIndex] = {
        ...updatedStops[nextPendingIndex],
        status: 'IN_PROGRESS',
      };
    }

    const completedCount = updatedStops.filter((s) => s.status === 'COLLECTED').length;
    const isAllFinished = completedCount + updatedStops.filter((s) => s.status === 'SKIPPED').length === updatedStops.length;

    this.route = {
      ...this.route,
      stops: updatedStops,
      completedStops: completedCount,
      status: isAllFinished ? 'COMPLETED' : 'IN_PROGRESS',
    };

    this.notifyListeners();
    return updatedStop;
  }

  async getRouteStopById(stopId: string): Promise<RouteStop | null> {
    await this.simulateLatency(30);
    const stop = this.route.stops.find((s) => s.id === stopId);
    return stop ? { ...stop } : null;
  }

  /**
   * 8. getNextStop()
   */
  async getNextStop(routeId?: string): Promise<RouteStop | null> {
    await this.simulateLatency(30);
    const sortedStops = [...this.route.stops].sort((a, b) => a.sequence - b.sequence);
    
    // First priority: stop currently IN_PROGRESS
    const inProgressStop = sortedStops.find((s) => s.status === 'IN_PROGRESS');
    if (inProgressStop) return { ...inProgressStop };

    // Second priority: next PENDING stop
    const pendingStop = sortedStops.find((s) => s.status === 'PENDING');
    if (pendingStop) return { ...pendingStop };

    return null;
  }

  async updateTruckLocation(
    latitude: number,
    longitude: number,
    heading?: number,
    speedKmH?: number
  ): Promise<TruckLocation | null> {
    const updatedLocation: TruckLocation = {
      latitude,
      longitude,
      heading: heading ?? this.truck.currentLocation.heading,
      speedKmH: speedKmH ?? this.truck.currentLocation.speedKmH,
      lastUpdated: new Date().toISOString(),
    };

    this.truck = {
      ...this.truck,
      currentLocation: updatedLocation,
    };

    this.notifyListeners();
    return updatedLocation;
  }

  async updateDriverProfile(
    driverUpdate: Partial<Driver>,
    truckUpdate?: Partial<Truck>
  ): Promise<Driver | null> {
    this.driver = { ...this.driver, ...driverUpdate };
    if (truckUpdate) {
      this.truck = { ...this.truck, ...truckUpdate };
    }
    this.notifyListeners();
    return { ...this.driver };
  }

  private simulateLatency(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

import { APP_CONFIG } from '../config/constants';
import { ApiRouteRepository } from './apiRouteRepository';

// Singleton repository instance export
export const mockRouteRepository = new MockRouteRepository();
export const apiRouteRepository = new ApiRouteRepository();

export const routeRepository: IRouteRepository = APP_CONFIG.useRealBackend
  ? apiRouteRepository
  : mockRouteRepository;

