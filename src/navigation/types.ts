export type AuthPhoneOption = {
  id: number;
  phoneNumber: string;
  isPrimary?: boolean;
};

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  SelectPhone: {
    melliCode: string;
    phones: AuthPhoneOption[];
  };
  VerifyOtp: {
    melliCode: string;
    phoneNumber: string;
    demoCode?: string;
  };
  SelectVehicle: undefined;
  Home: undefined;
  Settings: undefined;
  Notifications: undefined;
  OpenRequests: undefined;
  RequestDetail: { requestId: string };
  Documents: { requestId: string; phase: 'before' | 'after' };
  CompleteRequest: { requestId: string };
};
