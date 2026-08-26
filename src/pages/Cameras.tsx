import { useState } from 'react';
import { useApp } from '../store';
import CameraFeed from '../components/CameraFeed';
import { Search, Activity, HardDrive, Wifi, Clock } from 'lucide-react';
import type { ScenarioType } from '../types';

const SCENARIOS: { value: ScenarioType; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'intrusion', label: 'Intrusion' },
  { value: 'night', label: 'Night Movement' },
  { value: 'suspicious', label: 'Suspicious Activity' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'anpr', label: 'ANPR' },
];

export default function Cameras() {
  const { cameras, detections, setCameraScenario } = useApp();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = cameras.filter(c =>
    !search || c.id.toLowerCase().includes(search.toLowerCase()) || c.name.toLowerCase().includes(search.toLowerCase()) || c.bop.toLowerCase().includes(search.toLowerCase())
  );

  const selectedCam = cameras.find(c => c.id === selected);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Camera Management</h1>
          <p className="text-xs text-slate-500">{cameras.filter(c => c.status === 'ONLINE').length} online • {cameras.filter(c => c.status === 'DEGRADED').length} degraded • {cameras.filter(c => c.status === 'OFFLINE').length} offline</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
          <input type="text" placeholder="Search cameras..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-10 w-64" />
        </div>
      </div>

      {/* Camera grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map(cam => (
          <div key={cam.id} className="card card-hover overflow-hidden cursor-pointer" onClick={() => setSelected(cam.id)}>
            <CameraFeed camera={cam} detections={detections} compact />
            <div className="p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-slate-200">{cam.id}</p>
                <span className={`badge ${cam.status === 'ONLINE' ? 'bg-emerald-500/20 text-emerald-400' : cam.status === 'DEGRADED' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                  {cam.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{cam.name}</p>
              <p className="text-[10px] text-slate-600">{cam.bop} • {cam.location}</p>
              <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-500">
                <span className="flex items-center gap-1"><Activity className="h-3 w-3" />{cam.fps} FPS</span>
                <span className="flex items-center gap-1"><Wifi className="h-3 w-3" />{cam.signalQuality}%</span>
                <span className="flex items-center gap-1"><HardDrive className="h-3 w-3" />{cam.storage}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail modal */}
      {selectedCam && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="glass-strong rounded-2xl p-6 max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-100">{selectedCam.id} — {selectedCam.name}</h2>
                <p className="text-xs text-slate-500">{selectedCam.bop} • {selectedCam.location}</p>
              </div>
              <span className={`badge ${selectedCam.status === 'ONLINE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{selectedCam.status}</span>
            </div>
            <CameraFeed camera={selectedCam} detections={detections} />
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat label="FPS" value={`${selectedCam.fps}`} icon={Activity} />
              <Stat label="Latency" value={`${selectedCam.latency} ms`} icon={Clock} />
              <Stat label="Storage" value={`${selectedCam.storage}%`} icon={HardDrive} />
              <Stat label="Health" value={`${selectedCam.health}%`} icon={Wifi} />
            </div>
            <div className="mt-4">
              <label className="block text-[10px] font-mono uppercase text-slate-600 mb-1.5">Scenario</label>
              <select value={selectedCam.scenario} onChange={e => { setCameraScenario(selectedCam.id, e.target.value as ScenarioType); }} className="input" disabled={selectedCam.status === 'OFFLINE'}>
                {SCENARIOS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Activity }) {
  return (
    <div className="card p-3 text-center">
      <Icon className="h-4 w-4 text-accent-400 mx-auto mb-1" />
      <p className="text-sm font-bold text-slate-100">{value}</p>
      <p className="text-[9px] text-slate-500">{label}</p>
    </div>
  );
}
