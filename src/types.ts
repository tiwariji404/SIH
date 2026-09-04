// Domain types matching backend schemas exactly
export type Role = 'admin' | 'supervisor' | 'operator' | 'investigator';
export type AlertStatus = 'NEW' | 'ACKNOWLEDGED' | 'VERIFIED' | 'CLOSED' | 'INVESTIGATING' | 'RESOLVED';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type CameraStatus = 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'LIVE' | 'DISCONNECTED' | 'ERROR' | 'MAINTENANCE' | 'ACTIVE';

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  role_name: string;
}

export interface Camera {
  id: string;
  name: string;
  bop?: string;
  location?: string;
  status: CameraStatus;
  fps?: number;
  latency?: number;
  storage?: number;
  health?: number;
  lastHeartbeat?: string;
  signalQuality?: number;
  recording?: boolean;
  detectionCount?: number;
  rtsp_url?: string;
  created_at?: string;
}

export interface Zone {
  id: string;
  name: string;
  zoneType: string;
  severity: RiskLevel;
  coordinates: { x: number; y: number }[];
  rule: string;
  cameraId?: string;
  cameraIds?: string[];
  created_at?: string;
}

export interface EventItem {
  id: string;
  cameraId: string;
  eventType: string;
  severity: string;
  trackingId?: string;
  description: string;
  timestamp?: string;
  event_timestamp?: string;
  status: string;
  riskScore: number;
  reasons?: string[];
}

export interface Alert {
  id: string;
  eventId?: string;
  severity: string;
  riskScore: number;
  reason: string;
  reasons?: string[];
  status: string;
  createdAt?: string;
  created_at_dt?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  cameraId: string;
  trackingId?: string;
  title: string;
  what: string;
  where?: string;
  when?: string;
  object?: string;
  why?: string;
  zone?: string;
  confidence?: number;
}

export interface Incident {
  id: string;
  title: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface Evidence {
  id: string;
  event_id: string;
  camera_id: string;
  file_location: string;
  file_type: string;
  sha256_hash: string;
  integrity_status: string;
  created_at?: string;
}

export interface TrackRecord {
  trackingId: string;
  objectType: string;
  cameraId: string;
  direction?: string;
  duration?: string;
  status: string;
  firstSeen: string;
  lastSeen: string;
  history: { cameraId: string; time: string }[];
}

export interface AuditLog {
  id: string;
  user?: string;
  actor_id?: string;
  action: string;
  timestamp?: string;
  details: string;
  result: string;
  ip: string;
  resource_type?: string;
  resource_id?: string;
  created_at?: string;
}

export interface VehicleRecord {
  id: string;
  cameraId: string;
  vehicleType: string;
  plateNumber: string;
  confidence: number;
  timestamp: string;
  status: string;
  direction?: string;
}

export interface FaceRecord {
  id: string;
  cameraId: string;
  identity: string;
  confidence: number;
  timestamp: string;
  database: string;
  status: string;
}

export interface SystemHealth {
  status: string;
  database: string;
  storage: string;
  redis: string;
  edge_sync_queue: number;
  version: string;
}

// Severity display helpers
export const riskColor: Record<string, string> = {
  LOW: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  MEDIUM: 'text-amber-700 bg-amber-50 border-amber-200',
  HIGH: 'text-orange-700 bg-orange-50 border-orange-200',
  CRITICAL: 'text-red-700 bg-red-50 border-red-200',
};

export const riskBg: Record<string, string> = {
  LOW: 'bg-emerald-500',
  MEDIUM: 'bg-amber-500',
  HIGH: 'bg-orange-500',
  CRITICAL: 'bg-red-500',
};

export const statusColor: Record<string, string> = {
  NEW: 'text-red-700 bg-red-50 border-red-200',
  ACKNOWLEDGED: 'text-amber-700 bg-amber-50 border-amber-200',
  INVESTIGATING: 'text-blue-700 bg-blue-50 border-blue-200',
  VERIFIED: 'text-blue-700 bg-blue-50 border-blue-200',
  RESOLVED: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  CLOSED: 'text-slate-600 bg-slate-50 border-slate-200',
};

export function riskFromScore(score: number): RiskLevel {
  if (score <= 30) return 'LOW';
  if (score <= 60) return 'MEDIUM';
  if (score <= 80) return 'HIGH';
  return 'CRITICAL';
}

export function formatTime(ts?: string | null): string {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', hour: '2-digit',
      minute: '2-digit', second: '2-digit', hour12: true
    });
  } catch { return ts; }
}
