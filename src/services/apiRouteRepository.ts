import {
  Route,
  RouteStop,
  StopStatus,
  RouteStatus,
  Truck,
  TruckLocation,
  Driver,
} from '../types/routeModels';
import { IRouteRepository } from './routeRepository';
import { apiRequest } from './apiClient';
import { APP_CONFIG } from '../config/constants';


export class ApiRouteRepository implements IRouteRepository {
  private listeners: Set<() => void> = new Set();
  private pollTimerId: ReturnType<typeof setInterval> | null = null;
  private systemStatusTimerId: ReturnType<typeof setInterval> | null = null;
  private cachedRoute: Route | null = null;
  private cachedTruckLocation: TruckLocation | null = null;
  private lastT1StateJson: string = '';
  private lastRoutesJson: string = '';
  private collectedStopIds: Set<string> = new Set();
  private skippedStopIds: Set<string> = new Set();
  private isRouteStartedLocally: boolean = false;



  constructor() {
    // Optionally pre-fetch
  }

  /**
   * Reactive state listener subscription
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    this.ensurePollingStarted();

    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.stopPolling();
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }

  private ensurePollingStarted(): void {
    if (!this.pollTimerId) {
      this.pollTimerId = setInterval(() => {
        this.pollBackendState();
      }, APP_CONFIG.pollStateIntervalMs);
    }

    if (!this.systemStatusTimerId) {
      this.systemStatusTimerId = setInterval(() => {
        this.pollSystemStatus();
      }, APP_CONFIG.pollSystemStatusIntervalMs);
    }
  }

  private stopPolling(): void {
    if (this.pollTimerId) {
      clearInterval(this.pollTimerId);
      this.pollTimerId = null;
    }
    if (this.systemStatusTimerId) {
      clearInterval(this.systemStatusTimerId);
      this.systemStatusTimerId = null;
    }
  }

  private async pollBackendState(): Promise<void> {
    try {
      const [t1State, routesRes] = await Promise.all([
        apiRequest('/api/t1_state', { method: 'GET' }).catch(() => null),
        apiRequest('/api/get_routes', { method: 'GET' }).catch(() => null),
      ]);

      const t1Json = JSON.stringify(t1State);
      const routesJson = JSON.stringify(routesRes);

      if (t1Json !== this.lastT1StateJson || routesJson !== this.lastRoutesJson) {
        this.lastT1StateJson = t1Json;
        this.lastRoutesJson = routesJson;

        if (t1State && t1State.ready !== false && t1State.lat && t1State.lng) {
          this.cachedTruckLocation = {
            latitude: t1State.lat,
            longitude: t1State.lng,
            heading: 0,
            speedKmH: t1State.moving ? 20 : 0,
            lastUpdated: new Date().toISOString(), pathIndex: t1State?.path_index,
          };
        }
        await this.fetchRouteInternal(routesRes, t1State);
        this.notifyListeners();
      }
    } catch {
      // Backend polling error ignored silently
    }
  }

  private async pollSystemStatus(): Promise<void> {
    try {
      const sysStatus = await apiRequest('/api/system_status', { method: 'GET' });
      if (sysStatus && sysStatus.reset) {
        // Admin reset detected — refresh local cache and notify UI
        this.cachedRoute = null;
        this.cachedTruckLocation = null;
        this.collectedStopIds.clear();
        this.skippedStopIds.clear();
        this.isRouteStartedLocally = false;
        this.lastT1StateJson = '';
        this.lastRoutesJson = '';
        await this.fetchRouteInternal();
        this.notifyListeners();
      }
    } catch {
      // System status polling error ignored silently
    }
  }



  private customDriver: Partial<Driver> = {};
  private customTruck: Partial<Truck> = {};

  /**
   * Fetch driver details
   */
  async getDriver(driverId: string = APP_CONFIG.defaultDriverId): Promise<Driver | null> {
    const base: Driver = {
      id: driverId,
      name: 'Rajesh Kumar',
      licenseNumber: 'DL-142023009876',
      phone: '+91 98765 43210',
      assignedTruckId: APP_CONFIG.defaultTruckId,
      isOnDuty: true,
    };
    return { ...base, ...this.customDriver };
  }

