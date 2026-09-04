import { useState, useEffect } from 'react';
import { useApp } from '../store';
import {
  Cctv, Bell, Users, Car, Fence, Activity,
  ShieldAlert, ArrowUpRight
} from 'lucide-react';

import type { PageId } from '../components/Layout';

export default function Overview({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  const { alerts, token } = useApp();
  const [stats, setStats] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    if (!token) return;
    fetch('/api/v1/analytics/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(setStats)
      .catch(console.error);
      
    fetch('/api/v1/analytics/health', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(setHealth)
      .catch(console.error);
  }, [token]);

  const kpis: { label: string; value: number | string; icon: React.ElementType; color: string; bg: string; border: string; page: PageId }[] = [
    { label: 'Cameras Online', value: stats ? `${stats.cameras.active} / ${stats.cameras.total}` : '...', icon: Cctv, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', page: 'cameras' },
    { label: 'Overall Events', value: stats ? stats.events.total : '...', icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', page: 'events' },
    { label: 'Unresolved Events', value: stats ? stats.events.unresolved : '...', icon: ShieldAlert, color: 'text-accent-400', bg: 'bg-accent-500/10', border: 'border-accent-500/20', page: 'events' },
    { label: 'Total Incidents', value: stats ? stats.incidents.total : '...', icon: Fence, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', page: 'vault' },
    { label: 'Open Incidents', value: stats ? stats.incidents.open : '...', icon: Bell, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', page: 'vault' },
    { label: 'Edge Queue Status', value: health ? health.edge_sync_queue : '...', icon: Activity, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', page: 'overview' },
    { label: 'DB Health', value: health ? health.database : '...', icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', page: 'overview' },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">

      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Command Overview</h2>
          <p className="text-xs text-slate-600">Real-time border surveillance intelligence</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${health?.status === 'healthy' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
          <span className={`status-dot animate-pulse ${health?.status === 'healthy' ? 'bg-emerald-400' : 'bg-red-400'}`} />
          <span className={`text-[10px] font-mono ${health?.status === 'healthy' ? 'text-emerald-400' : 'text-red-400'}`}>
            {health?.status === 'healthy' ? 'SYSTEMS OPERATIONAL' : 'SYSTEM DEGRADED'}
          </span>
        </div>
      </div>

      {/* KPI cards - Now routing to deeply detailed pages */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} onClick={() => onNavigate(kpi.page)} className={`card card-hover p-5 border cursor-pointer bg-white transition-all hover:shadow-lg ${kpi.border}`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${kpi.bg}`}>
                  <Icon className={`h-6 w-6 ${kpi.color}`} />
                </div>
                <div className="p-1.5 bg-slate-50 rounded-lg group-hover:bg-slate-100 transition-colors">
                   <ArrowUpRight className="h-4 w-4 text-slate-400" />
                </div>
              </div>
              <div>
                 <p className="text-3xl font-black text-slate-800 tracking-tight">{kpi.value}</p>
                 <p className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-widest">{kpi.label}</p>
              </div>
            </div>
          );
        })}
      </div>
      
    </div>
  );
}
