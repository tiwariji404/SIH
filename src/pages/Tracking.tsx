import { useState } from 'react';
import { useApp } from '../store';
import { Search, Radio, Users, Car, ArrowRight, Clock, MapPin } from 'lucide-react';

export default function Tracking() {
  const { tracks, cameras } = useApp();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = tracks.filter(t => !search || t.trackingId.toLowerCase().includes(search.toLowerCase()));
  const selectedTrack = tracks.find(t => t.trackingId === selected);

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-100">People & Tracking</h1>
        <p className="text-xs text-slate-500">{tracks.length} active tracks • Cross-camera movement simulation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Track list */}
        <div className="lg:col-span-1 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
            <input type="text" placeholder="Search tracking ID..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-10" />
          </div>
          {filtered.map(t => (
            <button
              key={t.trackingId}
              onClick={() => setSelected(t.trackingId)}
              className={`card card-hover w-full p-3 text-left ${selected === t.trackingId ? 'border-accent-500/30 bg-accent-500/5' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${t.objectType === 'person' ? 'bg-accent-500/10' : 'bg-blue-500/10'}`}>
                  {t.objectType === 'person' ? <Users className="h-4 w-4 text-accent-400" /> : <Car className="h-4 w-4 text-blue-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono font-semibold text-slate-200">{t.trackingId}</p>
                  <p className="text-[10px] text-slate-500">{t.cameraId} • {t.direction}</p>
                </div>
                <span className={`badge ${t.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : t.status === 'Lost' ? 'bg-red-500/20 text-red-400' : 'bg-slate-500/20 text-slate-400'}`}>{t.status}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Track detail */}
        <div className="lg:col-span-2">
          {selectedTrack ? (
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${selectedTrack.objectType === 'person' ? 'bg-accent-500/10' : 'bg-blue-500/10'}`}>
                    {selectedTrack.objectType === 'person' ? <Users className="h-6 w-6 text-accent-400" /> : <Car className="h-6 w-6 text-blue-400" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-100 font-mono">{selectedTrack.trackingId}</h2>
                    <p className="text-xs text-slate-500 capitalize">{selectedTrack.objectType}</p>
                  </div>
                </div>
                <span className={`badge ${selectedTrack.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>{selectedTrack.status}</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <InfoCard label="Camera" value={selectedTrack.cameraId} icon={Radio} />
                <InfoCard label="Direction" value={selectedTrack.direction} icon={MapPin} />
                <InfoCard label="Duration" value={selectedTrack.duration} icon={Clock} />
                <InfoCard label="Status" value={selectedTrack.status} icon={Radio} />
              </div>

              <div>
                <p className="text-[10px] font-mono uppercase text-slate-600 mb-2">Detection Times</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="card p-3">
                    <p className="text-[10px] text-slate-600">First Detected</p>
                    <p className="text-xs font-mono text-slate-300">{new Date(selectedTrack.firstSeen).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                  </div>
                  <div className="card p-3">
                    <p className="text-[10px] text-slate-600">Last Detected</p>
                    <p className="text-xs font-mono text-slate-300">{new Date(selectedTrack.lastSeen).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                  </div>
                </div>
              </div>

              {/* Cross-camera movement history */}
              <div>
                <p className="text-[10px] font-mono uppercase text-slate-600 mb-2">Movement History (Cross-Camera Tracking)</p>
                <div className="space-y-2">
                  {[...selectedTrack.history].reverse().map((h, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-emerald-400 animate-pulse' : 'bg-accent-400'}`} />
                        {i < selectedTrack.history.length - 1 && <div className="w-0.5 h-8 bg-white/10" />}
                      </div>
                      <div className="flex-1 card p-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono text-accent-300">{h.cameraId}</span>
                          <span className="text-[10px] text-slate-500">{new Date(h.time).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                        </div>
                        <p className="text-[10px] text-slate-500">{cameras.find(c => c.id === h.cameraId)?.location || 'Unknown location'}</p>
                      </div>
                      {i < selectedTrack.history.length - 1 && <ArrowRight className="h-3 w-3 text-slate-600 rotate-90" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-8 text-center h-full flex items-center justify-center">
              <div>
                <Radio className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Select a tracking ID to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Radio }) {
  return (
    <div className="card p-3">
      <Icon className="h-4 w-4 text-accent-400 mb-1" />
      <p className="text-[10px] text-slate-600">{label}</p>
      <p className="text-sm font-semibold text-slate-200">{value}</p>
    </div>
  );
}
