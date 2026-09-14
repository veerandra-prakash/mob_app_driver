import { useState, useEffect, useCallback } from 'react';
import {
  Route,
  RouteStop,
  TruckLocation,
  Truck,
  Driver,
} from '../types/routeModels';
import { routeRepository } from '../services/routeRepository';

/**
 * Custom React Hook providing reactive access to the Driver App service layer.
 * Subscribes to routeRepository state events to trigger automatic UI re-renders.
 */
import { locationProvider } from '../services/locationProvider';

export const useRoute = () => {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [truck, setTruck] = useState<Truck | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [truckLocation, setTruckLocation] = useState<TruckLocation | null>(null);
  const [currentStop, setCurrentStop] = useState<RouteStop | null>(null);
  const [nextStop, setNextStop] = useState<RouteStop | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [driverData, truckData, routeData, locData] = await Promise.all([
        routeRepository.getDriver(),
        routeRepository.getTruck(),
        routeRepository.getRoute(),
        locationProvider.getCurrentLocation(),
      ]);

      setDriver(driverData);
      setTruck(truckData);
      setRoute(routeData);
      setTruckLocation(locData);

      if (routeData) {
        const sorted = [...routeData.stops].sort((a, b) => a.sequence - b.sequence);
        const inProgress = sorted.find((s) => s.status === 'IN_PROGRESS') || null;
        const upcomingPending = sorted.filter((s) => s.status === 'PENDING');
        
        setCurrentStop(inProgress || (upcomingPending.length > 0 && routeData.status === 'IN_PROGRESS' ? upcomingPending[0] : null));
        setNextStop(inProgress ? upcomingPending[0] || null : upcomingPending[1] || null);
      }
    } catch (err) {
      setError('Failed to load application state.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 5. startRoute()
  const startRoute = useCallback(async (): Promise<Route | null> => {
    const updated = await routeRepository.startRoute();
    return updated;
  }, []);

  // 6. collectStop(stopId)
  const collectStop = useCallback(async (stopId: string): Promise<RouteStop | null> => {
    const updated = await routeRepository.collectStop(stopId);
    return updated;
  }, []);

  // 7. skipStop(stopId, reason)
  const skipStop = useCallback(async (stopId: string, reason?: string): Promise<RouteStop | null> => {
    const updated = await routeRepository.skipStop(stopId, reason);
    return updated;
  }, []);

  // Subscribe to in-memory state mutations from routeRepository
  useEffect(() => {
    loadData();
    const unsubscribe = routeRepository.subscribe(() => {
      loadData();
    });
    return unsubscribe;
  }, [loadData]);

  return {
    driver,
    truck,
    route,
    truckLocation,
    currentStop,
    nextStop,
    isLoading,
    error,
    refresh: loadData,
    startRoute,
    collectStop,
    skipStop,
  };
};
