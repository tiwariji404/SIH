import { useEffect, useState } from 'react';
import { useApp } from '../store';
import { Camera as CameraIcon, RefreshCw, Wifi, WifiOff, AlertTriangle, Plus, Search } from 'lucide-react';
import { formatTime } from '../types';
import { api } from '../lib/api';

const statusStyles: Record<string, string> = {
  ONLINE: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  ACTIVE: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  LIVE: 'text-green-700 bg-green-50 border-green-200',
  OFFLINE: 'text-red-700 bg-red-50 border-red-200',
  DISCONNECTED: 'text-red-700 bg-red-50 border-red-200',
  DEGRADED: 'text-amber-700 bg-amber-50 border-amber-200',
  ERROR: 'text-red-700 bg-red-50 border-red-200',
  MAINTENANCE: 'text-slate-600 bg-slate-50 border-slate-200',
};

export default function Cameras() {
  const { cameras, camerasLoading, refreshCameras, showToast, user } = useApp();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', bop: '', location: '', rtsp_url: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { refreshCameras(); }, []);

  const filtered = cameras.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.id || '').toLowerCase().includes(search.toLowerCase())
  );

  const canCreate = user?.role === 'admin' || user?.role_name === 'ADMIN';

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.cameras.create({ ...form, status: 'DISCONNECTED' });
      showToast({ type: 'success', title: 'Camera Added', message: `Camera "${form.name}" registered.` });
      setForm({ name: '', bop: '', location: '', rtsp_url: '' });
      setShowAdd(false);
      refreshCameras();
    } catch (e: any) {
      showToast({ type: 'warning', title: 'Error', message: e.message });
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <CameraIcon className="h-5 w-5 text-slate-600" /> Camera Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{cameras.length} cameras registered</p>
        </div>
        <div className="flex items-center gap-2">
          {canCreate && (
            <button onClick={() => setShowAdd(!showAdd)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 text-xs font-bold transition-colors">
              <Plus className="h-3.5 w-3.5" /> Add Camera
            </button>
          )}
          <button onClick={refreshCameras} disabled={camerasLoading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-semibold">
            <RefreshCw className={`h-3.5 w-3.5 ${camerasLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && canCreate && (
        <form onSubmit={handleAdd} className="bg-white border border-orange-200 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-slate-700">Register New Camera</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Camera Name *</label>
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-orange-400" placeholder="e.g. BOP-04 North Gate" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">BOP / Site</label>
              <input value={form.bop} onChange={e => setForm(f => ({ ...f, bop: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-orange-400" placeholder="e.g. BOP-04" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Location</label>
              <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-orange-400" placeholder="Sector / Grid coordinates" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">RTSP URL</label>
              <input value={form.rtsp_url} onChange={e => setForm(f => ({ ...f, rtsp_url: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-orange-400" placeholder="rtsp://..." />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg disabled:opacity-50">
              {submitting ? 'Saving...' : 'Register Camera'}
            </button>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        <input type="text" placeholder="Search cameras..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-slate-200 bg-white rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-orange-400" />
      </div>

      {camerasLoading && cameras.length === 0 ? (
        <div className="text-center py-16 text-slate-400">Loading cameras...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <CameraIcon className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No cameras found.</p>
          {canCreate && <p className="text-xs text-slate-400 mt-1">Add a camera to get started.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(cam => {
            const statusOk = cam.status === 'ONLINE' || cam.status === 'ACTIVE' || cam.status === 'LIVE';
            const statusBad = cam.status === 'OFFLINE' || cam.status === 'DISCONNECTED' || cam.status === 'ERROR';
            return (
              <div key={cam.id} className={`bg-white border rounded-xl p-4 ${statusBad ? 'border-red-200' : 'border-slate-200'}`}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-sm truncate">{cam.name}</p>
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">{cam.id}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${statusStyles[cam.status] || 'text-slate-500 bg-slate-50 border-slate-200'}`}>
                      {cam.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 text-[11px]">
                  {cam.bop && <div className="flex justify-between"><span className="text-slate-400">BOP</span><span className="font-mono text-slate-600">{cam.bop}</span></div>}
                  {cam.location && <div className="flex justify-between"><span className="text-slate-400">Location</span><span className="text-slate-600 truncate max-w-32">{cam.location}</span></div>}
                  {cam.fps && <div className="flex justify-between"><span className="text-slate-400">FPS</span><span className="font-mono text-slate-600">{cam.fps}</span></div>}
                  {cam.latency && <div className="flex justify-between"><span className="text-slate-400">Latency</span><span className="font-mono text-slate-600">{cam.latency}ms</span></div>}
                  {cam.lastHeartbeat && <div className="flex justify-between"><span className="text-slate-400">Last Seen</span><span className="text-slate-600">{formatTime(cam.lastHeartbeat)}</span></div>}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5">
                  {statusOk ? <Wifi className="h-3.5 w-3.5 text-emerald-500" /> : <WifiOff className="h-3.5 w-3.5 text-red-400" />}
                  <span className={`text-[10px] font-semibold ${statusOk ? 'text-emerald-600' : statusBad ? 'text-red-500' : 'text-amber-600'}`}>
                    {statusOk ? 'Live feed' : statusBad ? 'No signal' : 'Degraded'}
                  </span>
                  {cam.health !== undefined && (
                    <span className="ml-auto text-[10px] text-slate-400">Health: {cam.health}%</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
