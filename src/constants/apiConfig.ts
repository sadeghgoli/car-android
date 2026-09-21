import Constants from 'expo-constants';

type ApiExtra = {
  requestApiUrl?: string;
  carReferralApiUrl?: string;
  carLocationApiUrl?: string;
  apiKey?: string;
  ssoBaseUrl?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ApiExtra;

export const REQUEST_API_URL =
  process.env.EXPO_PUBLIC_REQUEST_API_URL ??
  extra.requestApiUrl?.replace(/\/$/, '') ??
  'https://apiweb-137request.sabzevar.ir';

export const CAR_REFERRAL_API_URL =
  process.env.EXPO_PUBLIC_CAR_REFERRAL_API_URL ??
  extra.carReferralApiUrl?.replace(/\/$/, '') ??
  'https://apiweb-137carreferral.sabzevar.ir';

export const CAR_LOCATION_API_URL =
  process.env.EXPO_PUBLIC_CAR_LOCATION_API_URL ??
  extra.carLocationApiUrl?.replace(/\/$/, '') ??
  'https://apiweb-carlocation.sabzevar.ir';

export const API_KEY =
  process.env.EXPO_PUBLIC_API_KEY ?? extra.apiKey ?? 'dev-internal-key-137';

export { SSO_BASE_URL, SSO_CALLBACK_URL } from './ssoConfig';