  /**
   * Fetch truck details
   */
  async getTruck(truckId: string = APP_CONFIG.defaultTruckId): Promise<Truck | null> {
    const loc = await this.getTruckLocation(truckId);
    const base: Truck = {
      truckId: truckId,
      licensePlate: 'DL-01-EQ-5542',
      model: 'Tata Ace Gold EV (Electric)',
      capacityKg: 850,
      currentLoadKg: 120,
      assignedDriverId: APP_CONFIG.defaultDriverId,
      currentLocation: loc || {
        latitude: 28.6139,
        longitude: 77.209,
        heading: 0,
        speedKmH: 0,
        lastUpdated: new Date().toISOString(), pathIndex: t1State?.path_index,
      },
    };
    return { ...base, ...this.customTruck };
  }

  /**
   * Update Driver & Vehicle Profile details dynamically
   */
  async updateDriverProfile(
    driverUpdate: Partial<Driver>,
    truckUpdate?: Partial<Truck>
  ): Promise<Driver | null> {
    this.customDriver = { ...this.customDriver, ...driverUpdate };
    if (truckUpdate) {
      this.customTruck = { ...this.customTruck, ...truckUpdate };
    }
    this.notifyListeners();
    return this.getDriver();
  }

  /**
   * Fetch route details from Flask Backend (/api/get_routes & /api/t1_state)
   */
  async getRoute(routeId?: string): Promise<Route | null> {
    if (!this.cachedRoute) {
      await this.fetchRouteInternal();
    }
    return this.cachedRoute;
  }

