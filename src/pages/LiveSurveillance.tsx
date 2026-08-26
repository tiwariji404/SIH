import { useState, useRef, useCallback, useEffect } from 'react';
import { useApp } from '../store';
import CameraFeed from '../components/CameraFeed';
import { Radio, Grid3x3, Cctv, Smartphone, X, RefreshCw, AlertTriangle, ShieldAlert } from 'lucide-react';
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
  const { cameras, detections, setCameraScenario, activeAlarm, setActiveAlarm, escalateAlert, addAlert, showToast } = useApp();
  const [gridSize, setGridSize] = useState<'2x2' | '3x3'>('2x2');
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedCam, setSelectedCam] = useState<string | null>(null);
  const [liveStream, setLiveStream] = useState<MediaStream | null>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let audio: HTMLAudioElement;
    let timer: number;
    if (activeAlarm) {
       // Play loud siren
       audio = new Audio('https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg');
       audio.loop = true;
       audio.play().catch(e => console.log('Autoplay blocked', e));
       
       setTimeLeft(30);
       timer = window.setInterval(() => {
          setTimeLeft(t => {
             if (t <= 1) {
                // ESCALATE!
                addAlert(activeAlarm);
                escalateAlert(activeAlarm.id);
                // In production, we write to Firebase here (already implemented conceptually via API docs)
                showToast({ type: 'warning', title: 'ALARM ESCALATED', message: 'Operator failed to respond. Escalated to Sub-Admin.' });
                setActiveAlarm(null);
                return 0;
             }
             return t - 1;
          });
       }, 1000);
    }
    return () => {
       if (audio) { audio.pause(); audio.currentTime = 0; }
       if (timer) clearInterval(timer);
    }
  }, [activeAlarm, addAlert, escalateAlert, setActiveAlarm, showToast]);

  const handleDismissAlarm = () => {
     setActiveAlarm(null);
     showToast({ type: 'info', title: 'Alarm Cancelled', message: 'You have cancelled the alarm.' });
  };

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
  }, [cameras]);

  const disconnectPhoneCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setLiveStream(null);
  }, []);

  const visibleCameras = selectedCam
    ? cameras.filter(c => c.id === selectedCam)
    : cameras.filter(c => c.status !== 'OFFLINE');

  return (
    <div className="space-y-4 animate-fade-in relative block">
      
      {/* ALARM OVERLAY */}
      {activeAlarm && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className="absolute inset-0 bg-red-600/20 animate-pulse pointer-events-auto backdrop-blur-[2px]"></div>
          <div className="relative z-10 bg-white border-4 border-red-600 rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl shadow-red-600/50 pointer-events-auto flex flex-col items-center text-center animate-bounce-slow">
             <ShieldAlert className="h-24 w-24 text-red-600 mb-6 animate-pulse" />
             <h2 className="text-4xl font-black text-red-700 tracking-widest uppercase mb-2">
                {activeAlarm.title}
             </h2>
             <p className="text-xl font-bold text-slate-800 mb-4">{activeAlarm.what} at {activeAlarm.where}</p>
             <div className="w-full bg-slate-100 p-4 rounded-xl border border-slate-200 mb-8 text-left">
                <p className="text-sm font-bold text-red-600 mb-1 tracking-wider uppercase">Detection Confidence: {activeAlarm.confidence}%</p>
                <p className="text-sm font-medium text-slate-600 mb-1">Reason: {activeAlarm.reason}</p>
                <div className="mt-4 flex items-center justify-between bg-red-50 p-3 rounded-lg border border-red-200">
                   <span className="text-xs font-bold text-red-800 uppercase tracking-widest">Escalation Timer</span>
                   <span className="text-2xl font-black text-red-700 font-mono">00:{timeLeft.toString().padStart(2, '0')}</span>
                </div>
             </div>
             
             <div className="flex gap-4 w-full">
               <button onClick={handleDismissAlarm} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-4 rounded-xl uppercase tracking-widest transition-colors">
                  Acknowledge & Cancel
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Live Surveillance</h1>
          <p className="text-xs text-slate-600">Real-time CCTV monitoring with AI detection overlay</p>
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
          <div className="flex items-center gap-1 p-1 rounded-lg bg-white border border-slate-200">
            <button onClick={() => setGridSize('2x2')} className={`p-1.5 rounded ${gridSize === '2x2' ? 'bg-accent-500/20 text-accent-300' : 'text-slate-600'}`}>
              <Grid3x3 className="h-4 w-4" />
            </button>
            <button onClick={() => setGridSize('3x3')} className={`px-2 py-1.5 rounded text-[10px] font-mono ${gridSize === '3x3' ? 'bg-accent-500/20 text-accent-300' : 'text-slate-600'}`}>
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
              <p className="text-[11px] text-slate-600 mt-0.5">{camError}</p>
              <p className="text-[10px] text-slate-600 mt-1">
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
              <span className="font-semibold">Phone camera connected.</span> Broadcasting live feed to all camera channels.
            </p>
          </div>
        </div>
      )}

      {/* Camera selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedCam(null)}
          className={`badge whitespace-nowrap ${!selectedCam ? 'bg-accent-500/20 text-accent-300 border border-accent-500/30' : 'bg-white text-slate-600 border border-slate-200'}`}
        >
          All Cameras
        </button>
        {cameras.map(cam => (
          <button
            key={cam.id}
            onClick={() => setSelectedCam(cam.id)}
            className={`badge whitespace-nowrap ${selectedCam === cam.id ? 'bg-accent-500/20 text-accent-300 border border-accent-500/30' : 'bg-white text-slate-600 border border-slate-200'} ${cam.status === 'OFFLINE' ? 'opacity-50' : ''}`}
          >
            <span className={`status-dot ${liveStream ? 'bg-emerald-400' : cam.status === 'ONLINE' ? 'bg-emerald-400' : cam.status === 'DEGRADED' ? 'bg-amber-400' : 'bg-red-500'}`} />
            {cam.id}
            {liveStream && <Smartphone className="h-2.5 w-2.5 ml-0.5 inline" />}
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
              liveStream={liveStream}
            />
            {/* Camera info + scenario selector */}
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-800 truncate">
                  {cam.id} — {cam.name}
                  {liveStream && <span className="text-emerald-400"> (Phone)</span>}
                </p>
                <p className="text-[10px] text-slate-600 truncate">{cam.bop} • {cam.location}</p>
              </div>
              <select
                value={cam.scenario}
                onChange={e => setCameraScenario(cam.id, e.target.value as ScenarioType)}
                className="bg-ink-900 border border-slate-200 rounded px-2 py-1 text-[10px] text-slate-700 focus:outline-none focus:border-accent-500/50"
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
