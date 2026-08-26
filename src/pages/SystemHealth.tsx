import { useApp } from '../store';
import { Activity, Wifi, Cctv, AlertTriangle } from 'lucide-react';

export default function SystemHealth() {
  const { cameras, showToast, triggerCameraOffline } = useApp();

  const onlineCount = cameras.filter(c => c.status === 'ONLINE').length;
  const degradedCount = cameras.filter(c => c.status === 'DEGRADED').length;
  const offlineCount = cameras.filter(c => c.status === 'OFFLINE').length;
  const avgHealth = Math.round(cameras.reduce((s, c) => s + c.health, 0) / cameras.length);

  const simulateOffline = () => {
    const target = cameras.find(c => c.id === 'BOP-06' && c.status === 'ONLINE');
    if (!target) {
      showToast({ type: 'warning', title: 'Already Offline', message: 'BOP-06 is already offline.' });
      return;
    }
    triggerCameraOffline('BOP-06');
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">System Health</h1>
          <p className="text-xs text-slate-500">Camera infrastructure monitoring and diagnostics</p>
        </div>
        <button onClick={simulateOffline} className="btn-danger">
          <AlertTriangle className="h-4 w-4" /> Simulate BOP-06 Offline
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4 border-emerald-500/20">
          <Cctv className="h-5 w-5 text-emerald-400 mb-2" />
          <p className="text-2xl font-bold text-slate-100">{onlineCount}</p>
          <p className="text-[10px] text-slate-500">Online</p>
        </div>
        <div className="card p-4 border-amber-500/20">
          <Activity className="h-5 w-5 text-amber-400 mb-2" />
          <p className="text-2xl font-bold text-slate-100">{degradedCount}</p>
          <p className="text-[10px] text-slate-500">Degraded</p>
        </div>
        <div className="card p-4 border-red-500/20">
          <AlertTriangle className="h-5 w-5 text-red-400 mb-2" />
          <p className="text-2xl font-bold text-slate-100">{offlineCount}</p>
          <p className="text-[10px] text-slate-500">Offline</p>
        </div>
        <div className="card p-4 border-accent-500/20">
          <Wifi className="h-5 w-5 text-accent-400 mb-2" />
          <p className="text-2xl font-bold text-slate-100">{avgHealth}%</p>
          <p className="text-[10px] text-slate-500">Avg Health</p>
        </div>
      </div>

      {/* Camera health table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-4 py-2.5 text-left text-[10px] font-mono uppercase text-slate-500">Camera ID</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-mono uppercase text-slate-500">Status</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-mono uppercase text-slate-500">FPS</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-mono uppercase text-slate-500">Latency</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-mono uppercase text-slate-500">Storage</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-mono uppercase text-slate-500">Signal</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-mono uppercase text-slate-500">Health</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-mono uppercase text-slate-500">Last Heartbeat</th>
              </tr>
            </thead>
            <tbody>
              {cameras.map(c => (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-2.5 text-xs font-mono text-accent-300">{c.id}</td>
                  <td className="px-4 py-2.5">
                    <span className={`badge ${c.status === 'ONLINE' ? 'bg-emerald-500/20 text-emerald-400' : c.status === 'DEGRADED' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>{c.status}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-300 font-mono">{c.fps}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-300 font-mono">{c.latency} ms</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${c.storage}%`, backgroundColor: c.storage > 70 ? '#f59e0b' : '#10b981' }} />
                      </div>
                      <span className="text-[10px] text-slate-400">{c.storage}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-300 font-mono">{c.signalQuality}%</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${c.health}%`, backgroundColor: c.health > 90 ? '#10b981' : c.health > 60 ? '#f59e0b' : '#ef4444' }} />
                      </div>
                      <span className="text-[10px] text-slate-400">{c.health}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-[10px] font-mono text-slate-500 whitespace-nowrap">
                    {new Date(c.lastHeartbeat).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
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
