import { CAR_LOCATION_API_URL, CAR_REFERRAL_API_URL } from '../constants/apiConfig';
import type { Vehicle } from '../types/domain';
import { apiJson } from './apiClient';
import { getSettings, saveSettings } from './settingsService';

type ApiVehicle = {
  id: string;
  plateNumber: string;
  vehicleType: string;
  relatedGroup: string;
  isActive: boolean;
};

type VehicleSettingsDto = {
  vehicleId: string;
  maxSpeedKmh?: number | null;
  allowNewMissionWhileInProgress: boolean;
};

export async function listRegisteredVehicles(): Promise<ApiVehicle[]> {
  const rows = await apiJson<ApiVehicle[]>(
    CAR_LOCATION_API_URL,
    '/api/v1/vehicles',
  );
  return rows.filter((row) => row.isActive !== false);
}

export function mapApiVehicleToTabletVehicle(row: ApiVehicle): Vehicle {
  return {
    id: row.id,
    plate: row.plateNumber,
    code: row.plateNumber.replace(/\D/g, '').slice(0, 4) || row.id.slice(0, 4),
    type: row.vehicleType,
    model: row.vehicleType,
    title: `${row.relatedGroup || row.vehicleType} — ${row.plateNumber}`,
    unit: row.relatedGroup || '—',
    regionId: row.relatedGroup || 'default',
    regionTitle: row.relatedGroup || '—',
  };
}

export async function selectVehicle(row: ApiVehicle): Promise<void> {
  const vehicle = mapApiVehicleToTabletVehicle(row);
  const settings = await getSettings();
  let maxSpeedKmh = settings.maxSpeedKmh;
  let allowNewWhileOpen = settings.allowNewWhileOpen;

  try {
    const remote = await apiJson<VehicleSettingsDto>(
      CAR_REFERRAL_API_URL,
      `/api/v1/vehicles/${encodeURIComponent(row.id)}/settings`,
    );
    if (remote.maxSpeedKmh != null) {
      maxSpeedKmh = remote.maxSpeedKmh;
    }
    allowNewWhileOpen = remote.allowNewMissionWhileInProgress;
  } catch {
    // keep local defaults if settings endpoint unavailable
  }

  await saveSettings({
    ...settings,
    maxSpeedKmh,
    allowNewWhileOpen,
    vehicle,
  });
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function hasSelectedVehicle(): Promise<boolean> {
  const settings = await getSettings();
  return UUID_RE.test(settings.vehicle.id);
}
