import { useState, useMemo } from 'react';
import { useApp } from '../store';
import { riskColor, statusColor } from '../types';
import { Search, List } from 'lucide-react';

export default function Events() {
  const { events, cameras } = useApp();
  const [search, setSearch] = useState('');
  const [camFilter, setCamFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const eventTypes = useMemo(() => [...new Set(events.map(e => e.eventType))], [events]);

  const filtered = events.filter(e => {
    if (search && !e.description.toLowerCase().includes(search.toLowerCase()) && !e.trackingId.toLowerCase().includes(search.toLowerCase())) return false;
    if (camFilter !== 'ALL' && e.cameraId !== camFilter) return false;
    if (typeFilter !== 'ALL' && e.eventType !== typeFilter) return false;
    if (riskFilter !== 'ALL' && e.severity !== riskFilter) return false;
    if (statusFilter !== 'ALL' && e.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Event Management</h1>
        <p className="text-xs text-slate-500">{filtered.length} of {events.length} events</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
          <input type="text" placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-10" />
        </div>
        <select value={camFilter} onChange={e => setCamFilter(e.target.value)} className="input">
          <option value="ALL">All Cameras</option>
          {cameras.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="input">
          <option value="ALL">All Types</option>
          {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} className="input">
          <option value="ALL">All Risk Levels</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input">
          <option value="ALL">All Statuses</option>
          <option value="NEW">New</option>
          <option value="ACKNOWLEDGED">Acknowledged</option>
          <option value="INVESTIGATING">Investigating</option>
          <option value="RESOLVED">Resolved</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-4 py-2.5 text-left text-[10px] font-mono uppercase text-slate-500">Time</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-mono uppercase text-slate-500">Camera</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-mono uppercase text-slate-500">Event</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-mono uppercase text-slate-500">Object</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-mono uppercase text-slate-500">Risk</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-mono uppercase text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 50).map(e => (
                <tr key={e.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-2.5 text-[11px] font-mono text-slate-400 whitespace-nowrap">
                    {new Date(e.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-accent-300 font-mono">{e.cameraId}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-200">{e.eventType}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-400 font-mono">{e.trackingId}</td>
                  <td className="px-4 py-2.5">
                    <span className={`badge ${riskColor[e.severity]}`}>{e.severity} ({e.riskScore})</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`badge ${statusColor[e.status]}`}>{e.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-8 text-center">
            <List className="h-8 w-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No events match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
