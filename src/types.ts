export type CameraSourceMode = 'browser' | 'server_mjpeg' | 'synthetic_room';

export interface BoundingBox {
  x: number;      // normalized 0..1 (top-left)
  y: number;      // normalized 0..1 (top-left)
  width: number;  // normalized width
  height: number; // normalized height
}

export interface Vector2D {
  x: number; // normalized 0..1 center
  y: number; // normalized 0..1 center
}

export type ObjectState = 'static' | 'moving' | 'occluded' | 'new';

export interface PositionHistoryPoint {
  x: number;
  y: number;
  timestamp: number;
  locationLabel?: string;
}

export interface TrackedObject {
  id: string;             // e.g. "obj_001"
  name: string;           // e.g. "laptop"
  category: string;
  confidence: number;     // 0..1
  box: BoundingBox;
  center: Vector2D;
  state: ObjectState;
  firstSeen: number;
  lastSeen: number;
  lostFrames: number;
  velocity: Vector2D;
  history: PositionHistoryPoint[];
  color: string;
}

export type SpatialPredicate =
  | 'on'
  | 'under'
  | 'left_of'
  | 'right_of'
  | 'above'
  | 'below'
  | 'near'
  | 'far'
  | 'closest_to';

export interface SceneGraphEdge {
  id: string;
  source: string;       // object_id
  predicate: SpatialPredicate;
  target: string;       // object_id
  confidence: number;
  distance: number;     // metric euclidean distance
  timestamp: number;
}

export interface SceneGraph {
  nodes: TrackedObject[];
  edges: SceneGraphEdge[];
  updatedAt: number;
}

export type EventType =
  | 'OBJECT_APPEARED'
  | 'OBJECT_DISAPPEARED'
  | 'OBJECT_MOVED'
  | 'OBJECT_REAPPEARED'
  | 'RELATION_CHANGED';

export interface SceneEvent {
  id: string;
  type: EventType;
  objectId: string;
  objectName: string;
  timestamp: number;
  timeStr: string;
  details: string;
  from?: Vector2D;
  to?: Vector2D;
}

export interface QueryResult {
  question: string;
  intent: 'location' | 'proximity' | 'relation' | 'history' | 'status' | 'unknown';
  answer: string;
  targetObjectId?: string;
  referenceObjectId?: string;
  calculatedDistance?: number;
  confidence: number;
  verified: boolean;
  corrected: boolean;
  groundingDetails: {
    rule: string;
    calculatedMetric: number | string;
    threshold: number | string;
  };
  timestamp: number;
}

export interface CameraConfig {
  cameraIndex: number;
  width: number;
  height: number;
  targetFps: number;
  autoReconnect: boolean;
  sourceMode: CameraSourceMode;
}

export interface CameraDeviceInfo {
  deviceId: string;
  label: string;
  kind: 'videoinput';
}

export interface CameraStatus {
  connected: boolean;
  activeSource: CameraSourceMode;
  cameraIndex: number;
  resolution: {
    width: number;
    height: number;
  };
  fps: number;
  targetFps: number;
  framesDelivered: number;
  lastFrameTime: number;
  hardwareAvailable: boolean;
  error: string | null;
}

export interface SystemStatus {
  camera: 'connected' | 'disconnected' | 'error' | 'reconnecting';
  detector: 'idle' | 'running' | 'ready';
  tracker: 'idle' | 'running' | 'ready';
  sceneGraph: 'idle' | 'active';
  fps: number;
  latencyMs: number;
  activeObjectsCount: number;
  lastUpdateTimestamp: number;
  eventsCount: number;
  concepts: string[];
}
