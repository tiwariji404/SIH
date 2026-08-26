import { useState, useRef, useCallback } from 'react';
import { useApp } from '../store';
import CameraFeed from '../components/CameraFeed';
import { Radio, Grid3x3, Cctv, Smartphone, X, RefreshCw } from 'lucide-react';
import type { ScenarioType } from '../types';

const SCENARIOS: { value: ScenarioType; label: string; color: string }[] = [
  { value: 'normal', label: 'Normal', color: 'text-emerald-400' },
  { value: 'intrusion', label: 'Intrusion', color: 'text-red-400' },
  { value: 'night', label: 'Night Movement', color: 'text-indigo-400' },
  { value: 'suspicious', label: 'Suspicious Activity', color: 'text-amber-400' },
  { value: 'vehicle', label: 'Vehicle', color: 'text-blue-400' },
  { value: 'anpr', label: 'ANPR', color: 'text-purple-400' },
];

export default function LiveSurveillance() {
  const { cameras, detections, setCameraScenario } = useApp();
  const [gridSize, setGridSize] = useState<'2x2' | '3x3'>('2x2');
  const [selectedCam, setSelectedCam] = useState<string | null>(null);
  const [liveStream, setLiveStream] = useState<MediaStream | null>(null);
  const [liveCamId, setLiveCamId] = useState<string | null>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

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
      // Assign to first online camera
      const firstCam = cameras.find(c => c.status === 'ONLINE');
      if (firstCam) setLiveCamId(firstCam.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to access camera';
      setCamError(msg);
    } finally {
      setConnecting(false);
    }
  }, [cameras]);

  const disconnectPhoneCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setLiveStream(null);
    setLiveCamId(null);
  }, []);

  const assignLiveToCam = useCallback((camId: string) => {
    setLiveCamId(camId);
  }, []);

  const visibleCameras = selectedCam
    ? cameras.filter(c => c.id === selectedCam)
    : cameras.filter(c => c.status !== 'OFFLINE').slice(0, gridSize === '2x2' ? 4 : 9);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Live Surveillance</h1>
          <p className="text-xs text-slate-500">Real-time CCTV monitoring with AI detection overlay</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Phone camera connect button */}
          {liveStream ? (
            <button onClick={disconnectPhoneCamera} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors">
              <X className="h-3.5 w-3.5" />
              <span className="text-[10px] font-mono">DISCONNECT PHONE</span>
            </button>
          ) : (
            <button
              onClick={connectPhoneCamera}
              disabled={connecting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span className="text-[10px] font-mono">{connecting ? 'CONNECTING...' : 'CONNECT PHONE'}</span>
            </button>
          )}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
            <button onClick={() => setGridSize('2x2')} className={`p-1.5 rounded ${gridSize === '2x2' ? 'bg-accent-500/20 text-accent-300' : 'text-slate-500'}`}>
              <Grid3x3 className="h-4 w-4" />
            </button>
            <button onClick={() => setGridSize('3x3')} className={`px-2 py-1.5 rounded text-[10px] font-mono ${gridSize === '3x3' ? 'bg-accent-500/20 text-accent-300' : 'text-slate-500'}`}>
              3×3
            </button>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
            <Radio className="h-3 w-3 text-red-400 animate-pulse" />
            <span className="text-[10px] font-mono text-red-400">LIVE</span>
          </div>
        </div>
      </div>

      {/* Phone camera status / error */}
      {camError && (
        <div className="card p-3 border-red-500/20 bg-red-500/5">
          <div className="flex items-start gap-2">
            <X className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-red-300">Camera Access Failed</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{camError}</p>
              <p className="text-[10px] text-slate-500 mt-1">
                Tip: The browser needs camera permission. On phone, open this page over HTTPS and allow camera access when prompted.
              </p>
            </div>
            <button onClick={connectPhoneCamera} className="flex items-center gap-1 text-[10px] text-accent-400 hover:text-accent-300">
              <RefreshCw className="h-3 w-3" /> Retry
            </button>
          </div>
        </div>
      )}

      {liveStream && (
        <div className="card p-3 border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-center gap-2 flex-wrap">
            <Smartphone className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <p className="text-xs text-emerald-300">
              <span className="font-semibold">Phone camera connected.</span> Assign it to a camera slot below:
            </p>
            <select
              value={liveCamId || ''}
              onChange={e => assignLiveToCam(e.target.value)}
              className="bg-ink-900 border border-emerald-500/20 rounded px-2 py-1 text-[10px] text-slate-300 focus:outline-none focus:border-emerald-500/50 ml-auto"
            >
              {cameras.filter(c => c.status !== 'OFFLINE').map(c => (
                <option key={c.id} value={c.id}>{c.id} — {c.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Camera selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedCam(null)}
          className={`badge whitespace-nowrap ${!selectedCam ? 'bg-accent-500/20 text-accent-300 border border-accent-500/30' : 'bg-white/5 text-slate-400 border border-white/5'}`}
        >
          All Cameras
        </button>
        {cameras.map(cam => (
          <button
            key={cam.id}
            onClick={() => setSelectedCam(cam.id)}
            className={`badge whitespace-nowrap ${selectedCam === cam.id ? 'bg-accent-500/20 text-accent-300 border border-accent-500/30' : 'bg-white/5 text-slate-400 border border-white/5'} ${cam.status === 'OFFLINE' ? 'opacity-50' : ''}`}
          >
            <span className={`status-dot ${liveCamId === cam.id ? 'bg-emerald-400' : cam.status === 'ONLINE' ? 'bg-emerald-400' : cam.status === 'DEGRADED' ? 'bg-amber-400' : 'bg-red-500'}`} />
            {cam.id}
            {liveCamId === cam.id && <Smartphone className="h-2.5 w-2.5 ml-0.5 inline" />}
          </button>
        ))}
      </div>

      {/* Camera grid */}
      <div className={`grid gap-3 ${gridSize === '2x2' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
        {visibleCameras.map(cam => (
          <div key={cam.id} className="space-y-2">
            <CameraFeed
              camera={cam}
              detections={detections}
              liveStream={liveCamId === cam.id ? liveStream : null}
            />
            {/* Camera info + scenario selector */}
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-200 truncate">
                  {cam.id} — {cam.name}
                  {liveCamId === cam.id && <span className="text-emerald-400"> (Phone)</span>}
                </p>
                <p className="text-[10px] text-slate-500 truncate">{cam.bop} • {cam.location}</p>
              </div>
              <select
                value={cam.scenario}
                onChange={e => setCameraScenario(cam.id, e.target.value as ScenarioType)}
                className="bg-ink-900 border border-white/10 rounded px-2 py-1 text-[10px] text-slate-300 focus:outline-none focus:border-accent-500/50"
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

      {/* Offline cameras notice */}
      {cameras.some(c => c.status === 'OFFLINE') && (
        <div className="card p-3 border-red-500/20 bg-red-500/5">
          <div className="flex items-center gap-2">
            <Cctv className="h-4 w-4 text-red-400" />
            <p className="text-xs text-red-300">
              {cameras.filter(c => c.status === 'OFFLINE').length} camera(s) offline: {cameras.filter(c => c.status === 'OFFLINE').map(c => c.id).join(', ')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
