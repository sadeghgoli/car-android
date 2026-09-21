/** Sabzevar municipality MapLibre tile service */
export const SABZEVAR_MAP = {
  styleUrl: 'https://geo.sabzevar.ir:7001/styles/style.json',
  tileApiKey: 'pk_OLH4n87ddaRXbkFXZM_hWn9hTeoKqhRn',
  defaultCenterLngLat: [57.6819, 36.2126] as [number, number],
  defaultZoom: 13,
  minZoom: 0,
  maxZoom: 18,
  pitch: 45,
  bearing: 0,
} as const;

export function appendTileKey(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}key=${SABZEVAR_MAP.tileApiKey}`;
}

export function zoomFromLatitudeDelta(latitudeDelta: number): number {
  const delta = Math.max(latitudeDelta, 0.002);
  return Math.min(
    SABZEVAR_MAP.maxZoom,
    Math.max(11, Math.round(Math.log2(360 / delta))),
  );
}
