import { useState } from 'react';
import { useApp } from '../store';
import { MapPin, Radio, X, Cctv, Bell, List } from 'lucide-react';
import type { Camera } from '../types';

export default function BorderMap() {
  const { cameras, alerts, events } = useApp();
  const [selectedBop, setSelectedBop] = useState<string | null>(null);

  // Group cameras by BOP
  const bopGroups: Record<string, Camera[]> = {};
  cameras.forEach(c => {
    if (!bopGroups[c.bop]) bopGroups[c.bop] = [];
    bopGroups[c.bop].push(c);
  });

  const getBopStatus = (bop: string): 'normal' | 'warning' | 'critical' => {
    const cams = bopGroups[bop];
    const hasOffline = cams.some(c => c.status === 'OFFLINE');
    const hasCritical = alerts.some(a => a.severity === 'CRITICAL' && a.status !== 'RESOLVED' && cams.some(c => c.id === a.cameraId));
    if (hasCritical) return 'critical';
    if (hasOffline || alerts.some(a => a.severity === 'HIGH' && a.status !== 'RESOLVED' && cams.some(c => c.id === a.cameraId))) return 'warning';
    return 'normal';
  };

  const bopNames = Object.keys(bopGroups);
  const selectedCams = selectedBop ? bopGroups[selectedBop] : [];
  const selectedAlerts = selectedBop ? alerts.filter(a => selectedCams.some(c => c.id === a.cameraId)) : [];
  const selectedEvents = selectedBop ? events.filter(e => selectedCams.some(c => c.id === e.cameraId)) : [];

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Border Map</h1>
        <p className="text-xs text-slate-500">BOP locations and camera status overview • Fictional demo coordinates</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map */}
        <div className="card p-4 lg:col-span-2">
          <div className="relative h-[500px] rounded-lg overflow-hidden bg-gradient-to-b from-slate-900 via-slate-850 to-ink-950 border border-white/5">
            {/* Grid overlay */}
            <div className="absolute inset-0 grid-overlay opacity-20" />

            {/* Simulated terrain features */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Border line */}
              <line x1="5" y1="10" x2="95" y2="90" stroke="#06b6d4" strokeWidth="0.3" strokeDasharray="2 1" opacity="0.4" />
              <text x="50" y="50" fontSize="2" fill="#475569" textAnchor="middle" transform="rotate(40 50 50)">— INTERNATIONAL BORDER —</text>
              {/* River */}
              <path d="M 0,60 Q 30,55 50,65 T 100,70" stroke="#1e40af" strokeWidth="0.8" fill="none" opacity="0.3" />
              {/* Forest area */}
              <path d="M 20,20 Q 35,25 40,40 Q 30,45 20,40 Z" fill="#064e3b" opacity="0.15" />
            </svg>

            {/* BOP markers */}
            {bopNames.map((bop, i) => {
              const status = getBopStatus(bop);
              const cams = bopGroups[bop];
              const x = 15 + (i % 4) * 22 + (i % 2) * 5;
              const y = 15 + Math.floor(i / 4) * 35 + (i % 2) * 8;
              const color = status === 'critical' ? '#ef4444' : status === 'warning' ? '#f59e0b' : '#10b981';

              return (
                <button
                  key={bop}
                  onClick={() => setSelectedBop(bop)}
                  className="absolute group"
                  style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                >
                  {/* Pulse ring */}
                  <span className="absolute inset-0 rounded-full animate-ping-slow" style={{ backgroundColor: color, opacity: 0.3 }} />
                  <div className="relative flex items-center justify-center w-8 h-8 rounded-full border-2" style={{ borderColor: color, backgroundColor: '#0a0e17' }}>
                    <MapPin className="h-4 w-4" style={{ color }} />
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 rounded bg-ink-900/90 border border-white/10 text-[9px] font-mono text-slate-300 whitespace-nowrap">
                    {bop} ({cams.length})
                  </div>
                </button>
              );
            })}

            {/* Legend */}
            <div className="absolute bottom-3 left-3 card p-2 space-y-1">
              <div className="flex items-center gap-2 text-[10px]"><span className="status-dot bg-emerald-400" /> Normal</div>
              <div className="flex items-center gap-2 text-[10px]"><span className="status-dot bg-amber-400" /> Warning</div>
              <div className="flex items-center gap-2 text-[10px]"><span className="status-dot bg-red-400" /> Critical</div>
            </div>
          </div>
        </div>

        {/* BOP detail panel */}
        <div className="card p-4">
          {selectedBop ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-100">{selectedBop}</h3>
                <button onClick={() => setSelectedBop(null)} className="text-slate-500 hover:text-slate-300"><X className="h-4 w-4" /></button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="card p-2 text-center">
                  <Cctv className="h-4 w-4 text-accent-400 mx-auto mb-0.5" />
                  <p className="text-sm font-bold text-slate-100">{selectedCams.length}</p>
                  <p className="text-[9px] text-slate-500">Cameras</p>
                </div>
                <div className="card p-2 text-center">
                  <Bell className="h-4 w-4 text-red-400 mx-auto mb-0.5" />
                  <p className="text-sm font-bold text-slate-100">{selectedAlerts.length}</p>
                  <p className="text-[9px] text-slate-500">Alerts</p>
                </div>
                <div className="card p-2 text-center">
                  <List className="h-4 w-4 text-amber-400 mx-auto mb-0.5" />
                  <p className="text-sm font-bold text-slate-100">{selectedEvents.length}</p>
                  <p className="text-[9px] text-slate-500">Events</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-mono uppercase text-slate-600 mb-1.5">Camera Status</p>
                <div className="space-y-1">
                  {selectedCams.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                      <div className="flex items-center gap-2">
                        <span className={`status-dot ${c.status === 'ONLINE' ? 'bg-emerald-400' : c.status === 'DEGRADED' ? 'bg-amber-400' : 'bg-red-500'}`} />
                        <span className="text-xs font-mono text-slate-300">{c.id}</span>
                        <span className="text-[10px] text-slate-500">{c.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">{c.fps} FPS</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedAlerts.length > 0 && (
                <div>
                  <p className="text-[10px] font-mono uppercase text-slate-600 mb-1.5">Active Alerts</p>
                  <div className="space-y-1">
                    {selectedAlerts.slice(0, 5).map(a => (
                      <div key={a.id} className="flex items-center gap-2 p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                        <span className={`status-dot ${a.severity === 'CRITICAL' ? 'bg-red-500' : 'bg-amber-400'}`} />
                        <span className="text-xs text-slate-300 truncate">{a.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <Radio className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Select a BOP marker to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
