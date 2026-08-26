import { useState, useRef } from 'react';
import { useApp } from '../store';
import { Fence, Plus, Trash2, Shield } from 'lucide-react';
import type { Zone, RiskLevel } from '../types';

export default function VirtualFences() {
  const { cameras, zones, addZone, deleteZone } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCam, setSelectedCam] = useState(cameras[0]?.id || '');
  const [zoneName, setZoneName] = useState('');
  const [zoneType, setZoneType] = useState('Virtual Fence');
  const [severity, setSeverity] = useState<RiskLevel>('HIGH');
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  const cam = cameras.find(c => c.id === selectedCam);

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPoints(prev => [...prev, { x: Math.round(x), y: Math.round(y) }]);
  };

  const handleSave = () => {
    if (!zoneName || points.length < 2) return;
    const zone: Zone = {
      id: `Z-${Date.now()}`,
      cameraId: selectedCam,
      name: zoneName,
      zoneType,
      severity,
      coordinates: points,
      rule: `${zoneType === 'Tripwire' ? 'Crossing' : 'Person entering'} → ${severity} alert`,
    };
    addZone(zone);
    setShowCreate(false);
    setZoneName('');
    setPoints([]);
  };

  const removePoint = (idx: number) => {
    setPoints(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Virtual Fences</h1>
          <p className="text-xs text-slate-500">{zones.length} active zones • Draw boundaries on camera feeds</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> Create Zone
        </button>
      </div>

      {/* Existing zones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {zones.map(zone => {
          const zc = cameras.find(c => c.id === zone.cameraId);
          return (
            <div key={zone.id} className="card p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Fence className="h-4 w-4 text-accent-400" />
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{zone.name}</p>
                    <p className="text-[10px] text-slate-500">{zone.id} • {zone.cameraId}</p>
                  </div>
                </div>
                <button onClick={() => deleteZone(zone.id)} className="text-slate-600 hover:text-red-400">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between"><span className="text-slate-600">Type:</span><span className="text-slate-300">{zone.zoneType}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Camera:</span><span className="text-slate-300">{zc?.name || zone.cameraId}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Severity:</span>
                  <span className={`badge text-[9px] ${zone.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : zone.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400' : 'bg-amber-500/20 text-amber-400'}`}>{zone.severity}</span>
                </div>
                <div className="flex justify-between"><span className="text-slate-600">Rule:</span><span className="text-slate-400 text-right">{zone.rule}</span></div>
              </div>
              {/* Mini preview */}
              <div className="mt-3 relative h-24 rounded-lg bg-slate-800/40 border border-white/5 overflow-hidden">
                <div className="absolute inset-0 grid-overlay opacity-30" />
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <polygon
                    points={zone.coordinates.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="rgba(239,68,68,0.15)"
                    stroke={zone.severity === 'CRITICAL' ? '#ef4444' : '#f97316'}
                    strokeWidth="1.5"
                    strokeDasharray="3 2"
                  />
                </svg>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="glass-strong rounded-2xl p-6 max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2"><Fence className="h-5 w-5 text-accent-400" /> Create Virtual Fence</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-500 hover:text-slate-300">✕</button>
            </div>

            {/* Camera selector */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-600 mb-1.5">Camera</label>
                <select value={selectedCam} onChange={e => { setSelectedCam(e.target.value); setPoints([]); }} className="input">
                  {cameras.filter(c => c.status !== 'OFFLINE').map(c => <option key={c.id} value={c.id}>{c.id} — {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-600 mb-1.5">Zone Name</label>
                <input type="text" value={zoneName} onChange={e => setZoneName(e.target.value)} placeholder="Restricted Border Sector" className="input" />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-600 mb-1.5">Zone Type</label>
                <select value={zoneType} onChange={e => setZoneType(e.target.value)} className="input">
                  <option>Virtual Fence</option>
                  <option>Tripwire</option>
                  <option>Loitering Zone</option>
                  <option>Restricted Area</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-600 mb-1.5">Severity</label>
                <select value={severity} onChange={e => setSeverity(e.target.value as RiskLevel)} className="input">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>

            {/* Drawing canvas */}
            <div className="mb-3">
              <p className="text-[10px] font-mono uppercase text-slate-600 mb-1.5">
                Click on the camera view to draw boundary points ({points.length} points)
              </p>
              <div className="relative h-64 rounded-lg overflow-hidden border border-white/10 bg-black">
                {cam && (
                  <>
                    {/* Simulated camera background */}
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-700/40 via-slate-800/30 to-slate-900/50" />
                    <div className="absolute inset-0 grid-overlay opacity-40" />
                    <div className="absolute top-2 left-2 text-[10px] font-mono text-slate-400">{cam.id} — {cam.name}</div>

                    <svg ref={svgRef} className="absolute inset-0 w-full h-full cursor-crosshair" viewBox="0 0 100 100" preserveAspectRatio="none" onClick={handleSvgClick}>
                      {points.length > 0 && (
                        <polygon
                          points={points.map(p => `${p.x},${p.y}`).join(' ')}
                          fill="rgba(239,68,68,0.15)"
                          stroke={severity === 'CRITICAL' ? '#ef4444' : '#f97316'}
                          strokeWidth="0.8"
                          strokeDasharray="2 1"
                        />
                      )}
                      {points.map((p, i) => (
                        <g key={i}>
                          <circle cx={p.x} cy={p.y} r="1.5" fill={severity === 'CRITICAL' ? '#ef4444' : '#f97316'} />
                          <text x={p.x} y={p.y - 2} fontSize="2" fill="#fff" textAnchor="middle">{i + 1}</text>
                        </g>
                      ))}
                    </svg>
                  </>
                )}
              </div>
            </div>

            {points.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {points.map((p, i) => (
                  <button key={i} onClick={() => removePoint(i)} className="badge bg-white/5 text-slate-400 border border-white/10 hover:border-red-500/30">
                    {i + 1}: {p.x},{p.y} ✕
                  </button>
                ))}
                <button onClick={() => setPoints([])} className="badge bg-red-500/10 text-red-400 border border-red-500/20">Clear all</button>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={handleSave} disabled={!zoneName || points.length < 2} className="btn-primary flex-1">
                <Shield className="h-4 w-4" /> Save Zone
              </button>
              <button onClick={() => setShowCreate(false)} className="btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
