import { useState, useEffect } from 'react';
import { LocationData, locationProvider } from '../services/locationProvider';

/**
 * Custom React Hook providing reactive access to current truck location
 * via the locationProvider abstraction boundary.
 */
export const useLocation = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    locationProvider.getCurrentLocation().then((loc) => {
      if (loc) setLocation(loc);
      setIsLoading(false);
    });

    const unsubscribe = locationProvider.subscribeLocation((newLoc) => {
      setLocation(newLoc);
    });

    return unsubscribe;
  }, []);

  return {
    location,
    isLoading,
  };
};
