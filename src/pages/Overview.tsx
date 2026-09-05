import { useApp } from '../store';
import {
  Cctv, Bell, Users, Car, Fence, Activity,
  ShieldAlert, ArrowUpRight, Database, Shield,
  RadioTower, Clock3, ChevronRight
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
    { label: 'Blockchain Evidence', value: 'Immutable', icon: Database, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-200', page: 'blockchain' },
    { label: 'Cyber Threat Blocked', value: 142, icon: Shield, color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-200', page: 'events' },
    { label: 'Activity Alerts', value: activeAlerts, icon: Bell, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-200', page: 'events' },
    { label: 'Vehicles Detected', value: vehiclesDetected, icon: Car, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-200', page: 'vehicles' },
    { label: 'Intrusions Today', value: intrusionsToday, icon: Fence, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-200', page: 'intrusions' },
    { label: 'Suspicious Activities', value: suspiciousActivities, icon: ShieldAlert, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-200', page: 'suspicious' },
    { label: 'People Detected', value: peopleDetected, icon: Users, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-200', page: 'people' },
    { label: 'System Health', value: `${avgHealth}%`, icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-200', page: 'camera_health' },
  ];

  const perimeterPulse = [72, 88, 79, 92, 85, 94, 80, 90];

  const alertsList = [
    { title: 'Fence breach near Gate 13', time: '2 mins ago', level: 'High', tone: 'bg-red-500/10 text-red-600 border-red-200' },
    { title: 'Suspicious loitering detected', time: '12 mins ago', level: 'Medium', tone: 'bg-amber-500/10 text-amber-600 border-amber-200' },
    { title: 'Vehicle mismatch flagged', time: '22 mins ago', level: 'Low', tone: 'bg-emerald-500/10 text-emerald-600 border-emerald-200' },
  ];

  return (
    <div className="dashboard-shell space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-orange-600">Security command center</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-800">Command Overview</h2>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600 shadow-[0_8px_20px_rgba(16,185,129,0.08)]">
          <span className="status-dot bg-emerald-500 animate-pulse" />
          <span>All systems operational</span>
        </div>
      </div>

      <section className="glass-panel relative overflow-hidden rounded-[28px] border border-white/80 bg-white/60 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:p-6">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-orange-700">
              <RadioTower className="h-3.5 w-3.5" />
              Live perimeter scan
            </div>

            <div>
              <h3 className="text-3xl font-black tracking-tight text-slate-900">Border integrity is stable across critical sectors.</h3>
              <p className="mt-2 max-w-xl text-sm text-slate-600">
                Surveillance feeds, detection intelligence, and asset health are synchronized for rapid operator response.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-2.5 py-1.5">
                <Cctv className="h-4 w-4 text-orange-500" />
                <span>{onlineCameras} online cameras</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-2.5 py-1.5">
                <Clock3 className="h-4 w-4 text-emerald-500" />
                <span>Response latency: 1.4s</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-[220px] rounded-[26px] border border-white/80 bg-white/50 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                <span>Threat score</span>
                <span className="text-emerald-600">Low</span>
              </div>

              <div className="mt-4 flex items-center justify-center">
                <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full border-[10px] border-orange-200 bg-gradient-to-br from-orange-50 to-emerald-50 shadow-inner shadow-white" style={{ backgroundImage: 'conic-gradient(#fb923c 0 76%, #e2e8f0 76% 100%)' }}>
                  <span className="relative z-10 text-3xl font-black text-slate-800">14</span>
                  <span className="relative z-10 text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500">risk index</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {kpis.map(kpi => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              onClick={() => onNavigate(kpi.page)}
              className={`relative cursor-pointer overflow-hidden rounded-[24px] border bg-white/55 p-4 shadow-[0_16px_36px_rgba(15,23,42,0.06)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.09)] ${kpi.border}`}
            >
              <div className="relative z-10 flex items-start justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 shadow-sm ${kpi.bg}`}>
                  <Icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
                <button type="button" className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white/70 text-slate-500 transition-colors hover:text-slate-800" aria-label={`Open ${kpi.label}`}>
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
              <div className="relative z-10 mt-5">
                <p className="text-2xl font-black tracking-tight text-slate-800">{kpi.value}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{kpi.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <section className="glass-panel relative overflow-hidden rounded-[28px] border border-white/80 bg-white/60 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
          <div className="relative z-10 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.32em] text-orange-600">Perimeter watch</p>
              <h3 className="text-lg font-black text-slate-800">Sector health map</h3>
            </div>
            <button type="button" className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">
              View all
            </button>
          </div>

          <div className="relative z-10 mt-5 grid gap-3 md:grid-cols-8">
            {perimeterPulse.map((value, index) => (
              <div key={index} className="flex flex-col items-center gap-2">
                <div className="w-full rounded-full bg-slate-100 p-1">
                  <div
                    className="rounded-full bg-gradient-to-t from-orange-500 via-amber-400 to-emerald-400"
                    style={{ height: `${value}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  S{index + 1}
                </span>
              </div>
            ))}
          </div>

          <div className="relative z-10 mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/80 bg-white/40 p-3 shadow-[0_8px_18px_rgba(15,23,42,0.03)] backdrop-blur-xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Camera uptime</p>
              <p className="mt-2 text-xl font-black tracking-tight text-slate-800">96.4%</p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/40 p-3 shadow-[0_8px_18px_rgba(15,23,42,0.03)] backdrop-blur-xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Threat blocks</p>
              <p className="mt-2 text-xl font-black tracking-tight text-slate-800">142</p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/40 p-3 shadow-[0_8px_18px_rgba(15,23,42,0.03)] backdrop-blur-xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Manual checks</p>
              <p className="mt-2 text-xl font-black tracking-tight text-slate-800">08</p>
            </div>
          </div>
        </section>

        <section className="glass-panel relative overflow-hidden rounded-[28px] border border-white/80 bg-white/60 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
          <div className="relative z-10 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.32em] text-orange-600">Alerts</p>
              <h3 className="text-lg font-black text-slate-800">Latest events</h3>
            </div>
            <button type="button" className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              Live
            </button>
          </div>

          <div className="relative z-10 mt-4 space-y-3">
            {alertsList.map((alert) => (
              <div key={alert.title} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/55 p-3 backdrop-blur-lg">
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.6)]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800">{alert.title}</p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{alert.time}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center rounded-full border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em] ${alert.tone}`}>{alert.level}</span>
              </div>
            ))}
          </div>

          <button type="button" className="relative z-10 mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-700 transition-colors hover:bg-slate-100">
            View alert log
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </section>
      </div>
    </div>
  );
}
