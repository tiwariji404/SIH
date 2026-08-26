import { useState } from 'react';
import { useApp } from '../store';
import { AlertStatus, riskColor, statusColor } from '../types';
import { Bell, Search, Filter, Eye, CheckCircle, ArrowUpCircle, Check, X } from 'lucide-react';

export default function Alerts() {
  const { alerts, acknowledgeAlert, escalateAlert, resolveAlert } = useApp();
  const [filter, setFilter] = useState<AlertStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = alerts.filter(a => {
    if (filter !== 'ALL' && a.status !== filter) return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !a.cameraId.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selectedAlert = alerts.find(a => a.id === selected);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Alert Center</h1>
          <p className="text-xs text-slate-500">{alerts.filter(a => a.status === 'NEW').length} new • {alerts.filter(a => a.status !== 'RESOLVED').length} active • {alerts.length} total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
          <input type="text" placeholder="Search alerts..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-10" />
        </div>
        <div className="flex items-center gap-1">
          <Filter className="h-4 w-4 text-slate-600" />
          {(['ALL', 'NEW', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED'] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`badge ${filter === s ? 'bg-accent-500/20 text-accent-300 border border-accent-500/30' : 'bg-white/5 text-slate-400 border border-white/5'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Alert list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="card p-8 text-center">
            <Bell className="h-8 w-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No alerts match your filters</p>
          </div>
        ) : (
          filtered.map(alert => (
            <div key={alert.id} className={`card p-4 border-l-4 ${alert.severity === 'CRITICAL' ? 'border-l-red-500' : alert.severity === 'HIGH' ? 'border-l-orange-500' : alert.severity === 'MEDIUM' ? 'border-l-amber-500' : 'border-l-emerald-500'} ${alert.status === 'NEW' ? 'animate-alert-pulse' : ''}`}>
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge ${riskColor[alert.severity]}`}>{alert.severity}</span>
                    <span className={`badge ${statusColor[alert.status]}`}>{alert.status}</span>
                    <span className="text-[10px] font-mono text-slate-600">{alert.id}</span>
                    <span className="text-[10px] font-mono text-accent-400">Risk: {alert.riskScore}/100</span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-100">{alert.title}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-[11px]">
                    <div><span className="text-slate-600">Camera:</span> <span className="text-slate-300">{alert.cameraId}</span></div>
                    <div><span className="text-slate-600">Object:</span> <span className="text-slate-300">{alert.object}</span></div>
                    <div><span className="text-slate-600">When:</span> <span className="text-slate-300">{alert.when}</span></div>
                    <div><span className="text-slate-600">Confidence:</span> <span className="text-slate-300">{alert.confidence}%</span></div>
                  </div>
                  <div className="mt-2 flex items-start gap-1.5">
                    <span className="text-[10px] text-slate-600 mt-0.5">WHY:</span>
                    <p className="text-[11px] text-amber-300">{alert.why}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <button onClick={() => setSelected(alert.id)} className="btn-ghost text-[10px] px-2 py-1"><Eye className="h-3 w-3" /> View</button>
                  {alert.status === 'NEW' && (
                    <button onClick={() => acknowledgeAlert(alert.id)} className="btn-ghost text-[10px] px-2 py-1 text-amber-400"><CheckCircle className="h-3 w-3" /> Ack</button>
                  )}
                  {(alert.status === 'ACKNOWLEDGED' || alert.status === 'NEW') && (
                    <button onClick={() => escalateAlert(alert.id)} className="btn-ghost text-[10px] px-2 py-1 text-orange-400"><ArrowUpCircle className="h-3 w-3" /> Escalate</button>
                  )}
                  {alert.status !== 'RESOLVED' && (
                    <button onClick={() => resolveAlert(alert.id)} className="btn-ghost text-[10px] px-2 py-1 text-emerald-400"><Check className="h-3 w-3" /> Resolve</button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="glass-strong rounded-2xl p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className={`badge ${riskColor[selectedAlert.severity]}`}>{selectedAlert.severity}</span>
                <span className={`badge ${statusColor[selectedAlert.status]}`}>{selectedAlert.status}</span>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-slate-300"><X className="h-4 w-4" /></button>
            </div>
            <h2 className="text-lg font-bold text-slate-100 mb-4">{selectedAlert.title}</h2>
            <div className="space-y-2.5 text-sm">
              <DetailRow label="WHAT" value={selectedAlert.what} />
              <DetailRow label="WHERE" value={selectedAlert.where} />
              <DetailRow label="WHEN" value={selectedAlert.when} />
              <DetailRow label="OBJECT" value={selectedAlert.object} />
              <DetailRow label="WHY" value={selectedAlert.why} color="text-amber-300" />
              <DetailRow label="ZONE" value={selectedAlert.zone || 'N/A'} />
              <DetailRow label="CONFIDENCE" value={`${selectedAlert.confidence}%`} />
              <DetailRow label="RISK SCORE" value={`${selectedAlert.riskScore} / 100`} color="text-red-400" />
            </div>
            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-[10px] font-mono uppercase text-slate-600 mb-2">Risk Factors</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedAlert.reasons.map((r, i) => (
                  <span key={i} className="badge bg-red-500/10 text-red-400 border border-red-500/20">{r}</span>
                ))}
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              {selectedAlert.status === 'NEW' && <button onClick={() => { acknowledgeAlert(selectedAlert.id); setSelected(null); }} className="btn-primary flex-1">Acknowledge</button>}
              {selectedAlert.status !== 'RESOLVED' && <button onClick={() => { resolveAlert(selectedAlert.id); setSelected(null); }} className="btn-success flex-1">Resolve</button>}
              <button onClick={() => setSelected(null)} className="btn-ghost">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value, color = 'text-slate-200' }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-[10px] font-mono uppercase text-slate-600 w-20 flex-shrink-0 mt-0.5">{label}</span>
      <span className={`text-sm ${color}`}>{value}</span>
    </div>
  );
}