  private async fetchRouteInternal(
    prefreshedRoutesRes?: any,
    prefreshedT1State?: any
  ): Promise<Route | null> {
    try {
      const [routesRes, t1State, historyRes] = await Promise.all([
        prefreshedRoutesRes !== undefined
          ? prefreshedRoutesRes
          : apiRequest('/api/get_routes', { method: 'GET' }).catch(() => null),
        prefreshedT1State !== undefined
          ? prefreshedT1State
          : apiRequest('/api/t1_state', { method: 'GET' }).catch(() => null),
        apiRequest('/api/get_collection_history', { method: 'GET' }).catch(() => null),
      ]);

      // Sync collectedStopIds with PostgreSQL collection history records
      if (historyRes?.records && Array.isArray(historyRes.records)) {
        historyRes.records.forEach((rec: any) => {
          if (rec.location_id) {
            this.collectedStopIds.add(String(rec.location_id));
          }
        });
      }

      let routesList = routesRes?.routes || [];
      if (routesList.length === 0 && !prefreshedRoutesRes && !this.isInitializing) {
        await this.autoInitializeBackend();
        const retryRes = await apiRequest('/api/get_routes', { method: 'GET' }).catch(() => null);
        routesList = retryRes?.routes || [];
      }

      const t1Route = routesList.find((r: any) => r.truck_id === APP_CONFIG.defaultTruckId) || routesList[0];

      if (!t1Route && !t1State) {
        return this.cachedRoute;
      }

      const assignedHouses = t1Route?.assigned_houses || [];
      const isReady = t1State && t1State.ready !== false;
      const doneStopsCount = t1State?.done_stops || 0;
      const currentStopId = t1State?.current_stop_id;
      const isPausedAtStop = t1State?.paused === true;
      const isCompleted = t1State?.completed === true;

      // Transform assigned houses into RouteStops
      const stops: RouteStop[] = assignedHouses.map((h: any, idx: number) => {
        const houseId = h.id || `H${idx + 1}`;
        let status: StopStatus = 'PENDING';

        if (isCompleted || idx < doneStopsCount || this.collectedStopIds.has(houseId)) {
          status = 'COLLECTED';
        } else if (this.skippedStopIds.has(houseId)) {
          status = 'SKIPPED';
        } else if (houseId === currentStopId && isPausedAtStop) {
          status = 'IN_PROGRESS';
        } else if (idx === doneStopsCount && isReady && (t1State?.moving || isPausedAtStop)) {
          status = 'IN_PROGRESS';
        }

        const rawCategory = String(h.category || '').toUpperCase();
        const binCategory = rawCategory === 'RECYCLABLE' ? 'RECYCLABLE' : 'ORGANIC';
        const weight = Number(h.weight) || 25;

        return {
          id: houseId,
          householdId: houseId,
          householdName: `Household ${houseId}`,
          address: `Sector 4, Ward 12, House ${houseId}`,
          latitude: Number(h.lat),
          longitude: Number(h.lng),
          status: status,
          sequence: idx + 1,
          estimatedWeightKg: weight,
          binCategory: binCategory,
        };
      });

      const completedStops = stops.filter((s) => s.status === 'COLLECTED').length;
      const skippedStops = stops.filter((s) => s.status === 'SKIPPED').length;

      if (completedStops > 0 || skippedStops > 0) {
        this.isRouteStartedLocally = true;
      }

      let routeStatus: RouteStatus = 'NOT_STARTED';
      if (completedStops + skippedStops === stops.length && stops.length > 0) {
        routeStatus = 'COMPLETED';
      } else if (isCompleted) {
        routeStatus = 'COMPLETED';
      } else if (
        this.isRouteStartedLocally ||
        completedStops > 0 ||
        skippedStops > 0 ||
        (isReady && (t1State?.moving || isPausedAtStop || doneStopsCount > 0))
      ) {
        routeStatus = 'IN_PROGRESS';
        this.isRouteStartedLocally = true;
      }

      // Ensure active stop progression if route is in progress
      if (routeStatus === 'IN_PROGRESS') {
        const hasActive = stops.some((s) => s.status === 'IN_PROGRESS');
        if (!hasActive && stops.some((s) => s.status === 'PENDING')) {
          const firstPending = stops.find((s) => s.status === 'PENDING');
          if (firstPending) {
            firstPending.status = 'IN_PROGRESS';
          }
        }
      }

      this.cachedRoute = {
        id: t1Route?.route_id ? String(t1Route.route_id) : 'ROUTE-FLASK-T1',
        routeNumber: `ROUTE-${APP_CONFIG.defaultTruckId}`,
        truckId: APP_CONFIG.defaultTruckId,
        driverId: APP_CONFIG.defaultDriverId,
        status: routeStatus,
        stops: stops,
        totalStops: stops.length,
        completedStops: completedStops,
        totalDistanceKm: 12.5,
        routeCoordinates: t1Route?.route_coordinates || [],
      };

      if (t1State && isReady && t1State.lat && t1State.lng) {
        this.cachedTruckLocation = {
          latitude: t1State.lat,
          longitude: t1State.lng,
          heading: 0,
          speedKmH: t1State.moving ? 20 : 0,
          lastUpdated: new Date().toISOString(), pathIndex: t1State?.path_index,
        };
      }

      return this.cachedRoute;
    } catch {
      return this.cachedRoute;
    }
  }

  /**
   * Fetch current truck location
   */
  async getTruckLocation(truckId: string = APP_CONFIG.defaultTruckId): Promise<TruckLocation | null> {
    if (!this.cachedTruckLocation) {
      try {
        const t1State = await apiRequest('/api/t1_state', { method: 'GET' });
        if (t1State && t1State.ready !== false && t1State.lat && t1State.lng) {
          this.cachedTruckLocation = {
            latitude: t1State.lat,
            longitude: t1State.lng,
            heading: 0,
            speedKmH: t1State.moving ? 20 : 0,
            lastUpdated: new Date().toISOString(), pathIndex: t1State?.path_index,
          };
        }
      } catch {
        // Fallback
      }
    }
    return this.cachedTruckLocation;
  }

  private isInitializing: boolean = false;

