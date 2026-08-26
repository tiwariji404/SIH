import { useApp } from '../store';
import CameraFeed from '../components/CameraFeed';
import {
  Cctv, Bell, Users, Car, Fence, Car as CarIcon, Activity,
  ShieldAlert, TrendingUp, ArrowUpRight, Radio,
} from 'lucide-react';

import type { PageId } from '../components/Layout';

export default function Overview({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  const { cameras, alerts, events, vehicles, tracks } = useApp();

  const onlineCameras = cameras.filter(c => c.status === 'ONLINE').length;
  const activeAlerts = alerts.filter(a => a.status !== 'RESOLVED').length;
  const peopleDetected = tracks.filter(t => t.objectType === 'person').length + 132;
  const vehiclesDetected = vehicles.length;
  const intrusionsToday = events.filter(e => e.eventType.includes('Intrusion') || e.eventType.includes('Fence')).length;
  const anprEvents = vehicles.length;
  const suspiciousActivities = events.filter(e => e.eventType.includes('Suspicious') || e.eventType.includes('Loitering')).length;
  const avgHealth = Math.round(cameras.reduce((s, c) => s + c.health, 0) / (cameras.length || 1));

  const kpis: { label: string; value: number | string; icon: any; color: string; bg: string; border: string; page: PageId }[] = [
    { label: 'Cameras Online', value: `${onlineCameras} / ${cameras.length}`, icon: Cctv, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', page: 'live' },
    { label: 'Active Alerts', value: activeAlerts, icon: Bell, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', page: 'alerts' },
    { label: 'People Detected', value: peopleDetected, icon: Users, color: 'text-accent-400', bg: 'bg-accent-500/10', border: 'border-accent-500/20', page: 'tracking' },
    { label: 'Vehicles Detected', value: vehiclesDetected, icon: Car, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', page: 'anpr' },
    { label: 'Intrusions Today', value: intrusionsToday, icon: Fence, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', page: 'events' },
    { label: 'ANPR Events', value: anprEvents, icon: CarIcon, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', page: 'anpr' },
    { label: 'Suspicious Activities', value: suspiciousActivities, icon: ShieldAlert, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', page: 'tracking' },
    { label: 'System Health', value: `${avgHealth}%`, icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', page: 'health' },
  ];

  const activeAlertsList = alerts.filter(a => a.status !== 'RESOLVED');

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

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} onClick={() => onNavigate(kpi.page)} className={`card card-hover p-4 border cursor-pointer ${kpi.border}`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${kpi.bg}`}>
                  <Icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
                <ArrowUpRight className="h-3 w-3 text-slate-600" />
              </div>
              <p className="text-2xl font-extrabold text-slate-800">{kpi.value}</p>
              <p className="text-[10px] font-semibold text-slate-600 mt-0.5 uppercase tracking-wider">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* Active Alerts List */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Active Alerts</h3>
          <button onClick={() => onNavigate('alerts')} className="text-[10px] text-orange-500 hover:text-orange-600 font-bold uppercase tracking-wider">
            VIEW ALL →
          </button>
        </div>
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {activeAlertsList.length === 0 ? (
            <p className="text-sm font-semibold text-slate-500 py-6 text-center">No active alerts at the moment.</p>
          ) : (
            activeAlertsList.map(alert => (
              <div key={alert.id} className="flex items-center gap-3 p-3.5 rounded-lg bg-white border border-slate-200 hover:border-orange-300 hover:shadow-[0_4px_12px_rgba(234,88,12,0.1)] transition-all cursor-pointer" onClick={() => onNavigate('alerts')}>
                <div className={`w-1.5 h-12 rounded-full flex-shrink-0 ${alert.severity === 'CRITICAL' ? 'bg-red-500' : alert.severity === 'HIGH' ? 'bg-orange-500' : alert.severity === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-extrabold text-slate-800 truncate">{alert.title}</p>
                  <p className="text-xs font-semibold text-slate-600 mt-1 uppercase tracking-wider">{alert.cameraId} • {alert.when}</p>
                </div>
                <span className={`badge text-xs px-2.5 py-1 font-bold ${alert.status === 'NEW' ? 'bg-red-500/10 text-red-600 border border-red-500/20' : alert.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'}`}>
                  {alert.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
      
    </div>
  );
}
