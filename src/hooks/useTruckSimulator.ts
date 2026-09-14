import { useEffect } from 'react';
import { truckSimulatorService, ENABLE_SIMULATOR } from '../services/truckSimulatorService';

/**
 * Custom React Hook for managing the development T1 vehicle simulator.
 * Completely isolated from map rendering and UI component code.
 */
export const useTruckSimulator = (intervalMs: number = 1500) => {
  useEffect(() => {
    if (ENABLE_SIMULATOR) {
      truckSimulatorService.startSimulation(intervalMs);
    }

    return () => {
      truckSimulatorService.stopSimulation();
    };
  }, [intervalMs]);
};