  /**
   * Auto-bootstrap backend if database is empty or T1 fleet is uninitialized
   */
  private async autoInitializeBackend(): Promise<void> {
    if (this.isInitializing) return;
    this.isInitializing = true;
    try {
      await apiRequest('/api/generate_city', { method: 'POST', body: {} }).catch(() => null);
      await apiRequest('/api/auto_select_garbage', { method: 'POST', body: { count: 10 } }).catch(() => null);
      await apiRequest('/api/optimize_route', { method: 'POST', body: {} }).catch(() => null);
      await apiRequest('/api/spawn_truck', { method: 'POST', body: {} }).catch(() => null);
    } catch {
      // Silently ignore bootstrap failure
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Start route on backend via POST /api/start_t1_route
   */
  async startRoute(routeId?: string): Promise<Route | null> {
    this.isRouteStartedLocally = true;
    try {
      await apiRequest('/api/start_t1_route', {
        method: 'POST',
        body: {},
      });
    } catch {
      // Silently catch endpoint errors if backend T1 memory thread is uninitialized
    }
    this.lastT1StateJson = '';
    this.lastRoutesJson = '';
    await this.fetchRouteInternal();
    this.notifyListeners();
    return this.cachedRoute;
  }



  /**
   * Collect stop via POST /api/mark_house_complete & POST /api/collect_stop
   */
  async collectStop(stopId: string): Promise<RouteStop | null> {
    this.collectedStopIds.add(stopId);
    this.skippedStopIds.delete(stopId);

    // Call PostgreSQL persistence endpoint first (updates locations & collection_history tables)
    try {
      await apiRequest('/api/mark_house_complete', {
        method: 'POST',
        body: { house_id: stopId, truck_id: APP_CONFIG.defaultTruckId },
      });
    } catch {
      // Ignore fallback
    }

    // Call simulation thread collection endpoint
    try {
      await apiRequest('/api/collect_stop', {
        method: 'POST',
        body: { house_id: stopId, truck_id: APP_CONFIG.defaultTruckId },
      });
    } catch {
      // Ignore fallback
    }

    this.lastT1StateJson = '';
    this.lastRoutesJson = '';
    await this.fetchRouteInternal();
    this.notifyListeners();
    return this.getRouteStopById(stopId);
  }

  /**
   * Skip stop via POST /api/skip_stop
   */
  async skipStop(stopId: string, reason?: string): Promise<RouteStop | null> {
    this.skippedStopIds.add(stopId);
    this.collectedStopIds.delete(stopId);

    try {
      await apiRequest('/api/skip_stop', {
        method: 'POST',
        body: { house_id: stopId, reason },
      });
    } catch {
      // Ignore fallback
    }

    this.lastT1StateJson = '';
    this.lastRoutesJson = '';
    await this.fetchRouteInternal();
    this.notifyListeners();
    return this.getRouteStopById(stopId);
  }


  async getRouteStopById(stopId: string): Promise<RouteStop | null> {
    const route = await this.getRoute();
    if (!route) return null;
    const stop = route.stops.find((s) => s.id === stopId);
    return stop ? { ...stop } : null;
  }

  async getNextStop(routeId?: string): Promise<RouteStop | null> {
    const route = await this.getRoute();
    if (!route) return null;
    const sortedStops = [...route.stops].sort((a, b) => a.sequence - b.sequence);
    const inProgress = sortedStops.find((s) => s.status === 'IN_PROGRESS');
    if (inProgress) return { ...inProgress };
    const pending = sortedStops.find((s) => s.status === 'PENDING');
    if (pending) return { ...pending };
    return null;
  }

  /**
   * Push driver GPS coordinates to backend via POST /api/update_truck_position
   */
  async updateTruckLocation(
    latitude: number,
    longitude: number,
    heading?: number,
    speedKmH?: number
  ): Promise<TruckLocation | null> {
    const updatedLocation: TruckLocation = {
      latitude,
      longitude,
      heading: heading ?? 0,
      speedKmH: speedKmH ?? 0,
      lastUpdated: new Date().toISOString(), pathIndex: t1State?.path_index,
    };

    this.cachedTruckLocation = updatedLocation;

    try {
      await apiRequest('/api/update_truck_position', {
        method: 'POST',
        body: {
          truck_id: APP_CONFIG.defaultTruckId,
          lat: latitude,
          lng: longitude,
          pathIndex: 0,
          stopped: speedKmH === 0,
        },
      });
    } catch {
      // Non-blocking
    }

    this.notifyListeners();
    return updatedLocation;
  }
}
