import { routeRepository } from './routeRepository';
import { APP_CONFIG } from '../config/constants';

/**
 * Development / Demo-Only T1 Movement Simulator
 * ---------------------------------------------
 * Periodically updates Truck T1 coordinates toward the active IN_PROGRESS stop.
 * When T1 arrives at the stop, movement pauses until the driver performs COLLECT or SKIP.
 * 
 * Disabled automatically when APP_CONFIG.useRealBackend is true.
 */
export const ENABLE_SIMULATOR = !APP_CONFIG.useRealBackend;


class TruckSimulatorService {
  private timerId: ReturnType<typeof setInterval> | null = null;
  private isRunning: boolean = false;
  private stepFraction: number = 0.20; // 20% vector movement towards target stop per tick

  startSimulation(intervalMs: number = 1500) {
    if (!ENABLE_SIMULATOR || this.isRunning) return;

    this.isRunning = true;
    this.timerId = setInterval(() => {
      this.tick();
    }, intervalMs);
  }

  stopSimulation() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.isRunning = false;
  }

  private async tick() {
    try {
      const route = await routeRepository.getRoute();
      if (!route || route.status !== 'IN_PROGRESS') return;

      const truckLocation = await routeRepository.getTruckLocation();
      if (!truckLocation) return;

      // Find current active IN_PROGRESS target stop
      const currentStop = route.stops.find((s) => s.status === 'IN_PROGRESS');
      if (!currentStop) return;

      const dLat = currentStop.latitude - truckLocation.latitude;
      const dLon = currentStop.longitude - truckLocation.longitude;
      const distance = Math.sqrt(dLat * dLat + dLon * dLon);

      // Arrival threshold check (~10-15 meters)
      if (distance < 0.0001) {
        // T1 reached current stop; pause movement at stop location until driver performs COLLECT or SKIP
        return;
      }

      // Step movement calculation
      const nextLat = truckLocation.latitude + dLat * this.stepFraction;
      const nextLon = truckLocation.longitude + dLon * this.stepFraction;

      // Heading direction calculation (degrees 0 - 360)
      const heading = (Math.atan2(dLon, dLat) * 180) / Math.PI;

      // Update truck location in repository (notifies map & dashboard reactively)
      await routeRepository.updateTruckLocation(nextLat, nextLon, (heading + 360) % 360, 24);
    } catch (err) {
      console.warn('Simulator error:', err);
    }
  }
}

export const truckSimulatorService = new TruckSimulatorService();
