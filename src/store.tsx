import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import type { User, Camera, EventItem, Alert, Zone, AuditLog, VehicleRecord, FaceRecord, Incident, Evidence, SystemHealth } from './types';
import { api } from './lib/api';

export interface ToastMsg {
  type: 'info' | 'alert' | 'success' | 'warning';
  title: string;
  message: string;
}

interface AppState {
  // Auth
  user: User | null;
  token: string | null;
  authLoading: boolean;
  authError: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;

  // Data
  cameras: Camera[];
  events: EventItem[];
  alerts: Alert[];
  zones: Zone[];
  vehicles: VehicleRecord[];
  auditLogs: AuditLog[];
  faces: FaceRecord[];
  incidents: Incident[];
  evidence: Evidence[];
  health: SystemHealth | null;
  stats: any;

  // Loading states
  camerasLoading: boolean;
  alertsLoading: boolean;
  eventsLoading: boolean;

  // Actions
  refreshCameras: () => Promise<void>;
  refreshAlerts: () => Promise<void>;
  refreshEvents: () => Promise<void>;
  refreshZones: () => Promise<void>;
  refreshIncidents: () => Promise<void>;
  refreshEvidence: () => Promise<void>;
  refreshAuditLogs: () => Promise<void>;
  refreshVehicles: () => Promise<void>;
  refreshAll: () => Promise<void>;

  acknowledgeAlert: (id: string) => Promise<void>;
  investigateAlert: (id: string) => Promise<void>;
  resolveAlert: (id: string) => Promise<void>;

  // Toast
  toast: ToastMsg | null;
  showToast: (msg: ToastMsg) => void;

  // Global alarm (critical alert popup)
  activeAlarm: Alert | null;
  setActiveAlarm: (a: Alert | null) => void;

  // Selected live camera filter
  selectedLiveCameraIds: string[] | null;
  setSelectedLiveCameraIds: (ids: string[] | null) => void;
}

