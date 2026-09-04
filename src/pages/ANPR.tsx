import { useState, useMemo } from 'react';
import { useApp } from '../store';
import { Car, Search, RefreshCw, Filter } from 'lucide-react';
import { formatTime } from '../types';

const statusStyles: Record<string, string> = {
  AUTHORIZED: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  WATCHLIST: 'text-red-700 bg-red-50 border-red-200',
  UNKNOWN: 'text-slate-600 bg-slate-50 border-slate-200',
};

export default function ANPR() {
  const { vehicles, refreshVehicles, cameras } = useApp();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [camFilter, setCamFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [minConf, setMinConf] = useState(0);

  const filtered = useMemo(() => {
    return vehicles.filter(v => {
      if (search && !(v.plateNumber || '').toLowerCase().includes(search.toLowerCase())) return false;
      if (camFilter !== 'ALL' && v.cameraId !== camFilter) return false;
      if (statusFilter !== 'ALL' && v.status !== statusFilter) return false;
      if (v.confidence < minConf) return false;
      return true;
    });
  }, [vehicles, search, camFilter, statusFilter, minConf]);

  const refresh = () => {
    setLoading(true);
    refreshVehicles().finally(() => setLoading(false));
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Car className="h-5 w-5 text-slate-600" /> ANPR — Plate Records
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{filtered.length} of {vehicles.length} plates · OCR-sourced data</p>
        </div>
        <button onClick={refresh} disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-semibold">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input type="text" placeholder="Search plate number..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 bg-white rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-orange-400" />
        </div>
        <select value={camFilter} onChange={e => setCamFilter(e.target.value)}
          className="px-2 py-2 border border-slate-200 bg-white rounded-lg text-xs text-slate-700 focus:outline-none focus:border-orange-400">
          <option value="ALL">All Cameras</option>
          {cameras.map(c => <option key={c.id} value={c.id}>{c.name || c.id}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-2 py-2 border border-slate-200 bg-white rounded-lg text-xs text-slate-700 focus:outline-none focus:border-orange-400">
          <option value="ALL">All Status</option>
          <option value="AUTHORIZED">Authorized</option>
          <option value="WATCHLIST">Watchlist</option>
          <option value="UNKNOWN">Unknown</option>
        </select>
      </div>

      {/* Table */}
      {vehicles.length === 0 ? (
        <div className="text-center py-16">
          <Car className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No ANPR records found</p>
          <p className="text-xs text-slate-400 mt-1">ANPR data is populated when the YOLO pipeline detects plates via OCR.</p>
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-700 max-w-md mx-auto">
            <strong>Note:</strong> ANPR OCR runs in CPU mode via easyocr. Real plate recognition requires physical cameras or demo video with visible plates.
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">No plates match your filters.</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Plate', 'Confidence', 'Camera', 'Vehicle Type', 'Direction', 'Status', 'Timestamp'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map(v => (
                <tr key={v.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-2.5">
                    <span className="font-black font-mono text-sm text-slate-800 tracking-wider">{v.plateNumber}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${v.confidence >= 80 ? 'bg-emerald-500' : v.confidence >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${v.confidence}%` }} />
                      </div>
                      <span className="font-mono text-slate-600">{v.confidence}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-slate-500">{v.cameraId}</td>
                  <td className="px-4 py-2.5 text-slate-600">{v.vehicleType}</td>
                  <td className="px-4 py-2.5 text-slate-500">{v.direction || '—'}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusStyles[v.status] || ''}`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-slate-400 whitespace-nowrap">{formatTime(v.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
