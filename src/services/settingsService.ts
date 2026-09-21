import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageKeys } from '../constants';
import { DEFAULT_REGION_ID, getRegionTitle } from '../constants/regions';
import type { TabletSettings } from '../types/domain';

export const DEFAULT_SETTINGS: TabletSettings = {
  maxSpeedKmh: 60,
  allowNewWhileOpen: true,
  vehicle: {
    id: 'veh-12',
    plate: '۱۲ ب ۳۴۵ ایران ۳۶',
    code: '12',
    type: 'وانت خدمات شهری',
    model: 'آریسان',
    title: 'خودروی شماره ۱۲',
    unit: 'واحد راهداری',
    regionId: DEFAULT_REGION_ID,
    regionTitle: getRegionTitle(DEFAULT_REGION_ID),
  },
};

const listeners = new Set<(settings: TabletSettings) => void>();

export async function getSettings(): Promise<TabletSettings> {
  const raw = await AsyncStorage.getItem(StorageKeys.settings);
  if (!raw) {
    return { ...DEFAULT_SETTINGS, vehicle: { ...DEFAULT_SETTINGS.vehicle } };
  }
  try {
    const stored = JSON.parse(raw) as TabletSettings;
    const regionId = stored.vehicle?.regionId || DEFAULT_SETTINGS.vehicle.regionId;
    return {
      ...DEFAULT_SETTINGS,
      ...stored,
      vehicle: {
        ...DEFAULT_SETTINGS.vehicle,
        ...stored.vehicle,
        regionId,
        regionTitle: stored.vehicle?.regionTitle || getRegionTitle(regionId),
      },
    };
  } catch {
    return { ...DEFAULT_SETTINGS, vehicle: { ...DEFAULT_SETTINGS.vehicle } };
  }
}

export async function saveSettings(
  settings: TabletSettings,
): Promise<TabletSettings> {
  await AsyncStorage.setItem(StorageKeys.settings, JSON.stringify(settings));
  listeners.forEach((listener) => listener(settings));
  return settings;
}

export function subscribeSettings(
  listener: (settings: TabletSettings) => void,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
