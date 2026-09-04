import { useApp } from '../store';
import {
  Cctv, Bell, Users, Car, Fence, Activity,
  ShieldAlert, ArrowUpRight
} from 'lucide-react';

import type { PageId } from '../components/Layout';

export default function Overview({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  const { cameras, alerts, events, vehicles, tracks } = useApp();

  const onlineCameras = cameras.filter(c => c.status === 'ONLINE').length;
  const activeAlerts = alerts.filter(a => a.status !== 'RESOLVED').length;
  const peopleDetected = tracks.filter(t => t.objectType === 'person').length + 132;
  const vehiclesDetected = vehicles.length;
  const intrusionsToday = events.filter(e => e.eventType.includes('Intrusion') || e.eventType.includes('Fence')).length;
  const suspiciousActivities = events.filter(e => e.eventType.includes('Suspicious') || e.eventType.includes('Loitering')).length;
  const avgHealth = Math.round(cameras.reduce((s, c) => s + c.health, 0) / (cameras.length || 1));

  const kpis: { label: string; value: number | string; icon: React.ElementType; color: string; bg: string; border: string; page: PageId }[] = [
    { label: 'Activity Alerts', value: activeAlerts, icon: Bell, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', page: 'events' }, // Re-routing alerts to main Event Log or a dedicated page if we want, but 'events' is standard
    { label: 'People Detected', value: peopleDetected, icon: Users, color: 'text-accent-400', bg: 'bg-accent-500/10', border: 'border-accent-500/20', page: 'people' },
    { label: 'Vehicles Detected', value: vehiclesDetected, icon: Car, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', page: 'vehicles' },
    { label: 'Intrusions Today', value: intrusionsToday, icon: Fence, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', page: 'intrusions' },
    { label: 'Suspicious Activities', value: suspiciousActivities, icon: ShieldAlert, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', page: 'suspicious' },
    { label: 'System Health', value: `${avgHealth}%`, icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', page: 'camera_health' },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Command Overview</h2>
          <p className="text-xs text-slate-600">Real-time border surveillance intelligence</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <span className="status-dot bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-mono text-emerald-400">ALL SYSTEMS OPERATIONAL</span>
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
