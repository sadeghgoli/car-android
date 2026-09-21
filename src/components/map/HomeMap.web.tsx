import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import {
  MAPLIBRE_CSS,
  MAPLIBRE_JS,
  MAPLIBRE_RTL_JS,
} from '../../assets/maplibre/bundledAssets';
import { Colors } from '../../constants';
import {
  SABZEVAR_MAP,
  appendTileKey,
  zoomFromLatitudeDelta,
} from '../../constants/mapConfig';
import type { VehicleRequest } from '../../types/domain';
import { lineString } from '../../utils/geo';
import type { HomeMapHandle, HomeMapProps, MapRegion } from './types';

type MapLibreNS = typeof import('maplibre-gl');
type MapInstance = InstanceType<MapLibreNS['Map']>;
type MarkerInstance = InstanceType<MapLibreNS['Marker']>;

declare global {
  interface Window {
    maplibregl?: MapLibreNS;
  }
}

let scriptsReady: Promise<MapLibreNS> | null = null;

function ensureLocalMapLibre(): Promise<MapLibreNS> {
  if (typeof window !== 'undefined' && window.maplibregl) {
    return Promise.resolve(window.maplibregl);
  }
  if (scriptsReady) {
    return scriptsReady;
  }

  scriptsReady = new Promise((resolve, reject) => {
    try {
      if (!document.getElementById('sabzevar-maplibre-css')) {
        const style = document.createElement('style');
        style.id = 'sabzevar-maplibre-css';
        style.textContent = MAPLIBRE_CSS;
        document.head.appendChild(style);
      }

      if (!document.getElementById('sabzevar-maplibre-js')) {
        const script = document.createElement('script');
        script.id = 'sabzevar-maplibre-js';
        script.text = MAPLIBRE_JS;
        document.head.appendChild(script);
      }

      const api = window.maplibregl;
      if (!api) {
        reject(new Error('maplibregl failed to load from local assets'));
        return;
      }

      try {
        const rtlBlob = new Blob([MAPLIBRE_RTL_JS], {
          type: 'application/javascript',
        });
        void api.setRTLTextPlugin(URL.createObjectURL(rtlBlob), true);
      } catch {
        // ignore duplicate RTL plugin
      }

      resolve(api);
    } catch (error) {
      reject(error);
    }
  });

  return scriptsReady;
}

function createPin(color: string): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cssText =
    'width:28px;height:36px;cursor:pointer;filter:drop-shadow(0 1px 3px rgba(0,0,0,.35));';
  el.innerHTML = `<svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 1C7.4 1 2 6.4 2 13c0 8.3 12 21 12 21s12-12.7 12-21C26 6.4 20.6 1 14 1z" fill="${color}" stroke="#fff" stroke-width="2"/>
    <circle cx="14" cy="13" r="5" fill="#fff"/>
  </svg>`;
  return el;
}

function createVehicleEl(): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cssText =
    'width:44px;height:44px;display:flex;align-items:center;justify-content:center;pointer-events:none;';
  el.innerHTML = `<span style="
      position:absolute;width:44px;height:44px;border-radius:22px;
      background:rgba(47,200,150,.22);
    "></span>
    <span style="
      width:16px;height:16px;border-radius:8px;background:${Colors.primaryDark};
      border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3);
    "></span>`;
  el.style.position = 'relative';
  return el;
}

function pinColor(request: VehicleRequest): string {
  if (request.status === 'in_progress') {
    return Colors.inProgress;
  }
  return request.priority === 'critical' ? Colors.critical : Colors.normal;
}

