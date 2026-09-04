import { useEffect, useRef, useState } from 'react';
import type { Camera } from '../types';
import { useApp } from '../store';

// Local detection type for CameraFeed overlay (from backend WebSocket payload)
interface DetectionOverlay {
  id: string;
  cameraId: string;
  objectType: string;
  trackingId: string;
  confidence: number;
  bbox: { x: number; y: number; w: number; h: number };
  label: string;
}

interface Props {
  camera: Camera;
  detections?: DetectionOverlay[];
  showOverlay?: boolean;
  compact?: boolean;
  liveStream?: MediaStream | null;
}

const scenarioLabels: Record<string, string> = {
  normal: 'NORMAL',
  intrusion: 'INTRUSION',
  night: 'NIGHT MODE',
  suspicious: 'SUSPICIOUS',
  vehicle: 'VEHICLE',
  anpr: 'ANPR',
  camera_failure: 'OFFLINE',
};

export default function CameraFeed({ camera, detections = [], showOverlay = true, compact = false, liveStream = null }: Props) {
  const { zones } = useApp();
  const [time, setTime] = useState(new Date());
  const [scanY, setScanY] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (camera.status === 'OFFLINE') return;
    const t = setInterval(() => setScanY(prev => (prev + 2) % 100), 50);
    return () => clearInterval(t);
  }, [camera.status]);

  useEffect(() => {
    if (liveStream && videoRef.current) {
      videoRef.current.srcObject = liveStream;
      videoRef.current.play().catch(() => {});
    }
  }, [liveStream]);

  const isOffline = camera.status === 'OFFLINE' || camera.status === 'DISCONNECTED';
  const isNight = false; // Night mode determined by backend event, not frontend toggle
  const camDetections = detections.filter(d => d.cameraId === camera.id);
  const hasLive = !!liveStream;
  const camZones = zones.filter(z => z.cameraId === camera.id);

  return (
    <div className={`relative overflow-hidden rounded-lg border bg-black ${isOffline ? 'border-red-500/30' : hasLive ? 'border-emerald-500/40' : 'border-white/10'}`}>
      <div className={`relative ${compact ? 'h-40' : 'h-56'} w-full overflow-hidden`}>
        {isOffline ? (
          <div className="flex h-full w-full items-center justify-center bg-black">
            <div className="text-center">
              <div className="mb-2 text-4xl text-red-500/40">!</div>
              <p className="text-xs font-mono text-red-400/60">SIGNAL LOST</p>
              <p className="mt-1 text-[10px] text-slate-600">Last frame unavailable</p>
            </div>
          </div>
        ) : (
          <div className={`relative h-full w-full ${isNight ? 'bg-gradient-to-b from-slate-950 via-indigo-950/40 to-slate-950' : 'bg-gradient-to-b from-slate-800 via-slate-700/60 to-slate-900'}`}>
            {/* Live video from phone camera */}
            {hasLive && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}

            {/* Grid overlay */}
            {!hasLive && <div className="absolute inset-0 grid-overlay opacity-40" />}

            {/* Scanline */}
            <div className="absolute inset-x-0 h-px bg-accent-400/20 pointer-events-none" style={{ top: `${scanY}%` }} />

            {/* Waiting for stream placeholder */}
            {!hasLive && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-[10px] font-mono text-slate-500">AWAITING STREAM</p>
              </div>
            )}

            {/* Virtual Fences Overlay */}
            {camZones.length > 0 && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                {camZones.map(zone => (
                  <polygon
                    key={zone.id}
                    points={zone.coordinates.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="rgba(239,68,68,0.1)"
                    stroke={zone.severity === 'CRITICAL' ? '#ef4444' : '#f97316'}
                    strokeWidth="0.5"
                    strokeDasharray="2 1"
                  />
                ))}
              </svg>
            )}

            {/* Detection boxes */}
            {showOverlay && camDetections.map(det => (
              <DetectionBox key={det.id} det={det} night={isNight} />
            ))}

            {/* No fake default detections — only real AI detections from backend */}

            {/* Night vision tint */}
            {isNight && (
              <div className="absolute inset-0 bg-emerald-900/10 mix-blend-overlay pointer-events-none" />
            )}
          </div>
        )}

        {/* Top overlay bar */}
        {!isOffline && (
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-2 py-1 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
            <div className="flex items-center gap-1.5">
              <span className={`status-dot ${hasLive ? 'bg-emerald-400' : camera.status === 'ONLINE' ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
              <span className="text-[10px] font-mono text-slate-700">{camera.id}</span>
              {hasLive && (
                <span className="badge bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] px-1 py-0">LIVE CAM</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {camera.recording && (
                <span className="flex items-center gap-1 text-[10px] text-red-400">
                  <span className="status-dot bg-red-500 animate-pulse" /> REC
                </span>
              )}
              <span className="text-[10px] font-mono text-slate-600">{hasLive ? '30 FPS' : `${camera.fps} FPS`}</span>
            </div>
          </div>
        )}

        {/* Bottom overlay bar */}
        {!isOffline && !compact && (
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-2 py-1 bg-gradient-to-t from-black/70 to-transparent pointer-events-none">
            <span className="text-[10px] text-slate-700 truncate">{camera.name} — {camera.location}</span>
            <span className="text-[10px] font-mono text-accent-300">
              {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </span>
          </div>
        )}

        {/* Status badge */}
        {!isOffline && (
          <div className="absolute top-7 right-2 pointer-events-none">
            <span className="badge bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
              {camera.status}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function DetectionBox({ det, night }: { det: DetectionOverlay; night: boolean }) {
  const colors: Record<string, string> = {
    person: 'border-accent-400',
    vehicle: 'border-blue-400',
    face: 'border-purple-400',
    plate: 'border-amber-400',
  };
  const color = colors[det.objectType] || 'border-accent-400';
  const labelBg: Record<string, string> = {
    person: 'bg-accent-500/80',
    vehicle: 'bg-blue-500/80',
    face: 'bg-purple-500/80',
    plate: 'bg-amber-500/80',
  };

  return (
    <div
      className={`absolute border-2 ${color} rounded-sm pointer-events-none`}
      style={{
        left: `${det.bbox.x}%`,
        top: `${det.bbox.y}%`,
        width: `${det.bbox.w}%`,
        height: `${det.bbox.h}%`,
      }}
    >
      <div className={`absolute -top-5 left-0 ${labelBg[det.objectType]} px-1.5 py-0.5 rounded-sm text-[9px] font-mono text-white whitespace-nowrap`}>
        {det.label} | {det.trackingId} | {det.confidence}%
      </div>
      {det.objectType === 'person' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-2 h-2 rounded-full ${night ? 'bg-accent-300' : 'bg-accent-400'} animate-ping`} />
        </div>
      )}
    </div>
  );
}

// DefaultDetection removed — only real AI backend detections are displayed
