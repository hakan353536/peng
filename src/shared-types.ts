export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface LocationUpdate {
  vehicleId: string;
  tripId?: string;
  position: GeoPoint;
  speed: number;
  heading: number;
  altitude?: number;
  recordedAt: Date;
}

export enum SocketEvents {
  LOCATION_UPDATE = 'location:update',
  LOCATION_SUBSCRIBE = 'location:subscribe',
  LOCATION_UNSUBSCRIBE = 'location:unsubscribe',
  LOCATION_DATA = 'location:data',
  ROUTE_DEVIATION = 'route:deviation',
  GEOFENCE_ALERT = 'geofence:alert',
  TRIP_STATUS_CHANGE = 'trip:status',
  WEBRTC_START_STREAM = 'webrtc:start-stream',
  WEBRTC_STOP_STREAM = 'webrtc:stop-stream',
  WEBRTC_REQUEST_STREAM = 'webrtc:request-stream',
  WEBRTC_OFFER = 'webrtc:offer',
  WEBRTC_ANSWER = 'webrtc:answer',
  WEBRTC_ICE_CANDIDATE = 'webrtc:ice-candidate',
  WEBRTC_STREAM_LIST = 'webrtc:stream-list',
}

export interface WebRTCOffer {
  vehicleId: string;
  viewerId: string;
  sdp: string;
}

export interface WebRTCAnswer {
  vehicleId: string;
  viewerId: string;
  sdp: string;
}

export interface WebRTCIceCandidate {
  vehicleId: string;
  viewerId: string;
  candidate: any;
}
