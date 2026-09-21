import { PRIORITY_LABELS, STATUS_LABELS } from '../constants';
import type { RequestPriority, RequestStatus } from '../types/domain';

export function formatDateFa(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function statusLabel(status: RequestStatus): string {
  return STATUS_LABELS[status];
}

export function priorityLabel(priority: RequestPriority): string {
  return PRIORITY_LABELS[priority];
}

export function toFaDigits(value: number | string): string {
  return String(value).replace(/\d/g, (digit) =>
    '۰۱۲۳۴۵۶۷۸۹'[Number(digit)],
  );
}
