import { useState, useRef, useCallback, useEffect } from 'react';
import { useApp } from '../store';
import CameraFeed from '../components/CameraFeed';
import { Radio, Grid3x3, Cctv, Smartphone, X, RefreshCw, Shield } from 'lucide-react';
import type { ScenarioType, Camera } from '../types';

const SCENARIOS: { value: ScenarioType; label: string; color: string }[] = [
  { value: 'normal', label: 'Normal', color: 'text-emerald-400' },
  { value: 'intrusion', label: 'Intrusion', color: 'text-red-400' },
  { value: 'night', label: 'Night Movement', color: 'text-indigo-400' },
  { value: 'suspicious', label: 'Suspicious Activity', color: 'text-amber-400' },
  { value: 'vehicle', label: 'Vehicle', color: 'text-blue-400' },
  { value: 'anpr', label: 'ANPR', color: 'text-purple-400' },
];

export default function LiveSurveillance() {
  const { cameras, setCameraScenario, detections, selectedLiveCameraIds, setSelectedLiveCameraIds } = useApp();
  const [gridSize, setGridSize] = useState<'2x2' | '3x3'>('2x2');
  const [liveStream, setLiveStream] = useState<MediaStream | null>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Only standard component mounts here. Global Alarm handles timer.
  }, []);

  const connectPhoneCamera = useCallback(async () => {
    setCamError(null);
    setConnecting(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not available. Use HTTPS or localhost.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setLiveStream(stream);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to access camera';
      setCamError(msg);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnectPhoneCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setLiveStream(null);
  }, []);

  const visibleCameras = selectedLiveCameraIds && selectedLiveCameraIds.length > 0
    ? cameras.filter(c => selectedLiveCameraIds.includes(c.id))
    : cameras.filter(c => c.status !== 'OFFLINE').slice(0, 2); // Show only 2 demo cameras by default

  const [hardwareCameras, setHardwareCameras] = useState<MediaDeviceInfo[]>([]);
  const hardwareStreamsRef = useRef<{ [deviceId: string]: MediaStream }>({});

  useEffect(() => {
    // Only standard component mounts here. Global Alarm handles timer.
    const loadHardwareCameras = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        setHardwareCameras(videoDevices);
        
        // Auto-connect to them
        for (const device of videoDevices) {
          if (!hardwareStreamsRef.current[device.deviceId]) {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: device.deviceId } },
                audio: false
              });
              hardwareStreamsRef.current[device.deviceId] = stream;
            } catch (e) {
              console.error("Could not start hardware camera", device.label, e);
            }
          }
        }
        // Force a re-render to show streams
        setHardwareCameras([...videoDevices]); 
      } catch (err) {
        console.error("Hardware enumeration failed", err);
      }
    };
    
    loadHardwareCameras();
    
    if (navigator.mediaDevices) {
      navigator.mediaDevices.addEventListener('devicechange', loadHardwareCameras);
    }
    
    return () => {
      if (navigator.mediaDevices) {
        navigator.mediaDevices.removeEventListener('devicechange', loadHardwareCameras);
      }
      // Stop streams on unmount
      Object.values(hardwareStreamsRef.current).forEach(stream => {
        stream.getTracks().forEach(t => t.stop());
      });
      hardwareStreamsRef.current = {};
    };
  }, []);

  return (
    <div className="live-shell space-y-5 animate-fade-in relative pb-8">
      <div className="glass-panel live-hero p-5 sm:p-6">
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="section-kicker">Operations view</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-800">Live Surveillance</h1>
            <p className="mt-2 text-sm text-slate-600">Real-time CCTV monitoring with AI detection overlay and tactical response cues.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="glass-chip glass-chip-success">
              <span className="status-dot bg-emerald-500 animate-pulse" />
              <span>LIVE</span>
            </div>
            <div className="glass-chip glass-chip-slate">
              <Radio className="h-3.5 w-3.5 text-red-500" />
              <span>12 channels active</span>
            </div>
            <div className="glass-chip glass-chip-slate">
              <Shield className="h-3.5 w-3.5 text-emerald-500" />
              <span>Encrypted</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="glass-metric-card border-orange-200">
          <div className="metric-top">
            <div className="metric-icon bg-orange-500/10">
              <Cctv className="h-5 w-5 text-orange-500" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-600">Feeds</span>
          </div>
          <p className="metric-value mt-5">{visibleCameras.length}</p>
          <p className="metric-label">Active monitored</p>
        </div>

        <div className="glass-metric-card border-emerald-200">
          <div className="metric-top">
            <div className="metric-icon bg-emerald-500/10">
              <Shield className="h-5 w-5 text-emerald-500" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600">Status</span>
          </div>
          <p className="metric-value mt-5">{cameras.filter(c => c.status === 'ONLINE').length}</p>
          <p className="metric-label">Online cameras</p>
        </div>

        <div className="glass-metric-card border-indigo-200">
          <div className="metric-top">
            <div className="metric-icon bg-indigo-500/10">
              <Grid3x3 className="h-5 w-5 text-indigo-500" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600">Layout</span>
          </div>
          <p className="metric-value mt-5">{gridSize}</p>
          <p className="metric-label">Current grid</p>
        </div>

        <div className="glass-metric-card border-red-200">
          <div className="metric-top">
            <div className="metric-icon bg-red-500/10">
              <Radio className="h-5 w-5 text-red-500" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-600">Signal</span>
          </div>
          <p className="metric-value mt-5">{liveStream ? 'Phone' : 'Network'}</p>
          <p className="metric-label">Input source</p>
        </div>
      </div>

      <div className="glass-panel live-toolbar p-4 sm:p-5">
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedLiveCameraIds(null)}
              className={`glass-chip whitespace-nowrap ${!selectedLiveCameraIds || selectedLiveCameraIds.length === 0 ? 'glass-chip-active' : 'glass-chip-slate'}`}
            >
              All Cameras
            </button>
            {cameras.map(cam => {
              const isSelected = selectedLiveCameraIds?.includes(cam.id);
              return (
                <button
                  key={cam.id}
                  onClick={() => setSelectedLiveCameraIds([cam.id])}
                  className={`glass-chip whitespace-nowrap ${isSelected ? 'glass-chip-active' : 'glass-chip-slate'} ${cam.status === 'OFFLINE' ? 'opacity-50' : ''}`}
                >
                  <span className={`status-dot ${liveStream ? 'bg-emerald-400' : cam.status === 'ONLINE' ? 'bg-emerald-400' : cam.status === 'DEGRADED' ? 'bg-amber-400' : 'bg-red-500'}`} />
                  {cam.id}
                  {liveStream && <Smartphone className="ml-0.5 h-2.5 w-2.5 inline" />}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 self-end lg:self-auto">
            {liveStream ? (
              <button
                onClick={disconnectPhoneCamera}
                className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-red-600 transition-colors hover:bg-red-100"
              >
                <X className="h-3.5 w-3.5" />
                Disconnect phone
              </button>
            ) : (
              <button
                onClick={connectPhoneCamera}
                disabled={connecting}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50"
              >
                <Smartphone className="h-3.5 w-3.5" />
                {connecting ? 'Connecting...' : 'Connect phone'}
              </button>
            )}

            <div className="glass-toggle">
              <button
                onClick={() => setGridSize('2x2')}
                className={`rounded-lg p-2 ${gridSize === '2x2' ? 'bg-orange-50 text-orange-600' : 'text-slate-600 hover:bg-slate-100'}`}
                aria-label="2x2 grid"
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setGridSize('3x3')}
                className={`rounded-lg px-2.5 py-2 text-[10px] font-black uppercase tracking-[0.2em] ${gridSize === '3x3' ? 'bg-orange-50 text-orange-600' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                3×3
              </button>
            </div>
          </div>
        </div>
      </div>

      {camError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 shadow-sm">
          <div className="flex items-start gap-2">
            <X className="mt-0.5 h-4 w-4 text-red-500" />
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">Camera access failed</p>
              <p className="mt-1 text-sm text-red-700">{camError}</p>
              <p className="mt-1 text-[11px] text-slate-600">
                Tip: The browser needs camera permission. On phone, allow access over HTTPS and retry.
              </p>
            </div>
            <button onClick={connectPhoneCamera} className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-600 hover:text-red-700">
              Retry
            </button>
          </div>
        </div>
      )}

      {liveStream && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-emerald-600" />
            <p className="text-sm text-emerald-700">
              <span className="font-bold">Phone camera connected.</span> Broadcasting live feed to all camera viewports.
            </p>
          </div>
        </div>
      )}

      <div className={`grid gap-4 ${gridSize === '2x2' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
        {hardwareCameras.map((device, index) => {
          const hwStream = hardwareStreamsRef.current[device.deviceId];
          const mockHwCam = {
            id: `HW-${index + 1}`,
            name: device.label || `USB Camera ${index + 1}`,
            location: 'Local System',
            bop: 'Command Center',
            status: 'ONLINE' as const,
            fps: 30,
            scenario: 'normal' as const,
            recording: false,
          };

          return (
            <div key={device.deviceId} className="space-y-2">
              <div className="camera-card relative">
                <CameraFeed
                  camera={mockHwCam as unknown as Camera}
                  detections={[]}
                  liveStream={hwStream || null}
                />
                <div className="absolute right-2 top-2 z-20 flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-950/80 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-300 backdrop-blur-md">
                  <Shield className="h-3 w-3" />
                  AES-256
                </div>
              </div>

              <div className="camera-meta">
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-800">
                    {mockHwCam.id} — {mockHwCam.name}
                    <span className="ml-1 text-blue-500">(Hardware)</span>
                  </p>
                  <p className="truncate text-[10px] text-slate-600">{mockHwCam.bop} • {mockHwCam.location}</p>
                </div>
                <select disabled className="glass-select opacity-50">
                  <option>Normal</option>
                </select>
              </div>
            </div>
          );
        })}

        {visibleCameras.map(cam => (
          <div key={cam.id} className="space-y-2">
            <div className="camera-card relative">
              <CameraFeed
                camera={cam}
                detections={detections}
                liveStream={liveStream}
              />
            </div>

            <div className="camera-meta">
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-800">
                  {cam.id} — {cam.name}
                  {liveStream && <span className="ml-1 text-emerald-500">(Phone)</span>}
                </p>
                <p className="truncate text-[10px] text-slate-600">{cam.bop} • {cam.location}</p>
              </div>
              <select
                value={cam.scenario}
                onChange={e => setCameraScenario(cam.id, e.target.value as ScenarioType)}
                className="glass-select"
                disabled={cam.status === 'OFFLINE'}
              >
                {SCENARIOS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>

      {cameras.some(c => c.status === 'OFFLINE') && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Cctv className="h-4 w-4 text-red-500" />
            <p className="text-sm text-red-700">
              {cameras.filter(c => c.status === 'OFFLINE').length} camera(s) offline: {cameras.filter(c => c.status === 'OFFLINE').map(c => c.id).join(', ')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
