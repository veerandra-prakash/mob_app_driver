import { TruckLocation } from '../types/routeModels';

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

const CURRENT_DRIVER_LOCATION: GeoLocation = {
  latitude: 37.7752,
  longitude: -122.418,
};

export const getCurrentDriverLocation = async (): Promise<GeoLocation> => {
  return CURRENT_DRIVER_LOCATION;
};

export const calculateDistanceKm = (loc1: GeoLocation, loc2: GeoLocation): number => {
  const R = 6371;
  const dLat = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
  const dLon = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((loc1.latitude * Math.PI) / 180) *
      Math.cos((loc2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};
