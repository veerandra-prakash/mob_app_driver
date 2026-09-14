import { routeRepository } from './routeRepository';

/**
 * Location Data Contract
 */
export interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: string;
  lastUpdated: string;
  heading?: number;
  speedKmH?: number;
}

/**
 * LocationProvider Abstraction Interface
 * --------------------------------------
 * Decouples map & dashboard UI components from underlying location hardware.
 * 
 * To switch to real device GPS hardware in the future:
 * 1. Create `GPSLocationProvider` implementing `ILocationProvider` using `expo-location`.
 * 2. Replace `export const locationProvider: ILocationProvider = new GPSLocationProvider()`.
 * No map or dashboard components will need to be rewritten.
 */
export interface ILocationProvider {
  getCurrentLocation(): Promise<LocationData | null>;
  subscribeLocation(callback: (location: LocationData) => void): () => void;
}

/**
 * MockLocationProvider
 * --------------------
 * Current local development implementation using local state & T1 simulator.
 */
class MockLocationProvider implements ILocationProvider {
  async getCurrentLocation(): Promise<LocationData | null> {
    const loc = await routeRepository.getTruckLocation();
    if (!loc) return null;
    return {
      latitude: loc.latitude,
      longitude: loc.longitude,
      timestamp: loc.lastUpdated,
      lastUpdated: loc.lastUpdated,
      heading: loc.heading,
      speedKmH: loc.speedKmH,
    };
  }

  subscribeLocation(callback: (location: LocationData) => void): () => void {
    return routeRepository.subscribe(async () => {
      const loc = await this.getCurrentLocation();
      if (loc) {
        callback(loc);
      }
    });
  }
}

/**
 * Singleton LocationProvider Instance
 */
export const locationProvider: ILocationProvider = new MockLocationProvider();
