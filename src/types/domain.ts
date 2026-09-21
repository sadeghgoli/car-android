export type UserRole = 'operator' | 'admin';

export type AppUser = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  avatarKey: 'user1' | 'user2';
  role: UserRole;
};

export type Vehicle = {
  id: string;
  plate: string;
  code: string;
  type: string;
  model: string;
  title: string;
  unit: string;
  regionId: string;
  regionTitle: string;
};

export type TabletSettings = {
  maxSpeedKmh: number;
  allowNewWhileOpen: boolean;
  /** @deprecated محدوده مشاهده دیگر پلیگان منطقه است، نه شعاع */
  viewRadiusMeters?: number;
  vehicle: Vehicle;
};

export type RequestPriority = 'critical' | 'normal';

export type RequestStatus =
  | 'referred'
  | 'in_progress'
  | 'completed'
  | 'incomplete'
  | 'cancelled';

export type RequestResult = 'completed' | 'incomplete' | 'cancelled';

export type MediaKind = 'photo' | 'video' | 'audio';

export type RequestMedia = {
  id: string;
  kind: MediaKind;
  uri: string;
  name: string;
};

export type MapCoordinate = {
  latitude: number;
  longitude: number;
};

export type VehicleRequest = {
  id: string;
  missionId?: string;
  trackingCode: string;
  title: string;
  description: string;
  type: string;
  priority: RequestPriority;
  status: RequestStatus;
  createdAt: string;
  receivedAt: string;
  latitude: number;
  longitude: number;
  addressLabel: string;
  citizenAttachments: RequestMedia[];
  operatorNotes?: string;
  referralNotes?: string;
  startedAt?: string;
  arrivedAt?: string;
  completedAt?: string;
  route?: MapCoordinate[];
  docsBefore: RequestMedia[];
  docsAfter: RequestMedia[];
  notesBefore?: string;
  notesAfter?: string;
  finalNotes?: string;
  finalAction?: string;
  finalOutcome?: string;
  needsFollowUp?: boolean;
  result?: RequestResult;
};

export type LocationPoint = {
  id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  speedKmh: number;
  accuracy?: number;
  vehicleId: string;
  userId: string;
  operationStatus: 'idle' | 'in_progress';
};

export type AppEventType =
  | 'login'
  | 'logout'
  | 'request_received'
  | 'request_viewed'
  | 'request_selected'
  | 'operation_started'
  | 'request_status_changed'
  | 'vehicle_status_changed'
  | 'location_recorded'
  | 'route_recorded'
  | 'vehicle_stopped'
  | 'speed_recorded'
  | 'speed_exceeded'
  | 'arrived_at_location'
  | 'photo_added'
  | 'video_added'
  | 'audio_added'
  | 'notes_added'
  | 'request_completed'
  | 'request_incomplete'
  | 'request_cancelled'
  | 'operation_ended';

export type AppEvent = {
  id: string;
  type: AppEventType;
  createdAt: string;
  userId?: string;
  vehicleId?: string;
  requestId?: string;
  latitude?: number;
  longitude?: number;
  payload?: Record<string, unknown>;
};

export type AppNotification = {
  id: string;
  requestId?: string;
  title: string;
  body?: string;
  createdAt: string;
  read: boolean;
  kind: 'new_request' | 'speed' | 'system';
};

export type VehicleSnapshot = {
  coordinate: MapCoordinate;
  speedKmh: number;
  heading: number;
  accuracy?: number;
  speeding: boolean;
};
