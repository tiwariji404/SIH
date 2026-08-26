import { useState } from 'react';
import { useApp } from '../store';
import { Search, ScrollText, CheckCircle, XCircle } from 'lucide-react';

export default function AuditLogs() {
  const { auditLogs } = useApp();
  const [search, setSearch] = useState('');
  const [resultFilter, setResultFilter] = useState('ALL');

  const filtered = auditLogs.filter(l => {
    if (search && !l.action.toLowerCase().includes(search.toLowerCase()) && !l.user.toLowerCase().includes(search.toLowerCase())) return false;
    if (resultFilter !== 'ALL' && l.result !== resultFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Audit Logs</h1>
        <p className="text-xs text-slate-500">{auditLogs.length} total log entries • User action tracking</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
          <input type="text" placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-10" />
        </div>
        {['ALL', 'SUCCESS', 'FAILED'].map(s => (
          <button key={s} onClick={() => setResultFilter(s)} className={`badge ${resultFilter === s ? 'bg-accent-500/20 text-accent-300 border border-accent-500/30' : 'bg-white/5 text-slate-400 border border-white/5'}`}>{s}</button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-4 py-2.5 text-left text-[10px] font-mono uppercase text-slate-500">Log ID</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-mono uppercase text-slate-500">User</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-mono uppercase text-slate-500">Action</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-mono uppercase text-slate-500">Time</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-mono uppercase text-slate-500">IP / Device</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-mono uppercase text-slate-500">Result</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 60).map(log => (
                <tr key={log.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-2.5 text-[10px] font-mono text-slate-600">{log.id}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-200">{log.user}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-300">{log.action}</td>
                  <td className="px-4 py-2.5 text-[10px] font-mono text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
                  </td>
                  <td className="px-4 py-2.5 text-[10px] font-mono text-slate-500">{log.ip}</td>
                  <td className="px-4 py-2.5">
                    {log.result === 'SUCCESS' ? (
                      <span className="flex items-center gap-1 text-emerald-400 text-[10px]"><CheckCircle className="h-3 w-3" /> SUCCESS</span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-400 text-[10px]"><XCircle className="h-3 w-3" /> FAILED</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-8 text-center">
            <ScrollText className="h-8 w-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No logs match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
