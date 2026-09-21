import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { DEFAULT_MAP_REGION, StorageKeys } from '../constants';
import type {
  LocationPoint,
  MapCoordinate,
  VehicleSnapshot,
} from '../types/domain';
import { haversineMeters } from '../utils/geo';
import { getCurrentUser } from './authService';
import { logEvent } from './eventService';
import { addNotification } from './notificationService';
import { getActiveRequestId, markArrivedIfNeeded } from './requestService';
import { getSettings } from './settingsService';

const MIN_DISTANCE_M = 25;
const MIN_TIME_MS = 20000;
const MIN_CHANGE_M = 5;
const SPEED_EVENT_COOLDOWN_MS = 45000;

type Listener = (snapshot: VehicleSnapshot) => void;

const listeners = new Set<Listener>();
let watchSub: Location.LocationSubscription | null = null;
let simTimer: ReturnType<typeof setInterval> | null = null;
let lastSaved: LocationPoint | null = null;
let lastSpeedEventAt = 0;
let speedingActive = false;
let lastOperationStatus: LocationPoint['operationStatus'] | null = null;
let followRoute: MapCoordinate[] = [];
let followIndex = 0;
let currentSnapshot: VehicleSnapshot = {
  coordinate: {
    latitude: DEFAULT_MAP_REGION.latitude,
    longitude: DEFAULT_MAP_REGION.longitude,
  },
  speedKmh: 0,
  heading: 0,
  speeding: false,
};

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function notify(snapshot: VehicleSnapshot): void {
  currentSnapshot = snapshot;
  listeners.forEach((listener) => listener(snapshot));
}

async function readLocations(): Promise<LocationPoint[]> {
  const raw = await AsyncStorage.getItem(StorageKeys.locations);
  if (!raw) {
    return [];
  }
  try {
    return JSON.parse(raw) as LocationPoint[];
  } catch {
    return [];
  }
}

async function persistPoint(point: LocationPoint): Promise<void> {
  const items = await readLocations();
  items.push(point);
  await AsyncStorage.setItem(
    StorageKeys.locations,
    JSON.stringify(items.slice(-800)),
  );
}

function shouldPersist(next: MapCoordinate, now: number): boolean {
  if (!lastSaved) {
    return true;
  }
  const distance = haversineMeters(
    { latitude: lastSaved.latitude, longitude: lastSaved.longitude },
    next,
  );
  const elapsed = now - new Date(lastSaved.timestamp).getTime();
  if (distance >= MIN_DISTANCE_M) {
    return true;
  }
  return elapsed >= MIN_TIME_MS && distance >= MIN_CHANGE_M;
}

async function handleFix(input: {
  coordinate: MapCoordinate;
  speedKmh: number;
  heading: number;
  accuracy?: number;
}): Promise<void> {
  const settings = await getSettings();
  const user = await getCurrentUser();
  const activeId = await getActiveRequestId();
  const speeding = input.speedKmh > settings.maxSpeedKmh;
  const snapshot: VehicleSnapshot = {
    ...input,
    speeding,
  };
  notify(snapshot);

  const operationStatus: LocationPoint['operationStatus'] = activeId
    ? 'in_progress'
    : 'idle';
  if (lastOperationStatus !== operationStatus) {
    lastOperationStatus = operationStatus;
    await logEvent({
      type: 'vehicle_status_changed',
      userId: user?.id,
      vehicleId: settings.vehicle.id,
      requestId: activeId ?? undefined,
      latitude: input.coordinate.latitude,
      longitude: input.coordinate.longitude,
      payload: { operationStatus, speeding },
    });
  }

  await markArrivedIfNeeded(input.coordinate);

  const now = Date.now();
  if (shouldPersist(input.coordinate, now)) {
    const point: LocationPoint = {
      id: uid('loc'),
      latitude: input.coordinate.latitude,
      longitude: input.coordinate.longitude,
      timestamp: new Date(now).toISOString(),
      speedKmh: input.speedKmh,
      accuracy: input.accuracy,
      vehicleId: settings.vehicle.id,
      userId: user?.id ?? 'unknown',
      operationStatus,
    };
    lastSaved = point;
    await persistPoint(point);
    await logEvent({
      type: input.speedKmh < 1 ? 'vehicle_stopped' : 'location_recorded',
      userId: user?.id,
      vehicleId: settings.vehicle.id,
      requestId: activeId ?? undefined,
      latitude: point.latitude,
      longitude: point.longitude,
      payload: { speedKmh: point.speedKmh, accuracy: point.accuracy },
    });
    await logEvent({
      type: 'speed_recorded',
      userId: user?.id,
      vehicleId: settings.vehicle.id,
      requestId: activeId ?? undefined,
      latitude: point.latitude,
      longitude: point.longitude,
      payload: { speedKmh: point.speedKmh, maxSpeedKmh: settings.maxSpeedKmh },
    });
  }

  if (speeding && !speedingActive) {
    speedingActive = true;
    if (now - lastSpeedEventAt > SPEED_EVENT_COOLDOWN_MS) {
      lastSpeedEventAt = now;
      await logEvent({
        type: 'speed_exceeded',
        userId: user?.id,
        vehicleId: settings.vehicle.id,
        requestId: activeId ?? undefined,
        latitude: input.coordinate.latitude,
        longitude: input.coordinate.longitude,
        payload: { speedKmh: input.speedKmh, maxSpeedKmh: settings.maxSpeedKmh },
      });
      await addNotification({
        kind: 'speed',
        title: 'عبور از سرعت مجاز',
        body: `سرعت ${Math.round(input.speedKmh)} کیلومتر بر ساعت ثبت شد.`,
      });
    }
  }
  if (!speeding) {
    speedingActive = false;
  }
}

