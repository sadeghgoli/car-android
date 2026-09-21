import { DEFAULT_MAP_REGION } from '../constants';
import type { MapCoordinate } from '../types/domain';

type OsrmRouteResponse = {
  code: string;
  routes?: Array<{
    distance: number;
    duration: number;
    geometry: {
      coordinates: [number, number][];
    };
  }>;
};

export async function fetchDrivingRoute(
  origin: MapCoordinate,
  destination: MapCoordinate,
): Promise<{
  coordinates: MapCoordinate[];
  distanceMeters: number;
  durationSeconds: number;
}> {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${origin.longitude},${origin.latitude};` +
    `${destination.longitude},${destination.latitude}` +
    `?overview=full&geometries=geojson&steps=false`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OSRM HTTP ${response.status}`);
    }

    const data = (await response.json()) as OsrmRouteResponse;
    const route = data.routes?.[0];
    if (data.code !== 'Ok' || !route?.geometry?.coordinates?.length) {
      throw new Error('OSRM returned no route');
    }

    return {
      coordinates: route.geometry.coordinates.map(([lng, lat]) => ({
        latitude: lat,
        longitude: lng,
      })),
      distanceMeters: route.distance,
      durationSeconds: route.duration,
    };
  } catch {
    return {
      coordinates: [origin, destination],
      distanceMeters: 800,
      durationSeconds: 120,
    };
  }
}

export function fallbackOrigin(): MapCoordinate {
  return {
    latitude: DEFAULT_MAP_REGION.latitude,
    longitude: DEFAULT_MAP_REGION.longitude,
  };
}
