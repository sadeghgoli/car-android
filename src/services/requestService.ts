import AsyncStorage from '@react-native-async-storage/async-storage';
import { CAR_REFERRAL_API_URL, REQUEST_API_URL } from '../constants/apiConfig';
import { StorageKeys } from '../constants';
import type {
  MapCoordinate,
  MediaKind,
  RequestMedia,
  RequestResult,
  RequestStatus,
  VehicleRequest,
} from '../types/domain';
import { haversineMeters } from '../utils/geo';
import { getCurrentUser } from './authService';
import { apiJson } from './apiClient';
import { logEvent } from './eventService';
import { addNotification } from './notificationService';
import { fetchDrivingRoute } from './routingService';
import { getSettings } from './settingsService';
import { hasSelectedVehicle } from './vehicleCatalogService';

type MissionQueueItem = {
  missionId: string;
  requestId: string;
  carReferralId: string;
  status: string;
  queueOrder: number;
  createdAtUtc: string;
};

type MissionQueueDto = {
  vehicleId: string;
  items: MissionQueueItem[];
};

type ApiRequestDetail = {
  id: string;
  trackingCode: string;
  description?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
  status: string;
  outcome?: string | null;
  createdAtUtc: string;
  updatedAtUtc?: string | null;
  files?: Array<{
    fileId: string;
    fileType: string;
    listenUrl?: string | null;
  }>;
};

const listeners = new Set<(requests: VehicleRequest[]) => void>();
const requestCache = new Map<string, VehicleRequest>();
const localMedia = new Map<string, Pick<VehicleRequest, 'docsBefore' | 'docsAfter'>>();

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function mapMissionStatus(status: string): RequestStatus {
  const key = status.toLowerCase();
  if (key.includes('progress')) return 'in_progress';
  if (key.includes('complete')) return 'completed';
  return 'referred';
}

function mapApiRequestFiles(
  files: ApiRequestDetail['files'],
): VehicleRequest['citizenAttachments'] {
  return (files ?? []).map((file) => ({
    id: file.fileId,
    kind: 'photo' as MediaKind,
    name: file.fileType || 'پیوست',
    uri: file.listenUrl || `file://${file.fileId}`,
  }));
}

function mergeLocalMedia(item: VehicleRequest): VehicleRequest {
  const local = localMedia.get(item.id);
  if (!local) {
    return item;
  }
  return {
    ...item,
    docsBefore: local.docsBefore.length ? local.docsBefore : item.docsBefore,
    docsAfter: local.docsAfter.length ? local.docsAfter : item.docsAfter,
  };
}

function mapToVehicleRequest(
  mission: MissionQueueItem,
  detail: ApiRequestDetail,
): VehicleRequest {
  const description = detail.description?.trim() || '—';
  const createdAt = detail.createdAtUtc || mission.createdAtUtc;
  return mergeLocalMedia({
    id: detail.id,
    missionId: mission.missionId,
    trackingCode: detail.trackingCode,
    title: description.slice(0, 40) || 'درخواست',
    description,
    type: 'درخواست ۱۳۷',
    priority: 'normal',
    status: mapMissionStatus(mission.status),
    createdAt,
    receivedAt: mission.createdAtUtc,
    latitude: detail.locationLat ?? 36.2111,
    longitude: detail.locationLng ?? 57.6815,
    addressLabel:
      detail.locationLat != null && detail.locationLng != null
        ? `${detail.locationLat.toFixed(5)}, ${detail.locationLng.toFixed(5)}`
        : '—',
    citizenAttachments: mapApiRequestFiles(detail.files),
    operatorNotes: detail.outcome ?? undefined,
    referralNotes: undefined,
    docsBefore: [],
    docsAfter: [],
  });
}

