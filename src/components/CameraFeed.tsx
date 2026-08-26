import { useEffect, useRef, useState } from 'react';
import type { Camera, Detection } from '../types';

interface Props {
  camera: Camera;
  detections?: Detection[];
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

  const isOffline = camera.status === 'OFFLINE';
  const isNight = camera.scenario === 'night';
  const camDetections = detections.filter(d => d.cameraId === camera.id);
  const hasLive = !!liveStream;

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

            {/* Simulated scene elements (only when no live video) */}
            {!hasLive && (
              <div className={`absolute ${isNight ? 'opacity-30' : 'opacity-60'}`}>
                {camera.scenario === 'vehicle' || camera.scenario === 'anpr' ? (
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                    <div className="h-8 w-20 rounded bg-slate-600/50 shadow-lg" />
                    <div className="mx-auto -mt-6 h-5 w-16 rounded-t bg-slate-500/50" />
                  </div>
                ) : null}
              </div>
            )}

            {/* Detection boxes */}
            {showOverlay && camDetections.map(det => (
              <DetectionBox key={det.id} det={det} night={isNight} />
            ))}

            {/* Default simulated detection if no explicit detections */}
            {showOverlay && camDetections.length === 0 && camera.status === 'ONLINE' && camera.scenario !== 'normal' && !hasLive && (
              <DefaultDetection camera={camera} night={isNight} />
            )}

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
              <span className="text-[10px] font-mono text-slate-300">{camera.id}</span>
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
              <span className="text-[10px] font-mono text-slate-400">{hasLive ? '30 FPS' : `${camera.fps} FPS`}</span>
            </div>
          </div>
        )}

        {/* Bottom overlay bar */}
        {!isOffline && !compact && (
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-2 py-1 bg-gradient-to-t from-black/70 to-transparent pointer-events-none">
            <span className="text-[10px] text-slate-300 truncate">{camera.name} — {camera.location}</span>
            <span className="text-[10px] font-mono text-accent-300">
              {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </span>
          </div>
        )}

        {/* Scenario badge */}
        {!isOffline && (
          <div className="absolute top-7 right-2 pointer-events-none">
            <span className={`badge ${camera.scenario === 'normal' ? 'bg-emerald-500/20 text-emerald-300' : camera.scenario === 'night' ? 'bg-indigo-500/20 text-indigo-300' : camera.scenario === 'intrusion' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'}`}>
              {scenarioLabels[camera.scenario]}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function DetectionBox({ det, night }: { det: Detection; night: boolean }) {
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

function DefaultDetection({ camera, night }: { camera: Camera; night: boolean }) {
  const isVehicle = camera.scenario === 'vehicle' || camera.scenario === 'anpr';
  const isPerson = camera.scenario === 'intrusion' || camera.scenario === 'night' || camera.scenario === 'suspicious';

  if (isVehicle) {
    return (
      <div className="absolute" style={{ left: '35%', top: '50%', width: '30%', height: '25%' }}>
        <div className="absolute inset-0 border-2 border-blue-400 rounded-sm" />
        <div className="absolute -top-5 left-0 bg-blue-500/80 px-1.5 py-0.5 rounded-sm text-[9px] font-mono text-white whitespace-nowrap">
          CAR | V-022 | 95%
        </div>
        {camera.scenario === 'anpr' && (
          <div className="absolute -bottom-6 left-0 bg-amber-500/80 px-1.5 py-0.5 rounded-sm text-[9px] font-mono text-white whitespace-nowrap">
            CG04AB1234 | 96%
          </div>
        )}
      </div>
    );
  }

  if (isPerson) {
    return (
      <div className="absolute" style={{ left: '40%', top: '30%', width: '18%', height: '40%' }}>
        <div className={`absolute inset-0 border-2 ${night ? 'border-indigo-400' : 'border-accent-400'} rounded-sm`}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-2 h-2 rounded-full ${night ? 'bg-indigo-300' : 'bg-accent-400'} animate-ping`} />
          </div>
        </div>
        <div className={`absolute -top-5 left-0 ${night ? 'bg-indigo-500/80' : 'bg-accent-500/80'} px-1.5 py-0.5 rounded-sm text-[9px] font-mono text-white whitespace-nowrap`}>
          PERSON | P-104 | 94%
        </div>
        {camera.scenario === 'suspicious' && (
          <div className="absolute -bottom-6 left-0 bg-amber-500/80 px-1.5 py-0.5 rounded-sm text-[9px] font-mono text-white whitespace-nowrap">
            LOITERING 73s
          </div>
        )}
      </div>
    );
  }

  return null;
}
