import type { MapCoordinate } from '../types/domain';

const EARTH_RADIUS_M = 6371000;

export function haversineMeters(a: MapCoordinate, b: MapCoordinate): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function destinationPoint(
  origin: MapCoordinate,
  distanceMeters: number,
  bearingDeg: number,
): MapCoordinate {
  const angular = distanceMeters / EARTH_RADIUS_M;
  const bearing = toRad(bearingDeg);
  const lat1 = toRad(origin.latitude);
  const lng1 = toRad(origin.longitude);
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angular) +
      Math.cos(lat1) * Math.sin(angular) * Math.cos(bearing),
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angular) * Math.cos(lat1),
      Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2),
    );
  return {
    latitude: toDeg(lat2),
    longitude: toDeg(lng2),
  };
}

export function lineString(points: MapCoordinate[]): GeoJSON.LineString {
  return {
    type: 'LineString',
    coordinates: points.map((point) => [point.longitude, point.latitude]),
  };
}

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

function toDeg(value: number): number {
  return (value * 180) / Math.PI;
}