function sortRequests(items: VehicleRequest[]): VehicleRequest[] {
  return [...items].sort(
    (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime(),
  );
}

function notifyListeners(items: VehicleRequest[]): void {
  const sorted = sortRequests(items);
  listeners.forEach((listener) => listener(sorted));
}

async function fetchQueueFromApi(): Promise<VehicleRequest[]> {
  if (!(await hasSelectedVehicle())) {
    return [];
  }
  const settings = await getSettings();
  const queue = await apiJson<MissionQueueDto>(
    CAR_REFERRAL_API_URL,
    `/api/v1/missions/vehicle/${encodeURIComponent(settings.vehicle.id)}/queue`,
  );

  const mapped = await Promise.all(
    (queue.items ?? []).map(async (item) => {
      const detail = await apiJson<ApiRequestDetail>(
        REQUEST_API_URL,
        `/api/v1/requests/${encodeURIComponent(item.requestId)}`,
      );
      const row = mapToVehicleRequest(item, detail);
      requestCache.set(row.id, row);
      return row;
    }),
  );

  notifyListeners(mapped);
  return mapped;
}

export async function ensureSeeded(): Promise<VehicleRequest[]> {
  return fetchQueueFromApi();
}

export async function getRequests(): Promise<VehicleRequest[]> {
  return fetchQueueFromApi();
}

export async function getOpenRequests(): Promise<VehicleRequest[]> {
  const items = await getRequests();
  return items.filter(
    (item) => item.status === 'referred' || item.status === 'in_progress',
  );
}

export async function getInProgressRequests(): Promise<VehicleRequest[]> {
  const items = await getRequests();
  return items.filter((item) => item.status === 'in_progress');
}

export async function getRequestById(
  id: string,
): Promise<VehicleRequest | null> {
  const cached = requestCache.get(id);
  if (cached) {
    return cached;
  }
  await fetchQueueFromApi();
  return requestCache.get(id) ?? null;
}

export async function getActiveRequestId(): Promise<string | null> {
  return AsyncStorage.getItem(StorageKeys.activeRequestId);
}

export async function setActiveRequestId(id: string | null): Promise<void> {
  if (id) {
    await AsyncStorage.setItem(StorageKeys.activeRequestId, id);
  } else {
    await AsyncStorage.removeItem(StorageKeys.activeRequestId);
  }
}

export async function canAcceptNewRequest(): Promise<boolean> {
  const settings = await getSettings();
  if (settings.allowNewWhileOpen) {
    return true;
  }
  const open = await getInProgressRequests();
  return open.length === 0;
}

export async function startOperation(
  requestId: string,
  origin: MapCoordinate,
): Promise<VehicleRequest> {
  const allowed = await canAcceptNewRequest();
  const current = await getRequestById(requestId);
  if (!current?.missionId) {
    throw new Error('درخواست پیدا نشد');
  }
  if (current.status === 'in_progress') {
    await setActiveRequestId(requestId);
    return current;
  }
  if (current.status !== 'referred') {
    throw new Error('این درخواست قابل شروع نیست');
  }
  if (!allowed) {
    throw new Error(
      'تا تعیین تکلیف درخواست باز فعلی، پذیرش درخواست جدید غیرفعال است.',
    );
  }

  await apiJson(
    CAR_REFERRAL_API_URL,
    `/api/v1/missions/${encodeURIComponent(current.missionId)}/received`,
    { method: 'POST' },
  );

  const started = await apiJson<{ id: string; status: string }>(
    CAR_REFERRAL_API_URL,
    `/api/v1/missions/${encodeURIComponent(current.missionId)}/start`,
    { method: 'POST' },
  );

  const user = await getCurrentUser();
  const settings = await getSettings();
  const route = await fetchDrivingRoute(origin, {
    latitude: current.latitude,
    longitude: current.longitude,
  });

  const next: VehicleRequest = {
    ...current,
    status: mapMissionStatus(started.status || 'InProgress'),
    startedAt: new Date().toISOString(),
    route: route.coordinates,
  };

  requestCache.set(requestId, next);
  notifyListeners([...requestCache.values()]);
  await setActiveRequestId(requestId);

  await logEvent({
    type: 'operation_started',
    userId: user?.id,
    vehicleId: settings.vehicle.id,
    requestId,
    latitude: origin.latitude,
    longitude: origin.longitude,
    payload: { trackingCode: current.trackingCode },
  });
  return next;
}

export async function updateRequest(
  requestId: string,
  patch: Partial<VehicleRequest>,
): Promise<VehicleRequest> {
  const current = await getRequestById(requestId);
  if (!current) {
    throw new Error('درخواست پیدا نشد');
  }
  const next = { ...current, ...patch };
  requestCache.set(requestId, next);
  notifyListeners([...requestCache.values()]);
  return next;
}

const ARRIVAL_METERS = 50;

export async function markArrivedIfNeeded(
  coordinate: MapCoordinate,
): Promise<VehicleRequest | null> {
  const activeId = await getActiveRequestId();
  if (!activeId) {
    return null;
  }
  const current = await getRequestById(activeId);
  if (!current || current.status !== 'in_progress' || current.arrivedAt) {
    return null;
  }
  const distance = haversineMeters(coordinate, {
    latitude: current.latitude,
    longitude: current.longitude,
  });
  if (distance > ARRIVAL_METERS) {
    return null;
  }
  return updateRequest(activeId, {
    arrivedAt: new Date().toISOString(),
  });
}

export async function addRequestMedia(
  requestId: string,
  phase: 'before' | 'after',
  media: RequestMedia,
): Promise<VehicleRequest> {
  const current = await getRequestById(requestId);
  if (!current?.missionId) {
    throw new Error('درخواست پیدا نشد');
  }

  const key = phase === 'before' ? 'docsBefore' : 'docsAfter';
  const nextDocs = [...current[key], media];
  const local = localMedia.get(requestId) ?? { docsBefore: [], docsAfter: [] };
  local[key] = nextDocs;
  localMedia.set(requestId, local);

  try {
    await apiJson(CAR_REFERRAL_API_URL, `/api/v1/missions/${encodeURIComponent(current.missionId)}/documents`, {
      method: 'POST',
      body: JSON.stringify({
        fileId: media.id,
        documentType: media.kind === 'photo' ? 'Image' : 'Other',
        phase: phase === 'before' ? 'Before' : 'After',
        description: media.name,
      }),
    });
  } catch {
    // keep local media even if upload metadata fails
  }

  return updateRequest(requestId, { [key]: nextDocs });
}

function mapCompleteResult(result: RequestResult): string {
  if (result === 'completed') return 'CompletedFully';
  if (result === 'incomplete') return 'CompletedPartially';
  return 'Rejected';
}

export async function completeRequest(
  requestId: string,
  input: {
    result: RequestResult;
    finalNotes: string;
    finalAction: string;
    finalOutcome: string;
    needsFollowUp: boolean;
  },
): Promise<VehicleRequest> {
  const current = await getRequestById(requestId);
  if (!current?.missionId) {
    throw new Error('درخواست پیدا نشد');
  }

  await apiJson(
    CAR_REFERRAL_API_URL,
    `/api/v1/missions/${encodeURIComponent(current.missionId)}/complete`,
    {
      method: 'POST',
      body: JSON.stringify({
        result: mapCompleteResult(input.result),
        notes: [input.finalAction, input.finalOutcome, input.finalNotes]
          .filter(Boolean)
          .join(' — '),
      }),
    },
  );

  const status: RequestStatus = input.result;
  const next = await updateRequest(requestId, {
    status,
    result: input.result,
    finalNotes: input.finalNotes.trim(),
    finalAction: input.finalAction.trim(),
    finalOutcome: input.finalOutcome.trim(),
    needsFollowUp: input.needsFollowUp,
    completedAt: new Date().toISOString(),
  });

  const active = await getActiveRequestId();
  if (active === requestId) {
    const remaining = await getInProgressRequests();
    await setActiveRequestId(remaining[0]?.id ?? null);
  }

  requestCache.delete(requestId);
  await fetchQueueFromApi();
  return next;
}

export async function markRequestViewed(requestId: string): Promise<void> {
  const user = await getCurrentUser();
  const settings = await getSettings();
  await logEvent({
    type: 'request_viewed',
    userId: user?.id,
    vehicleId: settings.vehicle.id,
    requestId,
  });
}

export async function injectLiveRequest(): Promise<VehicleRequest | null> {
  await fetchQueueFromApi();
  return null;
}

export function subscribeRequests(
  listener: (requests: VehicleRequest[]) => void,
): () => void {
  listeners.add(listener);
  void getRequests().then((items) => listener(items));
  return () => {
    listeners.delete(listener);
  };
}

export function createMedia(
  kind: MediaKind,
  uri: string,
  name: string,
): RequestMedia {
  return {
    id: uid(kind),
    kind,
    uri,
    name,
  };
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
