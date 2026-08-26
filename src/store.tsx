import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import type {
  Camera, EventItem, Alert, VehicleRecord, Zone, TrackRecord, AuditLog, FaceRecord,
  Detection, User, AlertStatus, ScenarioType, Role,
} from './types';
import {
  DEMO_USERS, generateCameras, generateEvents, generateAlerts, generateVehicles,
  generateZones, generateTracks, generateAuditLogs, generateFaces, generateDetections,
} from './data/demoData';


interface AppState {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
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
  const initialCamerasRef = useRef<Camera[]>(generateCameras());
  const initialEventsRef = useRef<EventItem[]>(generateEvents(initialCamerasRef.current, 120));
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [demoMode, setDemoMode] = useState(true);
  const [cameras, setCameras] = useState<Camera[]>(() => initialCamerasRef.current);
  const [events, setEvents] = useState<EventItem[]>(() => initialEventsRef.current);
  const [alerts, setAlerts] = useState<Alert[]>(() => generateAlerts(initialEventsRef.current, 35));
  const [vehicles, setVehicles] = useState<VehicleRecord[]>(() => generateVehicles(initialCamerasRef.current, 55));
  const [zones, setZones] = useState<Zone[]>(() => generateZones());
  const [tracks] = useState<TrackRecord[]>(() => generateTracks(initialCamerasRef.current));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => generateAuditLogs(DEMO_USERS, 40));
  const [faces] = useState<FaceRecord[]>(() => generateFaces(initialCamerasRef.current, 20));
  const [detections, setDetections] = useState<Detection[]>(() => generateDetections(initialCamerasRef.current, 30));
  const [liveDemoRunning, setLiveDemoRunning] = useState(false);
  const [toast, setToast] = useState<ToastMsg | null>(null);
  const [activeAlarm, setActiveAlarm] = useState<Alert | null>(null);
  const [watchlistPlates, setWatchlistPlates] = useState<string[]>([]);
  const demoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: ToastMsg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 5000);
  }, []);

  const addToWatchlist = useCallback((plate: string) => {
    setWatchlistPlates(prev => [...prev, plate.toUpperCase().trim()]);
    // Log indirectly or just rely on state change for now to avoid circular dependency before addAuditLog
  }, []);

  const addAuditLog = useCallback((action: string, details = 'Session active') => {
    if (!user) return;
    const log: AuditLog = {
      id: `LOG-${Date.now()}`,
      user: user.name,
      action,
      timestamp: new Date().toISOString(),
      details,
      result: 'SUCCESS',
      ip: '10.0.1.42',
    };
    setAuditLogs(prev => [log, ...prev]);
  }, [user]);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      // Bypass password / backend check for instant demo login
      const lowerUser = username.toLowerCase();
      let role: Role = 'operator';

      if (lowerUser.includes('sub')) {
        role = 'sub_admin';
      } else if (lowerUser.includes('admin')) {
        role = 'admin';
      }

      const loggedUser = {
        id: `U-${Date.now()}`,
        name: username,
        email: `${username}@ssb.gov.in`,
        role: role,
        username: username,
        password: '',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=256'
      };

      setToken('dummy-token-12345');
      localStorage.setItem('token', 'dummy-token-12345');
      setUser(loggedUser);

      const log: AuditLog = {
        id: `LOG-${Date.now()}`,
        user: loggedUser.name,
        action: 'logged in directly (Backend bypassed)',
        timestamp: new Date().toISOString(),
        details: `Role: ${loggedUser.role}`,
        result: 'SUCCESS',
        ip: '10.0.1.42',
      };
      setAuditLogs(prev => [log, ...prev]);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    if (user) {
      const log: AuditLog = {
        id: `LOG-${Date.now()}`,
        user: user.name,
        action: 'logged out',
        timestamp: new Date().toISOString(),
        details: 'Session ended',
        result: 'SUCCESS',
        ip: '10.0.1.42',
      };
      setAuditLogs(prev => [log, ...prev]);
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    setLiveDemoRunning(false);
    if (demoTimer.current) clearTimeout(demoTimer.current);
  }, [user]);

  const setCameraScenario = useCallback((cameraId: string, scenario: ScenarioType) => {
    setCameras(prev => prev.map(c => c.id === cameraId ? { ...c, scenario } : c));
    addAuditLog(`changed scenario for ${cameraId}`, `Scenario: ${scenario}`);
  }, [addAuditLog]);

  const acknowledgeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? {
      ...a, status: 'ACKNOWLEDGED' as AlertStatus, acknowledgedAt: new Date().toISOString(),
    } : a));
    setEvents(prev => prev.map(e => {
      const alert = alerts.find(a => a.id === id);
      return alert && e.id === alert.eventId ? { ...e, status: 'ACKNOWLEDGED' as AlertStatus } : e;
    }));
    addAuditLog(`acknowledged alert ${id}`);
    showToast({ type: 'success', title: 'Alert Acknowledged', message: `Alert ${id} has been acknowledged.` });
  }, [alerts, addAuditLog, showToast]);

  const escalateAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'INVESTIGATING' as AlertStatus } : a));
    addAuditLog(`escalated alert ${id}`, 'Escalated to command chain');
    showToast({ type: 'warning', title: 'Alert Escalated', message: `Alert ${id} escalated to command.` });
  }, [addAuditLog, showToast]);

  const resolveAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? {
      ...a, status: 'RESOLVED' as AlertStatus, resolvedAt: new Date().toISOString(),
    } : a));
    setEvents(prev => prev.map(e => {
      const alert = alerts.find(a => a.id === id);
      return alert && e.id === alert.eventId ? { ...e, status: 'RESOLVED' as AlertStatus } : e;
    }));
    addAuditLog(`resolved alert ${id}`);
    showToast({ type: 'success', title: 'Alert Resolved', message: `Alert ${id} marked as resolved.` });
  }, [alerts, addAuditLog, showToast]);

  const addZone = useCallback((zone: Zone) => {
    setZones(prev => [...prev, zone]);
    addAuditLog(`created zone ${zone.name}`, `Cameras: ${zone.cameraIds.join(', ')}, Severity: ${zone.severity}`);
    showToast({ type: 'success', title: 'Zone Created', message: `Virtual fence "${zone.name}" saved.` });
  }, [addAuditLog, showToast]);

  const deleteZone = useCallback((id: string) => {
    setZones(prev => prev.filter(z => z.id !== id));
    addAuditLog(`deleted zone ${id}`);
  }, [addAuditLog]);

  const addAlert = useCallback((alert: Alert) => {
    setAlerts(prev => [alert, ...prev]);
    const evt: EventItem = {
      id: alert.eventId,
      cameraId: alert.cameraId,
      eventType: alert.what,
      severity: alert.severity,
      trackingId: alert.trackingId,
      description: alert.what + ' at ' + alert.cameraId,
      timestamp: alert.createdAt,
      status: 'NEW',
      riskScore: alert.riskScore,
      reasons: alert.reasons,
    };
    setEvents(prev => [evt, ...prev]);
  }, []);

  // Live demo simulation engine
  const startLiveDemo = useCallback(() => {
    if (liveDemoRunning) return;
    setLiveDemoRunning(true);
    addAuditLog('started live demo', 'Border intrusion scenario initiated');

    const demoSteps: { delay: number; fn: () => void }[] = [];
    const targetCam = 'BOP-04';
    const trackId = 'P-104';
    let riskScore = 15;

    const makeAlert = (overrides: Partial<Alert>): Alert => ({
      id: `A-${String(200 + Math.floor(Math.random() * 900))}`,
      eventId: `EVT-${Date.now()}`,
      severity: 'LOW',
      riskScore: 15,
      reason: '',
      reasons: [],
      status: 'NEW',
      createdAt: new Date().toISOString(),
      acknowledgedAt: null,
      resolvedAt: null,
      cameraId: targetCam,
      trackingId: trackId,
      title: '',
      what: '',
      where: `${targetCam} / Restricted Zone A`,
      when: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
      object: `Human / ${trackId}`,
      why: '',
      zone: 'Restricted Border Sector A',
      confidence: 97,
      ...overrides,
    });

    // Step 1: Person detected
    demoSteps.push({
      delay: 800,
      fn: () => {
        showToast({ type: 'info', title: 'Person Detected', message: `New person detected at ${targetCam}. Assigning tracking ID ${trackId}.` });
        setDetections(prev => [{
          id: `DET-${Date.now()}`,
          cameraId: targetCam,
          objectType: 'person',
          trackingId: trackId,
          confidence: 94,
          timestamp: new Date().toISOString(),
          bbox: { x: 20, y: 45, w: 22, h: 35 },
          label: 'PERSON',
          direction: 'North-East',
        }, ...prev]);
      },
    });

    // Step 2: Person tracked
    demoSteps.push({
      delay: 1800,
      fn: () => {
        showToast({ type: 'info', title: 'Object Tracked', message: `${trackId} is being tracked moving North-East.` });
        setCameras(prev => prev.map(c => c.id === targetCam ? { ...c, detectionCount: c.detectionCount + 1 } : c));
      },
    });

    // Step 3: Person enters restricted area
    demoSteps.push({
      delay: 3000,
      fn: () => {
        riskScore = 45;
        showToast({ type: 'warning', title: 'Restricted Zone Entry', message: `${trackId} entered Restricted Border Sector A.` });
        setEvents(prev => [{
          id: `EVT-${Date.now()}`,
          cameraId: targetCam,
          eventType: 'Restricted Zone Entry',
          severity: 'MEDIUM',
          trackingId: trackId,
          description: `Person ${trackId} entered restricted zone at ${targetCam}`,
          timestamp: new Date().toISOString(),
          status: 'NEW',
          riskScore,
          reasons: ['Restricted zone entry'],
        }, ...prev]);
      },
    });

    // Step 4: Virtual fence crossed
    demoSteps.push({
      delay: 4500,
      fn: () => {
        riskScore = 72;
        showToast({ type: 'alert', title: 'VIRTUAL FENCE CROSSING', message: `${trackId} crossed the virtual fence at ${targetCam}!` });
        const alert = makeAlert({
          severity: 'HIGH',
          riskScore,
          title: 'Virtual Fence Crossing',
          what: 'Person crossed virtual fence',
          why: 'Restricted zone + Fence crossing',
          reasons: ['Restricted zone', 'Virtual fence crossing'],
          reason: 'Restricted zone + Virtual fence crossing',
        });
        setAlerts(prev => [alert, ...prev]);
      },
    });

    // Step 5: Night-time condition
    demoSteps.push({
      delay: 6000,
      fn: () => {
        riskScore = 85;
        showToast({ type: 'alert', title: 'Night-Time Condition', message: 'Night-time movement confirmed. Risk score increasing.' });
        setCameras(prev => prev.map(c => c.id === targetCam ? { ...c, scenario: 'night' as ScenarioType } : c));
      },
    });

    // Step 6: Risk score increases to critical
    demoSteps.push({
      delay: 7500,
      fn: () => {
        riskScore = 92;
        showToast({ type: 'alert', title: 'RISK: CRITICAL', message: `Risk score reached ${riskScore}/100. Loitering detected.` });
      },
    });

    // Step 7: Critical alert appears
    demoSteps.push({
      delay: 8500,
      fn: () => {
        const alert = makeAlert({
          id: `A-${Date.now()}`,
          eventId: `EVT-${Date.now()}`,
          severity: 'CRITICAL',
          riskScore: 92,
          title: 'POSSIBLE BORDER INTRUSION',
          what: 'Person crossed virtual fence',
          why: 'Night-time + restricted zone + fence crossing + loitering',
          reasons: ['Restricted zone', 'Night-time detection', 'Virtual fence crossing', 'Loitering > 60s'],
          reason: 'Night-time + restricted zone + fence crossing + loitering',
        });
        setAlerts(prev => [alert, ...prev]);
        setEvents(prev => [{
          id: alert.eventId,
          cameraId: targetCam,
          eventType: 'Possible Border Intrusion',
          severity: 'CRITICAL',
          trackingId: trackId,
          description: `Critical intrusion at ${targetCam} — ${trackId}`,
          timestamp: new Date().toISOString(),
          status: 'NEW',
          riskScore: 92,
          reasons: alert.reasons,
        }, ...prev]);
        showToast({ type: 'alert', title: 'CRITICAL ALERT', message: 'Possible border intrusion detected at BOP-04!' });
      },
    });

    // Step 8-10: Auto-acknowledge, investigate, resolve
    demoSteps.push({
      delay: 11000,
      fn: () => {
        setAlerts(prev => prev.map(a =>
          a.title === 'POSSIBLE BORDER INTRUSION' && a.status === 'NEW'
            ? { ...a, status: 'ACKNOWLEDGED', acknowledgedAt: new Date().toISOString() }
            : a
        ));
        showToast({ type: 'info', title: 'Alert Acknowledged', message: 'Operator acknowledged the critical alert.' });
      },
    });
    demoSteps.push({
      delay: 13500,
      fn: () => {
        setAlerts(prev => prev.map(a =>
          a.title === 'POSSIBLE BORDER INTRUSION' && a.status === 'ACKNOWLEDGED'
            ? { ...a, status: 'INVESTIGATING' }
            : a
        ));
        showToast({ type: 'info', title: 'Investigating', message: 'Incident status: INVESTIGATING.' });
      },
    });
    demoSteps.push({
      delay: 16000,
      fn: () => {
        setAlerts(prev => prev.map(a =>
          a.title === 'POSSIBLE BORDER INTRUSION' && a.status === 'INVESTIGATING'
            ? { ...a, status: 'RESOLVED', resolvedAt: new Date().toISOString() }
            : a
        ));
        setEvents(prev => prev.map(e =>
          e.eventType === 'Possible Border Intrusion' && e.status !== 'RESOLVED'
            ? { ...e, status: 'RESOLVED' }
            : e
        ));
        showToast({ type: 'success', title: 'Incident Resolved', message: 'Border intrusion incident resolved.' });
        setLiveDemoRunning(false);
      },
    });

    let elapsed = 0;
    for (const step of demoSteps) {
      elapsed += step.delay;
      setTimeout(step.fn, elapsed);
    }

    demoTimer.current = setTimeout(() => {
      setLiveDemoRunning(false);
    }, elapsed + 1000);
  }, [liveDemoRunning, addAuditLog, showToast]);

  const stopLiveDemo = useCallback(() => {
    setLiveDemoRunning(false);
    if (demoTimer.current) clearTimeout(demoTimer.current);
    showToast({ type: 'info', title: 'Demo Stopped', message: 'Live demo has been stopped.' });
  }, [showToast]);

  // Simulate camera offline scenario
  const triggerCameraOffline = useCallback((cameraId: string) => {
    setCameras(prev => prev.map(c => c.id === cameraId ? {
      ...c, status: 'OFFLINE', fps: 0, latency: 0, health: 0, signalQuality: 0, recording: false, lastHeartbeat: new Date().toISOString(),
    } : c));
    const alert: Alert = {
      id: `A-${Date.now()}`,
      eventId: `EVT-${Date.now()}`,
      severity: 'HIGH',
      riskScore: 70,
      reason: 'Camera hardware failure / signal loss',
      reasons: ['Camera hardware failure', 'Signal loss'],
      status: 'NEW',
      createdAt: new Date().toISOString(),
      acknowledgedAt: null,
      resolvedAt: null,
      cameraId,
      trackingId: 'N/A',
      title: 'CAMERA OFFLINE',
      what: 'Camera went offline',
      where: cameraId,
      when: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
      object: 'Infrastructure',
      why: 'Camera hardware failure / signal loss',
      confidence: 100,
    };
    setAlerts(prev => [alert, ...prev]);
    showToast({ type: 'alert', title: 'CAMERA OFFLINE', message: `${cameraId} has gone offline!` });
    addAuditLog(`camera ${cameraId} went offline`, 'Hardware failure simulated');
  }, [showToast, addAuditLog]);

  // Periodic heartbeat simulation
  useEffect(() => {
    if (!demoMode || !user) return;
    const interval = setInterval(() => {
      setCameras(prev => prev.map(c => {
        if (c.status === 'ONLINE') {
          return { ...c, lastHeartbeat: new Date().toISOString(), fps: Math.max(20, c.fps + rand(-2, 2)), latency: Math.max(20, c.latency + rand(-5, 5)) };
        }
        return c;
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, [demoMode, user]);

  // WebSocket for Real-time AI Detections
  useEffect(() => {
    if (!user) return;
    let ws: WebSocket;
    try {
      ws = new WebSocket('ws://localhost:8000/ws/detections');
    } catch (e) {
      console.warn("WebSocket could not connect", e);
      return;
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'vehicle' && data.vehicle) {

          // DEMO OVERRIDE: Check if it's in our local registered watchlist!
          const plateText = (data.vehicle.plateNumber || "").toUpperCase();
          const isWanted = watchlistPlates.some(w => plateText.includes(w) || w.includes(plateText));
          if (isWanted && data.vehicle.status !== 'WATCHLIST') {
            data.vehicle.status = 'WATCHLIST';
          }

          setVehicles(prev => [data.vehicle, ...prev]);

          if (data.vehicle.status === 'WATCHLIST') {
            showToast({ type: 'alert', title: 'WATCHLIST MATCH', message: `Watchlist vehicle ${data.vehicle.plateNumber} detected!` });
            const alarm: Alert = {
              id: `A-${Date.now()}`,
              eventId: `EVT-${Date.now()}`,
              severity: 'CRITICAL',
              riskScore: 99,
              reason: 'Watchlist Vehicle Detected',
              reasons: ['Watchlist match'],
              status: 'NEW',
              createdAt: new Date().toISOString(),
              acknowledgedAt: null,
              resolvedAt: null,
              cameraId: data.vehicle.cameraId,
              trackingId: data.vehicle.id,
              title: 'WANTED VEHICLE DETECTED',
              what: `Vehicle matched plate: ${data.vehicle.plateNumber}`,
              where: data.vehicle.cameraId,
              when: new Date().toLocaleTimeString('en-IN'),
              object: data.vehicle.vehicleType,
              why: 'ANPR Database Match',
              confidence: data.vehicle.confidence,
            };
            setActiveAlarm(alarm);
          } else {
            showToast({ type: 'info', title: 'Vehicle Detected', message: `Plate ${data.vehicle.plateNumber} detected.` });
          }
        } else if (data.type === 'intrusion') {
          const camId = data.camera || 'CAM-Unknown';
          const matchedZone = zones.find(z => z.cameraIds.includes(camId));
          const zoneTitle = matchedZone ? `BREACH: ${matchedZone.name.toUpperCase()}` : 'BORDER INTRUSION';

          const alarm: Alert = {
            id: `A-${Date.now()}`,
            eventId: `EVT-${Date.now()}`,
            severity: matchedZone ? matchedZone.severity : 'CRITICAL',
            riskScore: matchedZone ? (matchedZone.severity === 'CRITICAL' ? 95 : 80) : 95,
            reason: matchedZone ? matchedZone.rule : 'Border / Virtual Fence Intrusion',
            reasons: ['Virtual fence crossed', ...(matchedZone ? ['Zone security breached'] : [])],
            status: 'NEW',
            createdAt: new Date().toISOString(),
            acknowledgedAt: null,
            resolvedAt: null,
            cameraId: camId,
            trackingId: `TRK-${Date.now()}`,
            title: zoneTitle,
            what: 'Human entered restricted zone',
            where: matchedZone ? `${matchedZone.name} (${camId})` : camId,
            when: new Date().toLocaleTimeString('en-IN'),
            object: 'Person',
            why: 'Virtual Fence Rule Violated',
            confidence: 90,
          };
          setActiveAlarm(alarm);
        }
      } catch (e) {
        console.error('Error parsing WS message', e);
      }
    };

    return () => {
      if (ws) ws.close();
    };
  }, [user, showToast, watchlistPlates, setActiveAlarm, zones]);
  const value: AppState = {
    user, token, login, logout, demoMode, setDemoMode,
    cameras, events, alerts, vehicles, zones, tracks, auditLogs, faces, detections,
    liveDemoRunning, startLiveDemo, stopLiveDemo,
    setCameraScenario, acknowledgeAlert, escalateAlert, resolveAlert,
    addZone, deleteZone, addAuditLog, addAlert, triggerCameraOffline, toast, showToast,
    activeAlarm, setActiveAlarm, watchlistPlates, addToWatchlist,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
