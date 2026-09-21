import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageKeys } from '../constants';
import type { AppNotification } from '../types/domain';

const listeners = new Set<(items: AppNotification[]) => void>();

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

async function readAll(): Promise<AppNotification[]> {
  const raw = await AsyncStorage.getItem(StorageKeys.notifications);
  if (!raw) {
    return [];
  }
  try {
    return JSON.parse(raw) as AppNotification[];
  } catch {
    return [];
  }
}

async function writeAll(items: AppNotification[]): Promise<void> {
  await AsyncStorage.setItem(StorageKeys.notifications, JSON.stringify(items));
  listeners.forEach((listener) => listener(items));
}

export async function addNotification(
  input: Omit<AppNotification, 'id' | 'createdAt' | 'read'>,
): Promise<AppNotification> {
  const item: AppNotification = {
    ...input,
    id: uid('ntf'),
    createdAt: new Date().toISOString(),
    read: false,
  };
  const items = await readAll();
  items.unshift(item);
  await writeAll(items.slice(0, 80));
  return item;
}

export async function getNotifications(): Promise<AppNotification[]> {
  return readAll();
}

export async function getUnreadCount(): Promise<number> {
  const items = await readAll();
  return items.filter((item) => !item.read).length;
}

export async function markAllRead(): Promise<void> {
  const items = await readAll();
  await writeAll(items.map((item) => ({ ...item, read: true })));
}

export function subscribeNotifications(
  listener: (items: AppNotification[]) => void,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
