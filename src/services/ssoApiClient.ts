import { SSO_BASE_URL, SSO_CALLBACK_URL } from '../constants/ssoConfig';

export type ApiEnvelope<T> = {
  success: boolean;
  message?: string | null;
  data?: T;
};

export type PhoneOption = {
  id: number;
  phoneNumber: string;
  isPrimary?: boolean;
};

export type SsoUserInfo = {
  id: string;
  melliCode: string;
  phone?: string | null;
};

export type TokenPayload = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType?: string;
  user?: SsoUserInfo;
};

export class SsoApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'SsoApiError';
    this.status = status;
  }
}

async function parseEnvelope<T>(response: Response): Promise<ApiEnvelope<T>> {
  const text = await response.text();
  if (!text) {
    return { success: response.ok };
  }
  try {
    return JSON.parse(text) as ApiEnvelope<T>;
  } catch {
    throw new SsoApiError(response.status, 'پاسخ نامعتبر از سرویس احراز هویت');
  }
}

async function ssoFetch<T>(
  path: string,
  init: RequestInit = {},
  accessToken?: string | null,
): Promise<ApiEnvelope<T>> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  if (init.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let response: Response;
  try {
    response = await fetch(`${SSO_BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new SsoApiError(0, 'خطا در ارتباط با سرویس احراز هویت');
  }

  const envelope = await parseEnvelope<T>(response);
  if (!response.ok || envelope.success === false) {
    throw new SsoApiError(
      response.status,
      envelope.message?.trim() || 'خطا در سرویس احراز هویت',
    );
  }
  return envelope;
}

export type SecondLoginResult =
  | { exists: true; phones: PhoneOption[] }
  | { exists: false; message: string; redirectToSSO: true };

export async function secondLogin(
  melliCode: string,
): Promise<SecondLoginResult> {
  const envelope = await ssoFetch<{
    exists?: boolean;
    phones?: PhoneOption[];
    message?: string;
    redirectToSSO?: boolean;
  }>('/api/auth/second-login', {
    method: 'POST',
    body: JSON.stringify({ melliCode }),
  });

  const data = envelope.data;
  if (data?.exists && Array.isArray(data.phones) && data.phones.length > 0) {
    return { exists: true, phones: data.phones };
  }

  return {
    exists: false,
    message:
      data?.message ??
      'کاربر یافت نشد. لطفاً از طریق سامانه احراز هویت وزارت کشور وارد شوید.',
    redirectToSSO: true,
  };
}

export async function sendOtp(
  phoneNumber: string,
  melliCode: string,
): Promise<{ code?: string; message?: string }> {
  const envelope = await ssoFetch<{ code?: string; message?: string }>(
    '/api/auth/second-login/send-otp',
    {
      method: 'POST',
      body: JSON.stringify({
        phoneNumber,
        melliCode,
        otpCode: '',
      }),
    },
  );
  return envelope.data ?? { message: 'کد تایید ارسال شد' };
}

export async function verifyOtp(
  phoneNumber: string,
  otpCode: string,
  melliCode: string,
): Promise<TokenPayload> {
  const envelope = await ssoFetch<TokenPayload>(
    '/api/auth/second-login/verify-otp',
    {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, otpCode, melliCode }),
    },
  );
  if (!envelope.data?.accessToken) {
    throw new SsoApiError(500, 'توکن احراز هویت دریافت نشد');
  }
  return envelope.data;
}

export async function initiateMoiLogin(
  returnUrl: string = SSO_CALLBACK_URL,
): Promise<{ loginUrl: string; state: string }> {
  const envelope = await ssoFetch<{ loginUrl: string; state: string }>(
    '/api/auth/login/initiate',
    {
      method: 'POST',
      body: JSON.stringify({ returnUrl }),
    },
  );
  if (!envelope.data?.loginUrl) {
    throw new SsoApiError(500, 'آدرس ورود SSO دریافت نشد');
  }
  return envelope.data;
}

export async function fetchMe(accessToken: string): Promise<SsoUserInfo> {
  const envelope = await ssoFetch<SsoUserInfo>(
    '/api/auth/me',
    { method: 'GET' },
    accessToken,
  );
  if (!envelope.data?.id) {
    throw new SsoApiError(401, 'اطلاعات کاربر یافت نشد');
  }
  return envelope.data;
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<TokenPayload> {
  const envelope = await ssoFetch<TokenPayload>('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
  if (!envelope.data?.accessToken) {
    throw new SsoApiError(401, 'تمدید نشست ناموفق بود');
  }
  return {
    accessToken: envelope.data.accessToken,
    refreshToken: envelope.data.refreshToken || refreshToken,
    expiresIn: envelope.data.expiresIn,
    tokenType: envelope.data.tokenType,
  };
}

export async function logoutRemote(accessToken: string): Promise<void> {
  try {
    await ssoFetch('/api/auth/logout', { method: 'POST' }, accessToken);
  } catch {
    // ignore
  }
}
