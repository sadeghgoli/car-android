import type { MapCoordinate } from '../types/domain';

export type MunicipalRegion = {
  id: string;
  title: string;
  /** GeoJSON ring [lng, lat][], closed */
  polygon: GeoJSON.Polygon;
};

/**
 * سه منطقه عملیاتی سبزوار — پلیگان‌های مجاور (نه دایره).
 * منطقه یک: غرب و مرکز غربی | منطقه دو: شرق و جنوب‌شرق | منطقه سه: شمال
 */
export const MUNICIPAL_REGIONS: MunicipalRegion[] = [
  {
    id: 'region-1',
    title: 'منطقه یک',
    polygon: {
      type: 'Polygon',
      coordinates: [
        [
          [57.6502, 36.1984],
          [57.6578, 36.1896],
          [57.6724, 36.1878],
          [57.6815, 36.1902],
          [57.6834, 36.2048],
          [57.6815, 36.2182],
          [57.6768, 36.2316],
          [57.6654, 36.2378],
          [57.6528, 36.2284],
          [57.6486, 36.2142],
          [57.6502, 36.1984],
        ],
      ],
    },
  },
  {
    id: 'region-2',
    title: 'منطقه دو',
    polygon: {
      type: 'Polygon',
      coordinates: [
        [
          [57.6815, 36.1902],
          [57.6968, 36.1884],
          [57.7126, 36.1922],
          [57.7218, 36.2016],
          [57.7234, 36.2118],
          [57.7148, 36.2186],
          [57.6982, 36.2204],
          [57.6842, 36.2188],
          [57.6815, 36.2182],
          [57.6834, 36.2048],
          [57.6815, 36.1902],
        ],
      ],
    },
  },
  {
    id: 'region-3',
    title: 'منطقه سه',
    polygon: {
      type: 'Polygon',
      coordinates: [
        [
          [57.6768, 36.2316],
          [57.6815, 36.2182],
          [57.6842, 36.2188],
          [57.6982, 36.2204],
          [57.7148, 36.2186],
          [57.7226, 36.2268],
          [57.7184, 36.2396],
          [57.7022, 36.2448],
          [57.6846, 36.2432],
          [57.6654, 36.2378],
          [57.6768, 36.2316],
        ],
      ],
    },
  },
];

export const DEFAULT_REGION_ID = 'region-1';

export function getRegionById(regionId?: string | null): MunicipalRegion | null {
  if (!regionId) {
    return null;
  }
  return MUNICIPAL_REGIONS.find((region) => region.id === regionId) ?? null;
}

export function getRegionTitle(regionId?: string | null): string {
  return getRegionById(regionId)?.title ?? '—';
}

function pointInRing(lng: number, lat: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersect) {
      inside = !inside;
    }
  }
  return inside;
}

export function pointInPolygon(
  coordinate: MapCoordinate,
  polygon: GeoJSON.Polygon,
): boolean {
  const [outer, ...holes] = polygon.coordinates;
  if (!outer || !pointInRing(coordinate.longitude, coordinate.latitude, outer)) {
    return false;
  }
  return !holes.some((hole) =>
    pointInRing(coordinate.longitude, coordinate.latitude, hole),
  );
}

export function isCoordinateInRegion(
  coordinate: MapCoordinate,
  regionId?: string | null,
): boolean {
  const region = getRegionById(regionId);
  if (!region) {
    return false;
  }
  return pointInPolygon(coordinate, region.polygon);
}

export function findRegionIdForCoordinate(coordinate: MapCoordinate): string | null {
  return (
    MUNICIPAL_REGIONS.find((region) =>
      pointInPolygon(coordinate, region.polygon),
    )?.id ?? null
  );
}
