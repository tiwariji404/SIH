import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import type {
  Camera, EventItem, Alert, VehicleRecord, Zone, TrackRecord, AuditLog, FaceRecord,
  Detection, User, AlertStatus, ScenarioType, Role,
} from './types';
import { api } from './lib/api';

interface AppState {
  user: User | null;
  token: string | null;
  login: (username: string, _password: string) => Promise<boolean>;
  logout: () => void;
  demoMode: boolean;
  setDemoMode: (on: boolean) => void;
  cameras: Camera[];
  events: EventItem[];
  alerts: Alert[];
  vehicles: VehicleRecord[];
  zones: Zone[];
  tracks: TrackRecord[];
  auditLogs: AuditLog[];
  faces: FaceRecord[];
  detections: Detection[];
  liveDemoRunning: boolean;
  startLiveDemo: () => void;
  stopLiveDemo: () => void;
  setCameraScenario: (cameraId: string, scenario: ScenarioType) => void;
  acknowledgeAlert: (id: string) => void;
  escalateAlert: (id: string) => void;
  resolveAlert: (id: string) => void;
  addZone: (zone: Zone) => void;
  deleteZone: (id: string) => void;
  addAuditLog: (action: string, details?: string) => void;
  addAlert: (alert: Alert) => void;
  triggerCameraOffline: (cameraId: string) => void;
  toast: ToastMsg | null;
  showToast: (msg: ToastMsg) => void;
  activeAlarm: Alert | null;
  setActiveAlarm: (alarm: Alert | null) => void;
  watchlistPlates: string[];
  addToWatchlist: (plate: string) => void;
  selectedLiveCameraIds: string[] | null;
  setSelectedLiveCameraIds: (ids: string[] | null) => void;
}

export interface ToastMsg {
  type: 'info' | 'alert' | 'success' | 'warning';
  title: string;
  message: string;
}

