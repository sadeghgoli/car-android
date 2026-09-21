import { API_KEY } from '../constants/apiConfig';
import { getAccessToken } from './tokenStorage';

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (API_KEY.trim()) {
    headers['X-Api-Key'] = API_KEY.trim();
  }
  const token = (await getAccessToken())?.trim();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function messageFromBody(status: number, text: string): string {
  if (!text.trim()) {
    return `خطای سرور (${status})`;
  }
  try {
    const body = JSON.parse(text) as {
      message?: string;
      detail?: string;
      title?: string;
    };
    return body.message || body.detail || body.title || text;
  } catch {
    return text;
  }
}

export async function apiJson<T>(
  baseUrl: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = `${baseUrl.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
  const headers = await authHeaders();
  const response = await fetch(url, {
    ...init,
    headers: {
      ...headers,
      ...(init.headers as Record<string, string> | undefined),
    },
  });

  const text = await response.text();
  if (!response.ok) {
    throw new ApiError(response.status, messageFromBody(response.status, text));
  }
  if (!text) {
    return null as T;
  }
  return JSON.parse(text) as T;
}
