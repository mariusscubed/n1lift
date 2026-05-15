import axios from 'axios';
import Constants from 'expo-constants';

const MAPS_API_KEY = Constants.expoConfig?.extra?.googleMapsApiKey || '';
const GEOCODE_URL  = 'https://maps.googleapis.com/maps/api/geocode/json';
const DIRECTIONS_URL = 'https://maps.googleapis.com/maps/api/directions/json';

export interface LatLng { lat: number; lng: number; }

export interface RouteResult {
  distanceKm: number;
  durationMin: number;
  polyline: string; // encoded polyline for react-native-maps
}

/**
 * Geocode a human-readable address to lat/lng coordinates.
 */
export async function geocodeAddress(address: string): Promise<LatLng> {
  const { data } = await axios.get(GEOCODE_URL, {
    params: { address, key: MAPS_API_KEY },
  });
  if (data.status !== 'OK') throw new Error(`Geocoding failed: ${data.status}`);
  return data.results[0].geometry.location;
}

/**
 * Get route info (distance, duration, encoded polyline) between two points.
 */
export async function getRoute(origin: LatLng, destination: LatLng): Promise<RouteResult> {
  const { data } = await axios.get(DIRECTIONS_URL, {
    params: {
      origin:      `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      key:         MAPS_API_KEY,
    },
  });

  if (data.status !== 'OK') throw new Error(`Directions failed: ${data.status}`);

  const leg = data.routes[0].legs[0];
  return {
    distanceKm:  leg.distance.value / 1000,
    durationMin: Math.round(leg.duration.value / 60),
    polyline:    data.routes[0].overview_polyline.points,
  };
}

/**
 * Estimate fuel cost for a given distance.
 * Formula: (distanceKm / fuelEfficiencyKmPerL) * pricePerLitre
 *
 * @param distanceKm       - one-way journey distance in km
 * @param fuelType         - 'Petrol' | 'Diesel' | 'Electric'
 * @param pricePerLitre    - local fuel price (default: £1.55 per litre)
 * @param efficiencyKmPerL - vehicle fuel efficiency (default: 12 km/L)
 */
export function estimateFuelCost(
  distanceKm: number,
  fuelType: string = 'Petrol',
  pricePerLitre: number = 1.55,
  efficiencyKmPerL: number = 12
): number {
  if (fuelType === 'Electric') {
    // Approx: 0.2 kWh/km at £0.28/kWh
    return parseFloat((distanceKm * 0.2 * 0.28).toFixed(2));
  }
  return parseFloat(((distanceKm / efficiencyKmPerL) * pricePerLitre).toFixed(2));
}
