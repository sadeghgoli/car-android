import type { RequestPriority, RequestStatus } from '../types/domain';

export const DEFAULT_MAP_REGION = {
  latitude: 36.2126,
  longitude: 57.6819,
  latitudeDelta: 0.045,
  longitudeDelta: 0.045,
};

export const STATUS_LABELS: Record<RequestStatus, string> = {
  referred: 'ارجاع‌شده',
  in_progress: 'در حال انجام',
  completed: 'تکمیل‌شده',
  incomplete: 'عدم تکمیل',
  cancelled: 'انصراف',
};

export const PRIORITY_LABELS: Record<RequestPriority, string> = {
  critical: 'بحرانی',
  normal: 'معمولی',
};