export const HomeMap = forwardRef<HomeMapHandle, HomeMapProps>(
  function HomeMap(
    {
      region,
      requests = [],
      vehicleCoordinate,
      coveragePolygon = null,
      routeCoordinates = [],
      onRequestPress,
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<MapInstance | null>(null);
    const maplibreRef = useRef<MapLibreNS | null>(null);
    const [ready, setReady] = useState(false);
    const requestMarkersRef = useRef<MarkerInstance[]>([]);
    const vehicleMarkerRef = useRef<MarkerInstance | null>(null);
    const onRequestPressRef = useRef(onRequestPress);
    onRequestPressRef.current = onRequestPress;

    useImperativeHandle(ref, () => ({
      animateToRegion: (next: MapRegion, duration = 1000) => {
        mapRef.current?.flyTo({
          center: [next.longitude, next.latitude],
          zoom: zoomFromLatitudeDelta(next.latitudeDelta),
          duration,
          pitch: SABZEVAR_MAP.pitch,
        });
      },
    }));

    useEffect(() => {
      let cancelled = false;
      let fallbackTimer: ReturnType<typeof setTimeout> | undefined;

      void (async () => {
        if (!containerRef.current || mapRef.current) {
          return;
        }

        try {
          const maplibregl = await ensureLocalMapLibre();
          if (cancelled || !containerRef.current) {
            return;
          }
          maplibreRef.current = maplibregl;

          const map = new maplibregl.Map({
            container: containerRef.current,
            style: SABZEVAR_MAP.styleUrl,
            center: [region.longitude, region.latitude],
            zoom: zoomFromLatitudeDelta(region.latitudeDelta),
            pitch: SABZEVAR_MAP.pitch,
            bearing: SABZEVAR_MAP.bearing,
            attributionControl: false,
            dragRotate: false,
            touchPitch: false,
            maxZoom: SABZEVAR_MAP.maxZoom,
            minZoom: SABZEVAR_MAP.minZoom,
            transformRequest: (url: string, resourceType?: string) => {
              if (resourceType === 'Tile') {
                return { url: appendTileKey(url) };
              }
              return { url };
            },
          });

          mapRef.current = map;

          const markReady = () => {
            if (!cancelled) {
              setReady(true);
            }
          };
          map.once('load', markReady);
          map.once('idle', markReady);
          fallbackTimer = setTimeout(markReady, 2500);
        } catch {
          if (!cancelled) {
            setReady(true);
          }
        }
      })();

      return () => {
        cancelled = true;
        if (fallbackTimer) {
          clearTimeout(fallbackTimer);
        }
        mapRef.current?.remove();
        mapRef.current = null;
      };
    }, []);

    useEffect(() => {
      const map = mapRef.current;
      const maplibregl = maplibreRef.current;
      if (!map || !maplibregl || !ready) {
        return;
      }

      requestMarkersRef.current.forEach((marker) => marker.remove());
      requestMarkersRef.current = [];

      requests.forEach((request) => {
        const el = createPin(pinColor(request));
        el.addEventListener('click', (event) => {
          event.stopPropagation();
          onRequestPressRef.current?.(request);
        });
        const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([request.longitude, request.latitude])
          .addTo(map);
        requestMarkersRef.current.push(marker);
      });
    }, [ready, requests]);

    useEffect(() => {
      const map = mapRef.current;
      const maplibregl = maplibreRef.current;
      if (!map || !maplibregl || !ready) {
        return;
      }
      vehicleMarkerRef.current?.remove();
      vehicleMarkerRef.current = null;
      if (!vehicleCoordinate) {
        return;
      }
      vehicleMarkerRef.current = new maplibregl.Marker({
        element: createVehicleEl(),
      })
        .setLngLat([vehicleCoordinate.longitude, vehicleCoordinate.latitude])
        .addTo(map);
    }, [ready, vehicleCoordinate]);

    useEffect(() => {
      const map = mapRef.current;
      if (!map || !ready) {
        return;
      }

      const upsert = (
        sourceId: string,
        layerId: string,
        data: GeoJSON.GeoJSON | null,
        type: 'fill' | 'line',
        paint: Record<string, unknown>,
      ) => {
        if (!data) {
          if (map.getLayer(layerId)) {
            map.removeLayer(layerId);
          }
          if (map.getSource(sourceId)) {
            map.removeSource(sourceId);
          }
          return;
        }
        const source = map.getSource(sourceId) as
          | { setData: (value: GeoJSON.GeoJSON) => void }
          | undefined;
        if (source) {
          source.setData(data);
          return;
        }
        map.addSource(sourceId, { type: 'geojson', data });
        map.addLayer({
          id: layerId,
          type,
          source: sourceId,
          paint,
        } as Parameters<MapInstance['addLayer']>[0]);
      };

      upsert(
        'region-coverage',
        'region-fill',
        coveragePolygon
          ? {
              type: 'Feature',
              properties: {},
              geometry: coveragePolygon,
            }
          : null,
        'fill',
        { 'fill-color': Colors.primary, 'fill-opacity': 0.14 },
      );
      upsert(
        'region-coverage-outline',
        'region-line',
        coveragePolygon
          ? {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: coveragePolygon.coordinates[0],
              },
            }
          : null,
        'line',
        { 'line-color': Colors.primaryDark, 'line-width': 2 },
      );
      upsert(
        'route',
        'route-line',
        routeCoordinates.length > 1
          ? {
              type: 'Feature',
              properties: {},
              geometry: lineString(routeCoordinates),
            }
          : null,
        'line',
        { 'line-color': Colors.primaryDark, 'line-width': 4 },
      );
    }, [ready, coveragePolygon, routeCoordinates]);

    return (
      <View style={styles.container}>
        <div ref={containerRef} style={styles.mapDom} />
        {!ready ? (
          <View style={styles.loading}>
            <ActivityIndicator color={Colors.primary} size="large" />
          </View>
        ) : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#f0f0f0',
  },
  mapDom: {
    width: '100%',
    height: '100%',
  },
  loading: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(240,240,240,0.55)',
  },
});
