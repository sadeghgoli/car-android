import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { StorageKeys } from '../constants';
import { SSO_CALLBACK_URL } from '../constants/ssoConfig';
import type { AppUser } from '../types/domain';
import { logEvent } from './eventService';
import {
  fetchMe,
  initiateMoiLogin,
  logoutRemote,
  refreshAccessToken,
  secondLogin,
  sendOtp,
  verifyOtp,
  type PhoneOption,
  type SsoUserInfo,
  type TokenPayload,
} from './ssoApiClient';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from './tokenStorage';

WebBrowser.maybeCompleteAuthSession();

function mapSsoUser(info: SsoUserInfo): AppUser {
  const label = info.melliCode || info.id;
  return {
    id: info.id,
    firstName: '',
    lastName: '',
    name: label,
    email: info.phone?.trim() || '',
    avatarKey: 'user1',
    role: 'operator',
  };
}

function persianDigitsToEnglish(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

export function normalizeMelliCode(value: string): string {
  return persianDigitsToEnglish(value).replace(/\D/g, '');
}

async function persistSession(
  tokens: TokenPayload,
  user: AppUser,
): Promise<AppUser> {
  await setTokens(tokens.accessToken, tokens.refreshToken);
  await AsyncStorage.setItem(StorageKeys.isAuthenticated, 'true');
  await AsyncStorage.setItem(StorageKeys.authUser, JSON.stringify(user));
  await logEvent({
    type: 'login',
    userId: user.id,
    payload: { role: user.role, name: user.name },
  });
  return user;
}

export async function lookupPhonesByMelliCode(
  melliCode: string,
): Promise<
  | { kind: 'phones'; phones: PhoneOption[]; melliCode: string }
  | { kind: 'sso'; message: string; melliCode: string }
> {
  const normalized = normalizeMelliCode(melliCode);
  if (normalized.length !== 10) {
    throw new Error('کد ملی باید ۱۰ رقم باشد');
  }

  const result = await secondLogin(normalized);
  if (result.exists) {
    return { kind: 'phones', phones: result.phones, melliCode: normalized };
  }
  return { kind: 'sso', message: result.message, melliCode: normalized };
}

export async function requestOtp(
  phoneNumber: string,
  melliCode: string,
): Promise<{ code?: string }> {
  return sendOtp(phoneNumber, melliCode);
}

export async function loginWithOtp(
  phoneNumber: string,
  otpCode: string,
  melliCode: string,
): Promise<AppUser> {
  const tokens = await verifyOtp(
    phoneNumber,
    persianDigitsToEnglish(otpCode).replace(/\D/g, ''),
    melliCode,
  );
  const info = tokens.user ?? (await fetchMe(tokens.accessToken));
  return persistSession(tokens, mapSsoUser(info));
}

function parseCallbackUrl(url: string): {
  token?: string;
  refreshToken?: string;
  error?: string;
  message?: string;
} {
  const parsed = Linking.parse(url);
  const q = parsed.queryParams ?? {};
  return {
    token: typeof q.token === 'string' ? q.token : undefined,
    refreshToken:
      typeof q.refreshToken === 'string' ? q.refreshToken : undefined,
    error: typeof q.error === 'string' ? q.error : undefined,
    message: typeof q.message === 'string' ? q.message : undefined,
  };
}

export async function loginWithMoiBrowser(): Promise<AppUser> {
  const { loginUrl } = await initiateMoiLogin(SSO_CALLBACK_URL);
  const result = await WebBrowser.openAuthSessionAsync(
    loginUrl,
    SSO_CALLBACK_URL,
  );

  if (result.type !== 'success' || !result.url) {
    throw new Error('ورود از طریق وزارت کشور لغو شد');
  }

  const params = parseCallbackUrl(result.url);
  if (params.error) {
    throw new Error(params.message || 'خطا در احراز هویت وزارت کشور');
  }
  if (!params.token) {
    throw new Error('توکن از callback دریافت نشد');
  }

  await setTokens(params.token, params.refreshToken);
  const info = await fetchMe(params.token);
  const user = mapSsoUser(info);
  await AsyncStorage.setItem(StorageKeys.isAuthenticated, 'true');
  await AsyncStorage.setItem(StorageKeys.authUser, JSON.stringify(user));
  await logEvent({
    type: 'login',
    userId: user.id,
    payload: { role: user.role, name: user.name, via: 'moi' },
  });
  return user;
}

export async function isAuthenticated(): Promise<boolean> {
  const access = await getAccessToken();
  if (!access) {
    const flag = await AsyncStorage.getItem(StorageKeys.isAuthenticated);
    return flag === 'true';
  }

  try {
    const info = await fetchMe(access);
    const user = mapSsoUser(info);
    await AsyncStorage.setItem(StorageKeys.isAuthenticated, 'true');
    await AsyncStorage.setItem(StorageKeys.authUser, JSON.stringify(user));
    return true;
  } catch {
    const refresh = await getRefreshToken();
    if (!refresh) {
      await clearSessionLocal();
      return false;
    }
    try {
      const tokens = await refreshAccessToken(refresh);
      const info = await fetchMe(tokens.accessToken);
      await persistSession(tokens, mapSsoUser(info));
      return true;
    } catch {
      await clearSessionLocal();
      return false;
    }
  }
}

async function clearSessionLocal(): Promise<void> {
  await clearTokens();
  await AsyncStorage.multiRemove([
    StorageKeys.isAuthenticated,
    StorageKeys.authUser,
  ]);
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const raw = await AsyncStorage.getItem(StorageKeys.authUser);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as AppUser;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  const user = await getCurrentUser();
  const access = await getAccessToken();
  if (access) {
    await logoutRemote(access);
  }
  await logEvent({
    type: 'logout',
    userId: user?.id,
  });
  await clearSessionLocal();
}