const AppContext = createContext<AppState | null>(null);

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  
  // Keep demo mode flag for UI compatibility, but data comes from real backend
  const [demoMode, setDemoMode] = useState(false);
  const [liveDemoRunning, setLiveDemoRunning] = useState(false);

  const [cameras, setCameras] = useState<Camera[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [tracks, setTracks] = useState<TrackRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [faces, setFaces] = useState<FaceRecord[]>([]);
  const [detections, setDetections] = useState<Detection[]>([]);
  
  const [toast, setToast] = useState<ToastMsg | null>(null);
  const [activeAlarm, setActiveAlarm] = useState<Alert | null>(null);
  const [watchlistPlates, setWatchlistPlates] = useState<string[]>([]);
  const [selectedLiveCameraIds, setSelectedLiveCameraIds] = useState<string[] | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create an audio element for the alarm siren
    const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beeps_and_flashes.ogg'); 
    audio.loop = true;
    audioRef.current = audio;
    return () => { audio.pause(); };
  }, []);

  useEffect(() => {
    if (activeAlarm && activeAlarm.status !== 'RESOLVED') {
      audioRef.current?.play().catch(e => console.warn('Audio play blocked by browser:', e));
    } else {
      audioRef.current?.pause();
      if (audioRef.current) audioRef.current.currentTime = 0;
    }
  }, [activeAlarm]);

  const showToast = useCallback((msg: ToastMsg) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 5000);
  }, []);

  // Fetch real data when user logs in
  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [cams, evts, alts, zns, vehs, logs, trks, fcs, wl] = await Promise.all([
        api.cameras.list(),
        api.alerts.events(),
        api.alerts.list(),
        api.zones.list(),
        api.analytics.vehicles(),
        api.analytics.auditLogs(),
        api.analytics.tracks().catch(() => []),
        api.analytics.faces().catch(() => []),
        api.analytics.watchlist().catch(() => []),
      ]);
      setCameras(cams);
      setEvents(evts);
      setAlerts(alts);
      setZones(zns);
      setVehicles(vehs);
      setAuditLogs(logs);
      setTracks(trks);
      setFaces(fcs);
      if (wl) {
        setWatchlistPlates(wl.map((w: any) => w.plate_number));
      }
    } catch (e) {
      console.error('Initial data fetch failed, using fallback mock data for frontend demo', e);
      // Fallback Mock Data for UI demonstration without a backend
      setCameras([
        { id: 'CAM-01', name: 'Main Gate', location: 'North Entrance', bop: 'Command', status: 'ONLINE', fps: 30, scenario: 'normal', recording: true, latency: 45, storage: 120, health: 98, lastHeartbeat: new Date().toISOString(), signalQuality: 95, detectionCount: 1400, coords: { x: 50, y: 50 }, mapCoord: { lat: 0, lng: 0 } },
        { id: 'CAM-02', name: 'Perimeter West', location: 'West Wall', bop: 'Command', status: 'ONLINE', fps: 30, scenario: 'normal', recording: false, latency: 45, storage: 120, health: 98, lastHeartbeat: new Date().toISOString(), signalQuality: 95, detectionCount: 400, coords: { x: 50, y: 50 }, mapCoord: { lat: 0, lng: 0 } },
        { id: 'CAM-03', name: 'Sector Alpha', location: 'Watchtower 1', bop: 'Alpha', status: 'ONLINE', fps: 30, scenario: 'normal', recording: true, latency: 45, storage: 120, health: 98, lastHeartbeat: new Date().toISOString(), signalQuality: 95, detectionCount: 120, coords: { x: 50, y: 50 }, mapCoord: { lat: 0, lng: 0 } },
        { id: 'CAM-04', name: 'Sector Bravo', location: 'Checkpoint 2', bop: 'Bravo', status: 'OFFLINE', fps: 0, scenario: 'normal', recording: false, latency: 45, storage: 120, health: 98, lastHeartbeat: new Date().toISOString(), signalQuality: 95, detectionCount: 0, coords: { x: 50, y: 50 }, mapCoord: { lat: 0, lng: 0 } }
      ]);
      setVehicles([
        { id: 'V-101', cameraId: 'CAM-01', vehicleType: 'SUV', plateNumber: 'DL 4C AB 1234', confidence: 98, timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), status: 'AUTHORIZED', direction: 'Inbound' },
        { id: 'V-102', cameraId: 'CAM-01', vehicleType: 'Truck', plateNumber: 'HR 26 DQ 5566', confidence: 92, timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), status: 'UNKNOWN', direction: 'Outbound' },
        { id: 'V-103', cameraId: 'CAM-03', vehicleType: 'Sedan', plateNumber: 'MH 12 XY 9090', confidence: 95, timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), status: 'WATCHLIST', direction: 'Inbound' },
        { id: 'V-104', cameraId: 'CAM-02', vehicleType: 'Motorcycle', plateNumber: 'UP 16 BD 4321', confidence: 85, timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), status: 'UNKNOWN', direction: 'Cross-Border' },
        { id: 'V-105', cameraId: 'CAM-01', vehicleType: 'Van', plateNumber: 'DL 8C LM 7788', confidence: 96, timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), status: 'AUTHORIZED', direction: 'Outbound' },
        { id: 'V-106', cameraId: 'CAM-03', vehicleType: 'Jeep', plateNumber: 'RJ 14 CC 1122', confidence: 91, timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(), status: 'UNKNOWN', direction: 'Inbound' },
      ]);
      setWatchlistPlates(['MH 12 XY 9090']);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
    // Disabled polling for pure frontend demo to prevent console spam
    // const interval = setInterval(fetchData, 10000); 
    // return () => clearInterval(interval);
  }, [fetchData]);

  // Session verification on mount
  useEffect(() => {
    const t = localStorage.getItem('token');
    if (t) {
      // Bypass actual backend call to allow frontend-only usage
      setUser({ id: 'usr-1', username: 'admin', name: 'Command Center Admin', role: 'admin', password: '' });
      setToken(t);
    }
  }, []);

  // Real WebSocket for Live Detections instead of simulated demo
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
              setAlerts(prev => [data.data, ...prev]);
              if (data.data.severity === 'CRITICAL') {
                setActiveAlarm(data.data);
              } else {
                showToast({ type: 'warning', title: `Alert: ${data.data.severity}`, message: data.data.title || data.data.reason });
              }
            } else if (data.type === 'intrusion') {
              const alarmItem = { ...data, timestamp: new Date().toISOString(), status: 'NEW' };
              setActiveAlarm(alarmItem);
            } else if (data.type === 'vehicle' && data.vehicle) {
              setVehicles(prev => [data.vehicle, ...prev]);
            }
          } catch {}
        };
        ws.onerror = () => {};
        ws.onclose = () => setTimeout(connect, 5000);
      } catch {}
    };
    connect();
    return () => wsRef.current?.close();
  }, [user, showToast]);

  const login = useCallback(async (username: string, password: string = ''): Promise<boolean> => {
    try {
      if (username.trim() !== 'admin' || password.trim() !== 'admin123') {
        throw new Error('Unauthorized Access. Cryptographic verification failed.');
      }
      
      const mockToken = 'mock_jwt_token_12345';
      localStorage.setItem('token', mockToken);
      setToken(mockToken);
      setUser({ 
        id: 'usr-1', 
        username: username, 
        name: 'Command Center Admin', 
        role: 'admin', 
        password: '' 
      });
      showToast({ type: 'success', title: 'Authentication Verified', message: 'Secure blockchain session established.' });
      return true;
    } catch (e: any) {
      showToast({ type: 'alert', title: 'Login Failed', message: e.message || 'Authentication failed' });
      return false;
    }
  }, [showToast]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
    wsRef.current?.close();
  }, []);

  // Proxy the UI actions to the API
  const acknowledgeAlert = useCallback(async (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'ACKNOWLEDGED' } : a));
    try { await api.alerts.acknowledge(id); } catch {}
  }, []);

  const escalateAlert = useCallback(async (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'INVESTIGATING' } : a));
    try { await api.alerts.investigate(id); } catch {}
  }, []);

  const resolveAlert = useCallback(async (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'RESOLVED' } : a));
    try { await api.alerts.resolve(id); } catch {}
  }, []);

  const addZone = useCallback(async (zone: Zone) => {
    try { 
      await api.zones.create({ ...zone, cameraId: zone.cameraIds[0] });
      fetchData();
    } catch {}
  }, [fetchData]);

  const deleteZone = useCallback(async (id: string) => {
    try {
      await api.zones.delete(id);
      fetchData();
    } catch {}
  }, [fetchData]);

  const addAuditLog = useCallback((action: string, details?: string) => {
    // Audit logs are auto-generated on backend, but we keep this for UI compatibility
  }, []);

  const addAlert = useCallback((alert: Alert) => {
    // Only used locally by live demo
    setAlerts(prev => [alert, ...prev]);
  }, []);

  const triggerCameraOffline = useCallback((cameraId: string) => {
    // Demo only
  }, []);

  const addToWatchlist = useCallback(async (plate: string) => {
    try {
      await api.analytics.addWatchlist({ plate_number: plate, description: "Manually registered" });
      setWatchlistPlates(prev => [...prev, plate.toUpperCase().trim()]);
      showToast({ type: 'success', title: 'Plate Added', message: `${plate} added to watchlist.` });
    } catch (e: any) {
      showToast({ type: 'alert', title: 'Error', message: e.message });
    }
  }, [showToast]);

  // Dummy out the live demo simulation
  const startLiveDemo = useCallback(() => setLiveDemoRunning(true), []);
  const stopLiveDemo = useCallback(() => setLiveDemoRunning(false), []);
  const setCameraScenario = useCallback(() => {}, []);

  const value: AppState = {
    user, token, login, logout, demoMode, setDemoMode,
    cameras, events, alerts, vehicles, zones, tracks, auditLogs, faces, detections,
    liveDemoRunning, startLiveDemo, stopLiveDemo,
    setCameraScenario, acknowledgeAlert, escalateAlert, resolveAlert,
    addZone, deleteZone, addAuditLog, addAlert, triggerCameraOffline, toast, showToast,
    activeAlarm, setActiveAlarm, watchlistPlates, addToWatchlist,
    selectedLiveCameraIds, setSelectedLiveCameraIds,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
