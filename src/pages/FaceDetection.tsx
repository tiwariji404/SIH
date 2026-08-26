import { useState } from 'react';
import { useApp } from '../store';
import { Search, Users, CheckCircle, HelpCircle, AlertCircle } from 'lucide-react';

export default function FaceDetection() {
  const { faces } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = faces.filter(f => {
    if (search && !f.identity.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'ALL' && f.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Face Detection</h1>
        <p className="text-xs text-slate-500">{faces.length} face captures • Fictional demo identities only</p>
      </div>

      <div className="card p-3 border-amber-500/20 bg-amber-500/5">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0" />
          <p className="text-xs text-amber-300">
            All face identities in this prototype are fictional (Person A, Person B, etc.). No real personal identities are used.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
          <input type="text" placeholder="Search identity..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-10" />
        </div>
        {['ALL', 'AUTHORIZED', 'UNKNOWN', 'FLAGGED'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`badge ${statusFilter === s ? 'bg-accent-500/20 text-accent-300 border border-accent-500/30' : 'bg-white/5 text-slate-400 border border-white/5'}`}>{s}</button>
        ))}
      </div>

      {/* Face grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {filtered.slice(0, 24).map(f => (
          <div key={f.id} className="card card-hover p-4">
              {/* Simulated face thumbnail */}
              <div className="relative h-32 rounded-lg bg-gradient-to-b from-slate-700/40 to-slate-900/60 mb-3 overflow-hidden border border-white/5">
                <div className="absolute inset-0 grid-overlay opacity-30" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <div className="w-16 h-20 rounded-full bg-slate-600/40" />
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-slate-500/60" />
                      <div className="w-2 h-2 rounded-full bg-slate-500/60" />
                    </div>
                  </div>
                </div>
                {/* Face detection box */}
                <div className="absolute" style={{ left: '30%', top: '15%', width: '40%', height: '70%' }}>
                  <div className="absolute inset-0 border-2 border-purple-400 rounded-sm" />
                  <div className="absolute -top-5 left-0 bg-purple-500/80 px-1.5 py-0.5 rounded-sm text-[9px] font-mono text-white whitespace-nowrap">
                    FACE | {f.confidence}%
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-slate-200">{f.identity}</p>
                {f.status === 'AUTHORIZED' ? (
                  <span className="badge bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"><CheckCircle className="h-3 w-3" /></span>
                ) : f.status === 'FLAGGED' ? (
                  <span className="badge bg-red-500/20 text-red-400 border border-red-500/30"><AlertCircle className="h-3 w-3" /></span>
                ) : (
                  <span className="badge bg-slate-500/20 text-slate-400 border border-slate-500/30"><HelpCircle className="h-3 w-3" /></span>
                )}
              </div>
              <div className="space-y-0.5 text-[11px]">
                <div className="flex justify-between"><span className="text-slate-600">Camera:</span><span className="text-slate-300">{f.cameraId}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Confidence:</span><span className="text-slate-300">{f.confidence}%</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Database:</span><span className="text-slate-300">{f.database}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Time:</span><span className="text-slate-300">{new Date(f.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}</span></div>
              </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card p-8 text-center">
          <Users className="h-8 w-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No face records match your filters</p>
        </div>
      )}
    </div>
  );
}
