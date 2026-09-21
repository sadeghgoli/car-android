import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageKeys } from '../constants';
import type { AppEvent, AppEventType } from '../types/domain';

const listeners = new Set<(events: AppEvent[]) => void>();

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

async function readEvents(): Promise<AppEvent[]> {
  const raw = await AsyncStorage.getItem(StorageKeys.events);
  if (!raw) {
    return [];
  }
  try {
    return JSON.parse(raw) as AppEvent[];
  } catch {
    return [];
  }
}

async function writeEvents(events: AppEvent[]): Promise<void> {
  await AsyncStorage.setItem(StorageKeys.events, JSON.stringify(events));
  listeners.forEach((listener) => listener(events));
}

export async function logEvent(input: {
  type: AppEventType;
  userId?: string;
  vehicleId?: string;
  requestId?: string;
  latitude?: number;
  longitude?: number;
  payload?: Record<string, unknown>;
}): Promise<AppEvent> {
  const event: AppEvent = {
    id: uid('evt'),
    createdAt: new Date().toISOString(),
    ...input,
  };
  const events = await readEvents();
  events.unshift(event);
  await writeEvents(events.slice(0, 400));
  return event;
}

export async function getEvents(): Promise<AppEvent[]> {
  return readEvents();
}

export function subscribeEvents(
  listener: (events: AppEvent[]) => void,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
