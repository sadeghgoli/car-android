import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
  Marker,
  NetworkManager,
  TransformRequestManager,
  type CameraRef,
  type MapRef,
} from '@maplibre/maplibre-react-native';
import { Colors } from '../../constants';
import {
  SABZEVAR_MAP,
  appendTileKey,
  zoomFromLatitudeDelta,
} from '../../constants/mapConfig';
import type { VehicleRequest } from '../../types/domain';
import { lineString } from '../../utils/geo';
import { RequestMapPin, VehicleMapPuck, requestPinColor } from './MapMarkers';
import type { HomeMapHandle, HomeMapProps, MapRegion } from './types';

export const SabzevarMapNative = forwardRef<HomeMapHandle, HomeMapProps>(
  function SabzevarMapNative(
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
    const cameraRef = useRef<CameraRef>(null);
    const mapRef = useRef<MapRef>(null);
    const initialRegionRef = useRef(region);
    const [isLoading, setIsLoading] = useState(true);
    const [mapError, setMapError] = useState<string | null>(null);

    const mapStyle = useMemo(
      () => appendTileKey(SABZEVAR_MAP.styleUrl),
      [],
    );

    const initialZoom = zoomFromLatitudeDelta(
      initialRegionRef.current.latitudeDelta,
    );

    const coverageShape = useMemo(() => {
      if (!coveragePolygon) {
        return null;
      }
      return {
        type: 'Feature' as const,
        properties: {},
        geometry: coveragePolygon,
      };
    }, [coveragePolygon]);

    const routeShape = useMemo(() => {
      if (routeCoordinates.length < 2) {
        return null;
      }
      return {
        type: 'Feature' as const,
        properties: {},
        geometry: lineString(routeCoordinates),
      };
    }, [routeCoordinates]);

    useEffect(() => {
      NetworkManager.setConnected(true);
      const paramId = TransformRequestManager.addUrlSearchParam({
        id: 'sabzevar-tile-key',
        match: 'geo\\.sabzevar\\.ir',
        name: 'key',
        value: SABZEVAR_MAP.tileApiKey,
      });
      return () => {
        TransformRequestManager.removeUrlSearchParam(paramId);
      };
    }, []);

    useImperativeHandle(ref, () => ({
      animateToRegion: (next: MapRegion, duration = 1000) => {
        cameraRef.current?.flyTo({
          center: [next.longitude, next.latitude],
          zoom: zoomFromLatitudeDelta(next.latitudeDelta),
          pitch: SABZEVAR_MAP.pitch,
          bearing: SABZEVAR_MAP.bearing,
          duration,
        });
      },
    }));

    return (
      <View style={styles.container}>
        <Map
          ref={mapRef}
          style={styles.map}
          mapStyle={mapStyle}
          logo={false}
          attribution={false}
          compass={false}
          scaleBar={false}
          touchPitch={false}
          touchRotate={false}
          onDidFinishLoadingMap={() => {
            setIsLoading(false);
            setMapError(null);
          }}
          onDidFinishLoadingStyle={() => {
            setIsLoading(false);
            setMapError(null);
          }}
          onDidFailLoadingMap={() => {
            setIsLoading(false);
            setMapError(
              'بارگذاری نقشه ناموفق بود. فیلترشکن را روشن کنید و دوباره تلاش کنید.',
            );
          }}
        >
          <Camera
            ref={cameraRef}
            minZoom={SABZEVAR_MAP.minZoom}
            maxZoom={SABZEVAR_MAP.maxZoom}
            initialViewState={{
              center: [
                initialRegionRef.current.longitude,
                initialRegionRef.current.latitude,
              ],
              zoom: initialZoom,
              pitch: SABZEVAR_MAP.pitch,
              bearing: SABZEVAR_MAP.bearing,
            }}
          />

          {coverageShape ? (
            <GeoJSONSource id="region-coverage" data={coverageShape}>
              <Layer
                id="region-fill"
                type="fill"
                paint={{
                  'fill-color': Colors.primary,
                  'fill-opacity': 0.14,
                }}
              />
              <Layer
                id="region-line"
                type="line"
                paint={{
                  'line-color': Colors.primaryDark,
                  'line-width': 2,
                }}
              />
            </GeoJSONSource>
          ) : null}

          {routeShape ? (
            <GeoJSONSource id="route" data={routeShape}>
              <Layer
                id="route-line"
                type="line"
                paint={{
                  'line-color': Colors.primaryDark,
                  'line-width': 4,
                }}
              />
            </GeoJSONSource>
          ) : null}

          {requests.map((item: VehicleRequest) => (
            <Marker
              key={item.id}
              id={item.id}
              lngLat={[item.longitude, item.latitude]}
              anchor="bottom"
              onPress={(event) => {
                event.stopPropagation?.();
                onRequestPress?.(item);
              }}
            >
              <RequestMapPin color={requestPinColor(item)} />
            </Marker>
          ))}

          {vehicleCoordinate ? (
            <Marker
              id="vehicle"
              lngLat={[vehicleCoordinate.longitude, vehicleCoordinate.latitude]}
              anchor="center"
            >
              <VehicleMapPuck />
            </Marker>
          ) : null}
        </Map>

        {isLoading ? (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator color={Colors.primary} size="large" />
            <Text style={styles.loadingText}>در حال بارگذاری نقشه...</Text>
          </View>
        ) : null}

        {mapError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{mapError}</Text>
          </View>
        ) : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#d9e2ec',
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(217,226,236,0.45)',
  },
  loadingText: {
    color: Colors.textPrimary,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  errorBanner: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 24,
    backgroundColor: 'rgba(39,50,71,0.94)',
    borderRadius: 12,
    padding: 14,
  },
  errorText: {
    color: '#fff',
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 22,
  },
});