const AppContext = createContext<AppState | null>(null);

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be within AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [authLoading, setAuthLoading] = useState(!!localStorage.getItem('token'));
  const [authError, setAuthError] = useState<string | null>(null);

  const [cameras, setCameras] = useState<Camera[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [faces, setFaces] = useState<FaceRecord[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [stats, setStats] = useState<any>(null);

  const [camerasLoading, setCamerasLoading] = useState(false);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);

  const [toast, setToast] = useState<ToastMsg | null>(null);
  const [activeAlarm, setActiveAlarm] = useState<Alert | null>(null);
  const [selectedLiveCameraIds, setSelectedLiveCameraIds] = useState<string[] | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: ToastMsg) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 5000);
  }, []);

  // ── Auto-login on startup if token exists ──────────────────────────────
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) { setAuthLoading(false); return; }
    setAuthLoading(true);
    api.auth.me()
      .then(profile => {
        const u: User = {
          id: profile.id,
          username: profile.username,
          name: profile.username,
          role: (profile.role_name || 'operator').toLowerCase() as any,
          role_name: profile.role_name,
        };
        setUser(u);
        setToken(storedToken);
      })
      .catch(() => {
        localStorage.removeItem('token');
        setToken(null);
      })
      .finally(() => setAuthLoading(false));
  }, []);

  // ── Handle session expiry ──────────────────────────────────────────────
  useEffect(() => {
    const handler = () => {
      setUser(null);
      setToken(null);
      showToast({ type: 'warning', title: 'Session Expired', message: 'Your session has expired. Please log in again.' });
    };
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, [showToast]);

  // ── API Refresh functions ──────────────────────────────────────────────
  const refreshCameras = useCallback(async () => {
    setCamerasLoading(true);
    try { setCameras(await api.cameras.list()); } catch {} finally { setCamerasLoading(false); }
  }, []);

  const refreshAlerts = useCallback(async () => {
    setAlertsLoading(true);
    try { setAlerts(await api.alerts.list()); } catch {} finally { setAlertsLoading(false); }
  }, []);

  const refreshEvents = useCallback(async () => {
    setEventsLoading(true);
    try { setEvents(await api.alerts.events()); } catch {} finally { setEventsLoading(false); }
  }, []);

  const refreshZones = useCallback(async () => {
    try { setZones(await api.zones.list()); } catch {}
  }, []);

  const refreshIncidents = useCallback(async () => {
    try { setIncidents(await api.analytics.incidents()); } catch {}
  }, []);

  const refreshEvidence = useCallback(async () => {
    try { setEvidence(await api.analytics.evidence()); } catch {}
  }, []);

  const refreshAuditLogs = useCallback(async () => {
    try { setAuditLogs(await api.analytics.auditLogs()); } catch {}
  }, []);

  const refreshVehicles = useCallback(async () => {
    try { setVehicles(await api.analytics.vehicles()); } catch {}
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.allSettled([
      refreshCameras(), refreshAlerts(), refreshEvents(),
      refreshZones(), refreshIncidents(), refreshEvidence(),
      api.analytics.stats().then(setStats).catch(() => {}),
      api.analytics.health().then(setHealth).catch(() => {}),
    ]);
  }, [refreshCameras, refreshAlerts, refreshEvents, refreshZones, refreshIncidents, refreshEvidence]);

  // Auto-load data when user logs in  
  useEffect(() => {
    if (!user) return;
    refreshAll();
    const interval = setInterval(refreshAll, 30000);
    return () => clearInterval(interval);
  }, [user, refreshAll]);

  // ── WebSocket ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) { wsRef.current?.close(); return; }
    const connect = () => {
      try {
        const ws = new WebSocket('ws://localhost:8000/ws/detections');
        wsRef.current = ws;
        ws.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.type === 'NEW_ALERT' && data.data) {
              const incoming = data.data as Alert;
              setAlerts(prev => {
                if (prev.find(a => a.id === incoming.id)) return prev;
                return [incoming, ...prev];
              });
              if (incoming.severity === 'CRITICAL') {
                setActiveAlarm(incoming);
                showToast({ type: 'alert', title: `CRITICAL ALERT`, message: incoming.reason || incoming.title });
              } else {
                showToast({ type: 'warning', title: `Alert: ${incoming.severity}`, message: incoming.reason || incoming.title });
              }
            }
          } catch {}
        };
        ws.onerror = () => {};
        ws.onclose = () => { setTimeout(connect, 5000); };
      } catch {}
    };
    connect();
    return () => { wsRef.current?.close(); };
  }, [user, showToast]);

  // ── Auth ───────────────────────────────────────────────────────────────
  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    setAuthError(null);
    try {
      const { access_token } = await api.auth.login(username, password);
      localStorage.setItem('token', access_token);
      setToken(access_token);
      const profile = await api.auth.me();
      const u: User = {
        id: profile.id,
        username: profile.username,
        name: profile.username,
        role: (profile.role_name || 'operator').toLowerCase() as any,
        role_name: profile.role_name,
      };
      setUser(u);
      return true;
    } catch (e: any) {
      const msg = e?.message?.includes('401') || e?.message?.includes('Incorrect')
        ? 'Invalid username or password.'
        : e?.message?.includes('fetch') || e?.message?.includes('Failed')
          ? 'Backend unavailable. Please try again.'
          : e?.message || 'Authentication failed.';
      setAuthError(msg);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
    setCameras([]); setEvents([]); setAlerts([]); setZones([]);
    setVehicles([]); setAuditLogs([]); setFaces([]); setIncidents([]); setEvidence([]);
    wsRef.current?.close();
  }, []);

  // ── Alert actions ──────────────────────────────────────────────────────
  const acknowledgeAlert = useCallback(async (id: string) => {
    try {
      const updated = await api.alerts.acknowledge(id);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a));
      showToast({ type: 'success', title: 'Alert Acknowledged', message: `Alert ${id.slice(0, 8)} acknowledged.` });
    } catch (e: any) {
      showToast({ type: 'warning', title: 'Error', message: e.message });
    }
  }, [showToast]);

  const investigateAlert = useCallback(async (id: string) => {
    try {
      const updated = await api.alerts.investigate(id);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a));
      showToast({ type: 'info', title: 'Under Investigation', message: `Alert ${id.slice(0, 8)} is now being verified.` });
    } catch (e: any) {
      showToast({ type: 'warning', title: 'Error', message: e.message });
    }
  }, [showToast]);

  const resolveAlert = useCallback(async (id: string) => {
    try {
      const updated = await api.alerts.resolve(id);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a));
      showToast({ type: 'success', title: 'Alert Resolved', message: `Alert ${id.slice(0, 8)} resolved.` });
    } catch (e: any) {
      showToast({ type: 'warning', title: 'Error', message: e.message });
    }
  }, [showToast]);

  const value: AppState = {
    user, token, authLoading, authError, login, logout,
    cameras, events, alerts, zones, vehicles, auditLogs, faces, incidents, evidence, health, stats,
    camerasLoading, alertsLoading, eventsLoading,
    refreshCameras, refreshAlerts, refreshEvents, refreshZones,
    refreshIncidents, refreshEvidence, refreshAuditLogs, refreshVehicles, refreshAll,
    acknowledgeAlert, investigateAlert, resolveAlert,
    toast, showToast,
    activeAlarm, setActiveAlarm,
    selectedLiveCameraIds, setSelectedLiveCameraIds,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
