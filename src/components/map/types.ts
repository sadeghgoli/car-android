import type { MapCoordinate, VehicleRequest } from '../../types/domain';

export type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export type HomeMapHandle = {
  animateToRegion: (region: MapRegion, duration?: number) => void;
};

export type HomeMapProps = {
  region: MapRegion;
  requests?: VehicleRequest[];
  vehicleCoordinate?: MapCoordinate | null;
  coveragePolygon?: GeoJSON.Polygon | null;
  routeCoordinates?: MapCoordinate[];
  onRequestPress?: (request: VehicleRequest) => void;
};
