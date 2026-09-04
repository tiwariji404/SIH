import { useState, useEffect } from 'react';
import { useApp } from '../store';
import { Shield, Plus, Trash2, RefreshCw, Info } from 'lucide-react';
import { formatTime, riskColor } from '../types';
import { api } from '../lib/api';

export default function Zones() {
  const { zones, cameras, refreshZones, showToast, user } = useApp();
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', zoneType: 'RESTRICTED', severity: 'HIGH', cameraId: '', rule: '' });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    refreshZones().finally(() => setLoading(false));
  }, []);

  const canModify = user?.role === 'admin' || user?.role_name === 'ADMIN' || user?.role === 'supervisor' || user?.role_name === 'SUPERVISOR';

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.zones.create({
        ...form,
        cameraIds: form.cameraId ? [form.cameraId] : [],
        coordinates: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }],
      });
      showToast({ type: 'success', title: 'Zone Created', message: `Zone "${form.name}" saved.` });
      setForm({ name: '', zoneType: 'RESTRICTED', severity: 'HIGH', cameraId: '', rule: '' });
      setShowAdd(false);
      refreshZones();
    } catch (e: any) {
      showToast({ type: 'warning', title: 'Error', message: e.message });
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this zone?')) return;
    setDeleting(id);
    try {
      await api.zones.delete(id);
      showToast({ type: 'success', title: 'Zone Deleted', message: 'Virtual fence removed.' });
      refreshZones();
    } catch (e: any) {
      showToast({ type: 'warning', title: 'Error', message: e.message });
    } finally { setDeleting(null); }
  };

  const zoneTypeColors: Record<string, string> = {
    RESTRICTED: 'text-red-700 bg-red-50 border-red-200',
    HIGH_SECURITY: 'text-orange-700 bg-orange-50 border-orange-200',
    ENTRY: 'text-blue-700 bg-blue-50 border-blue-200',
    EXIT: 'text-purple-700 bg-purple-50 border-purple-200',
    EXCLUSION: 'text-amber-700 bg-amber-50 border-amber-200',
    NORMAL: 'text-slate-600 bg-slate-50 border-slate-200',
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-500" /> Virtual Fence Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{zones.length} zones configured</p>
        </div>
        <div className="flex gap-2">
          {canModify && (
            <button onClick={() => setShowAdd(!showAdd)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 text-xs font-bold">
              <Plus className="h-3.5 w-3.5" /> Add Zone
            </button>
          )}
          <button onClick={() => { setLoading(true); refreshZones().finally(() => setLoading(false)); }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-semibold">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && canModify && (
        <form onSubmit={handleAdd} className="bg-white border border-orange-200 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-slate-700">Define New Virtual Fence</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex items-start gap-2 text-xs text-blue-700">
            <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            Coordinates are currently set to full-frame boundary. Use the canvas tool for precise polygon drawing.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Zone Name *</label>
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-orange-400" placeholder="e.g. Northern Perimeter A" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Camera</label>
              <select value={form.cameraId} onChange={e => setForm(f => ({ ...f, cameraId: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-orange-400">
                <option value="">No specific camera</option>
                {cameras.map(c => <option key={c.id} value={c.id}>{c.name || c.id}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Zone Type</label>
              <select value={form.zoneType} onChange={e => setForm(f => ({ ...f, zoneType: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-orange-400">
                {['RESTRICTED', 'HIGH_SECURITY', 'ENTRY', 'EXIT', 'EXCLUSION', 'NORMAL'].map(t =>
                  <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Severity</label>
              <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-orange-400">
                {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Rule / Description</label>
              <input value={form.rule} onChange={e => setForm(f => ({ ...f, rule: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-orange-400" placeholder="No unauthorized entry after 20:00" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg disabled:opacity-50">
              {submitting ? 'Saving...' : 'Create Zone'}
            </button>
          </div>
        </form>
      )}

      {/* Zones list */}
      {loading && zones.length === 0 ? (
        <div className="text-center py-16 text-slate-400">Loading zones...</div>
      ) : zones.length === 0 ? (
        <div className="text-center py-16">
          <Shield className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No virtual fences configured.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {zones.map(zone => (
            <div key={zone.id} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 text-sm truncate">{zone.name}</p>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">{zone.id?.slice(0, 12)}...</p>
                </div>
                {canModify && (
                  <button onClick={() => handleDelete(zone.id)} disabled={deleting === zone.id}
                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${zoneTypeColors[zone.zoneType] || ''}`}>{zone.zoneType}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${riskColor[zone.severity] || ''}`}>{zone.severity}</span>
              </div>
              {zone.rule && <p className="text-[10px] text-slate-500 mb-2">{zone.rule}</p>}
              <div className="text-[10px] text-slate-400 space-y-0.5">
                <p>Camera: <span className="font-mono">{zone.cameraId || (zone.cameraIds?.join(', ')) || '—'}</span></p>
                <p>Points: {zone.coordinates?.length ?? 0} vertices</p>
                <p>Created: {formatTime(zone.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
