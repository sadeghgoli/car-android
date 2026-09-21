import Constants from 'expo-constants';

type ApiExtra = {
  ssoBaseUrl?: string;
  vehicleApiUrl?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ApiExtra;

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_VEHICLE_API_URL ??
  extra.vehicleApiUrl?.replace(/\/$/, '') ??
  '';

export const SSO_BASE_URL =
  extra.ssoBaseUrl?.replace(/\/$/, '') ??
  'https://apiweb-loginsso.sabzevar.ir';

export const SSO_SCHEME = 'sabzevar137car';
export const SSO_CALLBACK_URL = `${SSO_SCHEME}://auth/callback`;
