import { useState, useMemo } from 'react';
import { useApp } from '../store';
import { riskColor, statusColor, formatTime } from '../types';
import { Bell, Search, CheckCircle2, AlertTriangle, XCircle, RefreshCw, ChevronDown, ChevronUp, Shield } from 'lucide-react';

const SEVERITY_ORDER: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export default function Alerts() {
  const { alerts, alertsLoading, acknowledgeAlert, investigateAlert, resolveAlert, refreshAlerts } = useApp();
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'severity' | 'risk'>('newest');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...alerts];
    if (search) list = list.filter(a =>
      (a.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.reason || '').toLowerCase().includes(search.toLowerCase()) ||
      a.cameraId.toLowerCase().includes(search.toLowerCase())
    );
    if (severityFilter !== 'ALL') list = list.filter(a => a.severity === severityFilter);
    if (statusFilter !== 'ALL') list = list.filter(a => a.status === statusFilter);
    if (sortBy === 'severity') list.sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9));
    else if (sortBy === 'risk') list.sort((a, b) => b.riskScore - a.riskScore);
    else list.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
    return list;
  }, [alerts, search, severityFilter, statusFilter, sortBy]);

  async function doAction(id: string, action: 'ack' | 'inv' | 'res') {
    setActionLoading(id);
    try {
      if (action === 'ack') await acknowledgeAlert(id);
      else if (action === 'inv') await investigateAlert(id);
      else await resolveAlert(id);
    } finally { setActionLoading(null); }
  }

  const newCount = alerts.filter(a => a.status === 'NEW').length;
  const critCount = alerts.filter(a => a.severity === 'CRITICAL').length;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-500" /> Alert Center
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {newCount} new · {critCount} critical · {filtered.length} shown
          </p>
        </div>
        <button onClick={refreshAlerts} disabled={alertsLoading} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors disabled:opacity-50">
          <RefreshCw className={`h-3.5 w-3.5 ${alertsLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary badges */}
      <div className="flex flex-wrap gap-2">
        {['NEW', 'ACKNOWLEDGED', 'VERIFIED', 'CLOSED'].map(s => {
          const count = alerts.filter(a => a.status === s).length;
          return (
            <button key={s} onClick={() => setStatusFilter(statusFilter === s ? 'ALL' : s)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${statusFilter === s ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
              {s} <span className="ml-1 opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input type="text" placeholder="Search alerts..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 bg-white rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-orange-400 font-medium" />
        </div>
        <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}
          className="px-2 py-2 border border-slate-200 bg-white rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:border-orange-400">
          <option value="ALL">All Severity</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
          className="px-2 py-2 border border-slate-200 bg-white rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:border-orange-400">
          <option value="newest">Sort: Newest</option>
          <option value="severity">Sort: Severity</option>
          <option value="risk">Sort: Risk Score</option>
        </select>
      </div>

      {/* Alert List */}
      {alertsLoading && alerts.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">Loading alerts...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No alerts match your filters</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(alert => {
            const isExp = expanded === alert.id;
            const isBusy = actionLoading === alert.id;
            const canAck = alert.status === 'NEW';
            const canInv = alert.status === 'ACKNOWLEDGED' || alert.status === 'NEW';
            const canRes = alert.status !== 'CLOSED' && alert.status !== 'RESOLVED';

            return (
              <div key={alert.id} className={`bg-white border rounded-xl overflow-hidden transition-all ${
                alert.severity === 'CRITICAL' && alert.status === 'NEW' ? 'border-red-300 shadow-sm' : 'border-slate-200'
              }`}>
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Severity indicator */}
                  <div className={`w-1 h-10 rounded-full flex-shrink-0 ${
                    alert.severity === 'CRITICAL' ? 'bg-red-500' :
                    alert.severity === 'HIGH' ? 'bg-orange-500' :
                    alert.severity === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${riskColor[alert.severity] || ''}`}>
                        {alert.severity}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${statusColor[alert.status] || ''}`}>
                        {alert.status}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">Risk: {alert.riskScore}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 mt-1 truncate">{alert.title || alert.reason}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {alert.cameraId} · {formatTime(alert.createdAt || alert.created_at_dt as any)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {canAck && (
                      <button onClick={() => doAction(alert.id, 'ack')} disabled={isBusy}
                        className="px-2.5 py-1.5 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 disabled:opacity-50 transition-colors">
                        ACK
                      </button>
                    )}
                    {canInv && (
                      <button onClick={() => doAction(alert.id, 'inv')} disabled={isBusy}
                        className="px-2.5 py-1.5 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors">
                        VERIFY
                      </button>
                    )}
                    {canRes && (
                      <button onClick={() => doAction(alert.id, 'res')} disabled={isBusy}
                        className="px-2.5 py-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 disabled:opacity-50 transition-colors">
                        RESOLVE
                      </button>
                    )}
                    <button onClick={() => setExpanded(isExp ? null : alert.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                      {isExp ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExp && (
                  <div className="border-t border-slate-100 bg-slate-50 px-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Alert details */}
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Alert Details</h4>
                        <DetailRow label="Event ID" value={alert.eventId} mono />
                        <DetailRow label="Camera" value={alert.cameraId} mono />
                        <DetailRow label="Object" value={alert.object} />
                        <DetailRow label="Location" value={alert.where} />
                        <DetailRow label="Time" value={alert.when} />
                        <DetailRow label="Confidence" value={alert.confidence ? `${alert.confidence}%` : undefined} />
                      </div>

                      {/* Risk explanation */}
                      <div>
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <Shield className="h-3 w-3" /> WHY THIS ALERT?
                        </h4>
                        <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2">
                          {alert.reasons && alert.reasons.length > 0 ? (
                            alert.reasons.map((r, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <AlertTriangle className="h-3 w-3 text-orange-500 flex-shrink-0" />
                                <span className="text-xs text-slate-700">{r}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-500">{alert.why || alert.reason || 'No explanation available'}</p>
                          )}
                          <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center">
                            <span className="text-[10px] text-slate-400 font-medium">Risk Score</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${alert.riskScore >= 80 ? 'bg-red-500' : alert.riskScore >= 60 ? 'bg-orange-500' : alert.riskScore >= 30 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                  style={{ width: `${alert.riskScore}%` }} />
                              </div>
                              <span className="text-xs font-black text-slate-700">{alert.riskScore}/100</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-2">
      <span className="text-[10px] text-slate-500 font-medium">{label}</span>
      <span className={`text-[10px] text-slate-700 font-semibold ${mono ? 'font-mono' : ''} truncate max-w-[180px]`}>{value}</span>
    </div>
  );
}
