import { useEffect } from 'react';
import { useApp } from '../store';
import { Cctv, Bell, FolderOpen, Activity, ShieldAlert, ArrowUpRight, Wifi, WifiOff, RefreshCw, Database, Server, HardDrive } from 'lucide-react';
import type { PageId } from '../components/Layout';
import { riskColor } from '../types';

export default function Overview({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  const { alerts, events, cameras, incidents, health, stats, refreshAll } = useApp();

  const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL' && a.status === 'NEW');
  const newAlerts = alerts.filter(a => a.status === 'NEW');

  const kpis = [
    {
      label: 'Cameras Online',
      value: stats ? `${stats.cameras.active}/${stats.cameras.total}` : cameras.length > 0 ? `${cameras.filter(c => c.status === 'ACTIVE' || c.status === 'LIVE' || c.status === 'ONLINE').length}/${cameras.length}` : '—',
      icon: Cctv,
      color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', page: 'cameras' as PageId,
    },
    {
      label: 'New Alerts',
      value: newAlerts.length,
      icon: Bell,
      color: newAlerts.length > 0 ? 'text-red-600' : 'text-slate-500',
      bg: newAlerts.length > 0 ? 'bg-red-50' : 'bg-slate-50',
      border: newAlerts.length > 0 ? 'border-red-200' : 'border-slate-200',
      page: 'alerts' as PageId,
    },
    {
      label: 'Critical Alerts',
      value: criticalAlerts.length,
      icon: ShieldAlert,
      color: criticalAlerts.length > 0 ? 'text-red-600' : 'text-slate-500',
      bg: criticalAlerts.length > 0 ? 'bg-red-50' : 'bg-slate-50',
      border: criticalAlerts.length > 0 ? 'border-red-200' : 'border-slate-200',
      page: 'alerts' as PageId,
    },
    {
      label: 'Total Events',
      value: stats?.events?.total ?? events.length,
      icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', page: 'overview' as PageId,
    },
    {
      label: 'Open Incidents',
      value: stats?.incidents?.open ?? incidents.filter(i => i.status === 'OPEN').length,
      icon: FolderOpen, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', page: 'incidents' as PageId,
    },
    {
      label: 'Edge Queue',
      value: health?.edge_sync_queue ?? '—',
      icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', page: 'health' as PageId,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800">Command Overview</h2>
          <p className="text-xs text-slate-500 mt-0.5">Real-time border surveillance intelligence</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
            health?.status === 'healthy'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-red-50 border-red-200 text-red-600'
          }`}>
            {health?.status === 'healthy' ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            {health?.status === 'healthy' ? 'SYSTEMS OPERATIONAL' : health ? 'SYSTEM DEGRADED' : 'CHECKING...'}
          </div>
          <button onClick={refreshAll} className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors" title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map(kpi => {
          const Icon = kpi.icon;
          return (
            <button key={kpi.label} onClick={() => onNavigate(kpi.page)} className={`bg-white border rounded-xl p-4 text-left hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer ${kpi.border}`}>
              <div className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center mb-3`}>
                <Icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
              <p className="text-2xl font-black text-slate-800">{kpi.value}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">{kpi.label}</p>
            </button>
          );
        })}
      </div>

      {/* Recent Alerts + System Health Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Alerts */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Bell className="h-4 w-4 text-orange-500" /> Recent Alerts
            </h3>
            <button onClick={() => onNavigate('alerts')} className="text-xs text-orange-600 font-semibold flex items-center gap-1 hover:underline">
              View all <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {alerts.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm">No alerts</div>
            )}
            {alerts.slice(0, 6).map(alert => (
              <div key={alert.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${riskColor[alert.severity] || ''}`}>
                  {alert.severity}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-700 truncate">{alert.title || alert.reason}</p>
                  <p className="text-[10px] text-slate-400">{alert.cameraId} · {alert.createdAt ? new Date(alert.createdAt).toLocaleTimeString('en-IN') : '—'}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded border font-medium whitespace-nowrap ${
                  alert.status === 'NEW' ? 'text-red-600 bg-red-50 border-red-200' :
                  alert.status === 'ACKNOWLEDGED' ? 'text-amber-600 bg-amber-50 border-amber-200' :
                  'text-slate-500 bg-slate-50 border-slate-200'
                }`}>
                  {alert.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" /> System Health
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {[
              { label: 'Database', value: health?.database, icon: Database },
              { label: 'Storage (MinIO)', value: health?.storage, icon: HardDrive },
              { label: 'Redis', value: health?.redis, icon: Server },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs text-slate-600 font-medium">{label}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  value === 'healthy' ? 'bg-emerald-50 text-emerald-700' :
                  value === 'offline' ? 'bg-red-50 text-red-600' :
                  'bg-amber-50 text-amber-600'
                }`}>
                  {value || '—'}
                </span>
              </div>
            ))}
            {health && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">Edge Queue</span>
                  <span className="font-bold text-orange-600">{health.edge_sync_queue} pending</span>
                </div>
                <div className="flex justify-between text-[10px] mt-1">
                  <span className="text-slate-400">Version</span>
                  <span className="font-mono text-slate-500">{health.version}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
