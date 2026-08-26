import { useState } from 'react';
import { useApp } from '../store';
import { Search, ShieldAlert, CheckCircle, HelpCircle } from 'lucide-react';

export default function ANPR() {
  const { vehicles } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = vehicles.filter(v => {
    if (search && !v.plateNumber.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'ALL' && v.status !== statusFilter) return false;
    return true;
  });

  const watchlisted = vehicles.filter(v => v.status === 'WATCHLIST');

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-100">ANPR — Automatic Number Plate Recognition</h1>
        <p className="text-xs text-slate-500">{vehicles.length} plate captures • {watchlisted.length} watchlist matches • Demo data</p>
      </div>

      {/* Watchlist alert */}
      {watchlisted.length > 0 && (
        <div className="card p-4 border-red-500/30 bg-red-500/5">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-red-400 animate-pulse" />
            <div>
              <p className="text-sm font-semibold text-red-300">Watchlist Vehicle Detected</p>
              <p className="text-xs text-slate-400">Plate {watchlisted[0].plateNumber} detected at {watchlisted[0].cameraId} — Status: WATCHLIST</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
          <input type="text" placeholder="Search plate number..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-10" />
        </div>
        {['ALL', 'AUTHORIZED', 'WATCHLIST', 'UNKNOWN'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`badge ${statusFilter === s ? 'bg-accent-500/20 text-accent-300 border border-accent-500/30' : 'bg-white/5 text-slate-400 border border-white/5'}`}>{s}</button>
        ))}
      </div>

      {/* Plate grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.slice(0, 30).map(v => {
          return (
            <div key={v.id} className={`card p-4 ${v.status === 'WATCHLIST' ? 'border-red-500/30 bg-red-500/5' : ''}`}>
              {/* Simulated vehicle image */}
              <div className="relative h-28 rounded-lg bg-gradient-to-b from-slate-700/40 to-slate-900/60 mb-3 overflow-hidden border border-white/5">
                <div className="absolute inset-0 grid-overlay opacity-30" />
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                  <div className="h-6 w-24 rounded bg-slate-600/60" />
                  <div className="mx-auto -mt-4 h-4 w-20 rounded-t bg-slate-500/50" />
                </div>
                {/* Plate highlight */}
                <div className="absolute bottom-1 right-2 bg-amber-400/20 border border-amber-400/50 rounded px-1.5 py-0.5">
                  <span className="text-[9px] font-mono text-amber-300">{v.plateNumber}</span>
                </div>
              </div>

              {/* Plate number */}
              <div className="flex items-center justify-between mb-2">
                <div className="px-2 py-1 rounded bg-yellow-400/90 text-black font-mono font-bold text-sm tracking-wider">
                  {v.plateNumber}
                </div>
                <StatusBadge status={v.status} />
              </div>

              <div className="space-y-1 text-[11px]">
                <Row label="Vehicle" value={v.vehicleType} />
                <Row label="Camera" value={v.cameraId} />
                <Row label="Direction" value={v.direction} />
                <Row label="Confidence" value={`${v.confidence}%`} />
                <Row label="Time" value={new Date(v.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'WATCHLIST') return <span className="badge bg-red-500/20 text-red-400 border border-red-500/30"><ShieldAlert className="h-3 w-3" /> WATCHLIST</span>;
  if (status === 'AUTHORIZED') return <span className="badge bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"><CheckCircle className="h-3 w-3" /> AUTHORIZED</span>;
  return <span className="badge bg-slate-500/20 text-slate-400 border border-slate-500/30"><HelpCircle className="h-3 w-3" /> UNKNOWN</span>;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-600">{label}:</span>
      <span className="text-slate-300">{value}</span>
    </div>
  );
}
