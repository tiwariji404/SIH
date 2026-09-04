import { useEffect, useState } from 'react';
import { useApp } from '../store';
import { ClipboardList, Search, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { formatTime } from '../types';

export default function Audit() {
  const { auditLogs, refreshAuditLogs } = useApp();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    refreshAuditLogs().finally(() => setLoading(false));
  }, []);

  const filtered = auditLogs.filter(log =>
    !search ||
    (log.action || '').toLowerCase().includes(search.toLowerCase()) ||
    (log.user || '').toLowerCase().includes(search.toLowerCase()) ||
    (log.details || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-slate-500" /> Audit Log
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{filtered.length} records · Immutable audit trail</p>
        </div>
        <button onClick={() => { setLoading(true); refreshAuditLogs().finally(() => setLoading(false)); }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-semibold">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input type="text" placeholder="Search audit logs..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 bg-white rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-orange-400" />
        </div>
      </div>

      {loading && auditLogs.length === 0 ? (
        <div className="text-center py-16 text-slate-400">Loading audit logs...</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Time', 'Actor', 'Action', 'Resource', 'Details', 'Result'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-400">No audit records</td></tr>
                )}
                {filtered.slice(0, 100).map(log => (
                  <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-slate-400 whitespace-nowrap">
                      {formatTime(log.created_at || log.timestamp)}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-700">{log.user || log.actor_id || '—'}</td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-mono font-semibold">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 font-mono">
                      {log.resource_type}{log.resource_id ? `·${log.resource_id.slice(0,6)}` : ''}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 max-w-[200px] truncate">{log.details}</td>
                    <td className="px-4 py-2.5">
                      <span className={`flex items-center gap-1 font-bold text-[10px] ${log.result === 'SUCCESS' || log.result === 'LOGGED' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {log.result === 'SUCCESS' || log.result === 'LOGGED'
                          ? <CheckCircle2 className="h-3 w-3" />
                          : <XCircle className="h-3 w-3" />}
                        {log.result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
