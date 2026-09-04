import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../store';
import { riskColor, statusColor, formatTime } from '../types';
import { Search, List, RefreshCw } from 'lucide-react';

export default function Events() {
  const { events, cameras, eventsLoading, refreshEvents } = useApp();
  const [search, setSearch] = useState('');
  const [camFilter, setCamFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => { refreshEvents(); }, []);

  const eventTypes = useMemo(() => [...new Set(events.map(e => e.eventType))], [events]);

  const filtered = useMemo(() => events.filter(e => {
    if (search && !(e.description || '').toLowerCase().includes(search.toLowerCase()) &&
        !(e.trackingId || '').toLowerCase().includes(search.toLowerCase()) &&
        !e.eventType.toLowerCase().includes(search.toLowerCase())) return false;
    if (camFilter !== 'ALL' && e.cameraId !== camFilter) return false;
    if (typeFilter !== 'ALL' && e.eventType !== typeFilter) return false;
    if (riskFilter !== 'ALL' && e.severity !== riskFilter) return false;
    if (statusFilter !== 'ALL' && e.status !== statusFilter) return false;
    return true;
  }), [events, search, camFilter, typeFilter, riskFilter, statusFilter]);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800">Event Log</h2>
          <p className="text-xs text-slate-500 mt-0.5">{filtered.length} of {events.length} events</p>
        </div>
        <button onClick={refreshEvents} disabled={eventsLoading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-semibold">
          <RefreshCw className={`h-3.5 w-3.5 ${eventsLoading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input type="text" placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 bg-white rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-orange-400" />
        </div>
        <select value={camFilter} onChange={e => setCamFilter(e.target.value)} className="px-2 py-2 border border-slate-200 bg-white rounded-lg text-xs text-slate-700 focus:outline-none focus:border-orange-400">
          <option value="ALL">All Cameras</option>
          {cameras.map(c => <option key={c.id} value={c.id}>{c.name || c.id}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-2 py-2 border border-slate-200 bg-white rounded-lg text-xs text-slate-700 focus:outline-none focus:border-orange-400">
          <option value="ALL">All Types</option>
          {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} className="px-2 py-2 border border-slate-200 bg-white rounded-lg text-xs text-slate-700 focus:outline-none focus:border-orange-400">
          <option value="ALL">All Risk</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Time', 'Camera', 'Event Type', 'Track ID', 'Risk', 'Score', 'Status'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12">
                  <List className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">{eventsLoading ? 'Loading events...' : 'No events match your filters'}</p>
                </td></tr>
              )}
              {filtered.slice(0, 100).map(e => (
                <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-2 font-mono text-slate-400 whitespace-nowrap">
                    {formatTime(e.event_timestamp || e.timestamp)}
                  </td>
                  <td className="px-4 py-2 font-mono text-blue-600 text-[10px]">{e.cameraId}</td>
                  <td className="px-4 py-2 font-medium text-slate-700">{e.eventType}</td>
                  <td className="px-4 py-2 font-mono text-slate-400 text-[10px]">{e.trackingId || '—'}</td>
                  <td className="px-4 py-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${riskColor[e.severity] || 'text-slate-500 border-slate-200'}`}>
                      {e.severity}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-mono font-bold text-slate-600">{e.riskScore}</td>
                  <td className="px-4 py-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${statusColor[e.status] || 'text-slate-500 border-slate-200'}`}>
                      {e.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