function startSimulation(): void {
  if (simTimer) {
    return;
  }
  let angle = 0;
  simTimer = setInterval(() => {
    let coordinate = currentSnapshot.coordinate;
    let heading = currentSnapshot.heading;
    let speedKmh = 28;

    if (followRoute.length > 1) {
      followIndex = Math.min(followIndex + 1, followRoute.length - 1);
      const next = followRoute[followIndex];
      const prev = followRoute[Math.max(0, followIndex - 1)];
      coordinate = next;
      heading =
        (Math.atan2(
          next.longitude - prev.longitude,
          next.latitude - prev.latitude,
        ) *
          180) /
        Math.PI;
      speedKmh = followIndex % 18 === 0 ? 68 : 34;
    } else {
      angle += 8;
      const radius = 0.0018;
      coordinate = {
        latitude: DEFAULT_MAP_REGION.latitude + Math.sin((angle * Math.PI) / 180) * radius,
        longitude:
          DEFAULT_MAP_REGION.longitude + Math.cos((angle * Math.PI) / 180) * radius,
      };
      heading = angle;
      speedKmh = angle > 140 && angle < 190 ? 72 : 26;
    }

    void handleFix({
      coordinate,
      speedKmh,
      heading,
      accuracy: 12,
    });
  }, 2500);
}

export function setFollowRoute(route: MapCoordinate[] | null): void {
  followRoute = route ?? [];
  followIndex = 0;
}

export function getSnapshot(): VehicleSnapshot {
  return currentSnapshot;
}

export function subscribeLocation(listener: Listener): () => void {
  listeners.add(listener);
  listener(currentSnapshot);
  return () => {
    listeners.delete(listener);
  };
}

export async function startTracking(): Promise<void> {
  if (watchSub || simTimer) {
    return;
  }

  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status === 'granted') {
      watchSub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 4000,
          distanceInterval: 8,
        },
        (fix) => {
          const speedMs = fix.coords.speed ?? 0;
          void handleFix({
            coordinate: {
              latitude: fix.coords.latitude,
              longitude: fix.coords.longitude,
            },
            speedKmh: Math.max(0, speedMs * 3.6),
            heading: fix.coords.heading ?? 0,
            accuracy: fix.coords.accuracy ?? undefined,
          });
        },
      );
      return;
    }
  } catch {
    // fall through to simulation
  }

  startSimulation();
}

export function stopTracking(): void {
  watchSub?.remove();
  watchSub = null;
  if (simTimer) {
    clearInterval(simTimer);
    simTimer = null;
  }
}

export async function getLocationHistory(): Promise<LocationPoint[]> {
  return readLocations();
}
