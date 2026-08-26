import { useApp } from '../store';
import CameraFeed from '../components/CameraFeed';
import {
  Cctv, Bell, Users, Car, Fence, Car as CarIcon, Activity,
  ShieldAlert, TrendingUp, ArrowUpRight, Radio,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
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
  const avgHealth = Math.round(cameras.reduce((s, c) => s + c.health, 0) / cameras.length);

  const kpis = [
    { label: 'Cameras Online', value: `${onlineCameras} / ${cameras.length}`, icon: Cctv, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { label: 'Active Alerts', value: activeAlerts, icon: Bell, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    { label: 'People Detected', value: peopleDetected, icon: Users, color: 'text-accent-400', bg: 'bg-accent-500/10', border: 'border-accent-500/20' },
    { label: 'Vehicles Detected', value: vehiclesDetected, icon: Car, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { label: 'Intrusions Today', value: intrusionsToday, icon: Fence, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    { label: 'ANPR Events', value: anprEvents, icon: CarIcon, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { label: 'Suspicious Activities', value: suspiciousActivities, icon: ShieldAlert, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    { label: 'System Health', value: `${avgHealth}%`, icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  ];

  // Chart data
  const hourlyData = Array.from({ length: 24 }, (_, h) => ({
    hour: `${String(h).padStart(2, '0')}:00`,
    events: Math.floor(Math.abs(Math.sin(h / 3) * 15) + Math.random() * 8),
    alerts: Math.floor(Math.abs(Math.sin(h / 4) * 5) + Math.random() * 3),
  }));

  const cameraData = cameras.slice(0, 8).map(c => ({
    name: c.id,
    events: c.detectionCount,
  }));

  const severityData = [
    { name: 'LOW', value: events.filter(e => e.severity === 'LOW').length, color: '#10b981' },
    { name: 'MEDIUM', value: events.filter(e => e.severity === 'MEDIUM').length, color: '#f59e0b' },
    { name: 'HIGH', value: events.filter(e => e.severity === 'HIGH').length, color: '#f97316' },
    { name: 'CRITICAL', value: events.filter(e => e.severity === 'CRITICAL').length, color: '#ef4444' },
  ];

  const recentAlerts = alerts.slice(0, 5);
  const liveCameras = cameras.filter(c => c.status === 'ONLINE').slice(0, 4);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Command Overview</h1>
          <p className="text-xs text-slate-500">Real-time border surveillance intelligence</p>
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
            <div key={kpi.label} className={`card card-hover p-4 border ${kpi.border}`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${kpi.bg}`}>
                  <Icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
                <ArrowUpRight className="h-3 w-3 text-slate-600" />
              </div>
              <p className="text-2xl font-bold text-slate-100">{kpi.value}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Events by hour */}
        <div className="card p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200">Events by Hour</h3>
            <TrendingUp className="h-4 w-4 text-slate-600" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={hourlyData}>
              <defs>
                <linearGradient id="eventGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="alertGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
              <XAxis dataKey="hour" stroke="#475569" fontSize={9} interval={3} />
              <YAxis stroke="#475569" fontSize={10} />
              <Tooltip contentStyle={{ background: '#0d1320', border: '1px solid #243044', borderRadius: '8px', fontSize: '11px' }} />
              <Area type="monotone" dataKey="events" stroke="#06b6d4" strokeWidth={2} fill="url(#eventGrad)" />
              <Area type="monotone" dataKey="alerts" stroke="#ef4444" strokeWidth={2} fill="url(#alertGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Severity distribution */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Alert Severity Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={severityData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                {severityData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#0d1320', border: '1px solid #243044', borderRadius: '8px', fontSize: '11px' }} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Live cameras + recent alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Live camera grid */}
        <div className="card p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Radio className="h-4 w-4 text-accent-400 animate-pulse" />
              Live Camera Feeds
            </h3>
            <button onClick={() => onNavigate('live')} className="text-[10px] text-accent-400 hover:text-accent-300 font-mono">
              VIEW ALL →
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {liveCameras.map(cam => (
              <CameraFeed key={cam.id} camera={cam} compact />
            ))}
          </div>
        </div>

        {/* Recent alerts */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-200">Recent Alerts</h3>
            <button onClick={() => onNavigate('alerts')} className="text-[10px] text-accent-400 hover:text-accent-300 font-mono">
              VIEW ALL →
            </button>
          </div>
          <div className="space-y-2">
            {recentAlerts.map(alert => (
              <div key={alert.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors cursor-pointer" onClick={() => onNavigate('alerts')}>
                <div className={`w-1 h-10 rounded-full ${alert.severity === 'CRITICAL' ? 'bg-red-500' : alert.severity === 'HIGH' ? 'bg-orange-500' : alert.severity === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-200 truncate">{alert.title}</p>
                  <p className="text-[10px] text-slate-500">{alert.cameraId} • {alert.when}</p>
                </div>
                <span className={`badge text-[9px] ${alert.status === 'NEW' ? 'bg-red-500/20 text-red-400' : alert.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {alert.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Events by camera bar chart */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-slate-200 mb-4">Detections by Camera</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={cameraData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
            <XAxis dataKey="name" stroke="#475569" fontSize={9} />
            <YAxis stroke="#475569" fontSize={10} />
            <Tooltip contentStyle={{ background: '#0d1320', border: '1px solid #243044', borderRadius: '8px', fontSize: '11px' }} cursor={{ fill: '#ffffff05' }} />
            <Bar dataKey="events" fill="#06b6d4" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
