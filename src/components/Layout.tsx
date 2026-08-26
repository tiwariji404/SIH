import { useState, type ReactNode } from 'react';
import {
  Activity,
  BarChart3,
  Bell,
  BrainCircuit,
  Camera,
  FileClock,
  FileText,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  Radio,
  ScanFace,
  Settings2,
  Shield,
  Target,
  TrafficCone,
  TriangleAlert,
  X,
} from 'lucide-react';
import { useApp } from '../store';

export type PageId =
  | 'overview'
  | 'live'
  | 'cameras'
  | 'alerts'
  | 'events'
  | 'map'
  | 'anpr'
  | 'tracking'
  | 'fences'
  | 'analytics'
  | 'health'
  | 'audit'
  | 'reports'
  | 'demo'
  | 'settings'
  | 'innovation'
  | 'faces';

interface Props {
  current: PageId;
  onNavigate: (page: PageId) => void;
  children: ReactNode;
}

interface NavItem {
  id: PageId;
  label: string;
  icon: typeof LayoutDashboard;
  accent?: string;
}

const PRIMARY_NAV: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'live', label: 'Live Surveillance', icon: Radio, accent: 'text-red-400' },
  { id: 'cameras', label: 'Cameras', icon: Camera },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'events', label: 'Events', icon: FileText },
  { id: 'map', label: 'Border Map', icon: Map },
  { id: 'anpr', label: 'ANPR', icon: TrafficCone },
  { id: 'tracking', label: 'Tracking', icon: Target },
  { id: 'fences', label: 'Virtual Fences', icon: Shield },
];

const SECONDARY_NAV: NavItem[] = [
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'health', label: 'System Health', icon: Activity },
  { id: 'audit', label: 'Audit Logs', icon: FileClock },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'demo', label: 'Demo Center', icon: FlaskConical },
  { id: 'innovation', label: 'Innovation', icon: BrainCircuit },
  { id: 'faces', label: 'Face Detection', icon: ScanFace },
  { id: 'settings', label: 'Settings', icon: Settings2 },
];

function NavButton({
  item,
  current,
  onNavigate,
}: {
  item: NavItem;
  current: PageId;
  onNavigate: (page: PageId) => void;
}) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={() => onNavigate(item.id)}
      className={`nav-item w-full justify-start ${current === item.id ? 'nav-item-active' : ''}`}
    >
      <Icon className={`h-4 w-4 ${item.accent ?? ''}`} />
      <span>{item.label}</span>
    </button>
  );
}

export default function Layout({ current, onNavigate, children }: Props) {
  const { user, logout, alerts, cameras, toast } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeAlerts = alerts.filter(alert => alert.status !== 'RESOLVED').length;
  const offlineCameras = cameras.filter(camera => camera.status === 'OFFLINE').length;

  const handleNavigate = (page: PageId) => {
    setMobileOpen(false);
    onNavigate(page);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(6,182,212,0.12),_transparent_28%),linear-gradient(180deg,_#020617_0%,_#07111f_100%)] text-slate-200">
      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-72 transform border-r border-white/5 bg-ink-950/95 px-4 py-5 backdrop-blur-xl transition-transform duration-200 lg:static lg:translate-x-0 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-start justify-between gap-3 border-b border-white/5 pb-4">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-accent-300">
                IBVAP
              </p>
              <h1 className="mt-1 text-lg font-semibold text-slate-100">
                Command Console
              </h1>
              <p className="text-xs text-slate-500">
                Intelligent Border Video Analytics Platform
              </p>
            </div>
            <button
              type="button"
              className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-slate-200 lg:hidden"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-red-500/15 bg-red-500/5 p-3">
              <p className="text-[10px] font-mono uppercase text-red-300">Active Alerts</p>
              <p className="mt-1 text-xl font-semibold text-slate-100">{activeAlerts}</p>
            </div>
            <div className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-3">
              <p className="text-[10px] font-mono uppercase text-amber-300">Offline Cams</p>
              <p className="mt-1 text-xl font-semibold text-slate-100">{offlineCameras}</p>
            </div>
          </div>

          <nav className="mt-5 space-y-1">
            {PRIMARY_NAV.map(item => (
              <NavButton
                key={item.id}
                item={item}
                current={current}
                onNavigate={handleNavigate}
              />
            ))}
          </nav>

          <div className="mt-6 border-t border-white/5 pt-5">
            <p className="mb-2 px-3 text-[10px] font-mono uppercase tracking-[0.25em] text-slate-500">
              Operations
            </p>
            <nav className="space-y-1">
              {SECONDARY_NAV.map(item => (
                <NavButton
                  key={item.id}
                  item={item}
                  current={current}
                  onNavigate={handleNavigate}
                />
              ))}
            </nav>
          </div>

          {user && (
            <div className="mt-6 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-100">{user.name}</p>
                  <p className="text-[10px] font-mono uppercase text-slate-500">{user.role}</p>
                </div>
                <button
                  type="button"
                  className="btn-ghost px-2 py-1 text-[10px]"
                  onClick={logout}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </aside>

        {mobileOpen && (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-black/60 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-white/5 bg-ink-950/70 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-lg border border-white/10 p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200 lg:hidden"
                  onClick={() => setMobileOpen(true)}
                >
                  <Menu className="h-4 w-4" />
                </button>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-500">
                    Unified Operations
                  </p>
                  <p className="text-sm text-slate-300">
                    Monitor detection, response, and infrastructure health from one place.
                  </p>
                </div>
              </div>

              <div className="hidden items-center gap-2 sm:flex">
                <span className="badge border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                  <span className="status-dot animate-pulse bg-emerald-400" />
                  System Online
                </span>
                <span className="badge border border-white/10 bg-white/5 text-slate-300">
                  {cameras.length} cameras
                </span>
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 py-5 sm:px-6">{children}</main>

          {toast && (
            <div className="pointer-events-none fixed bottom-4 right-4 z-50 max-w-sm">
              <div
                className={`rounded-2xl border p-4 shadow-2xl backdrop-blur-xl ${
                  toast.type === 'success'
                    ? 'border-emerald-500/30 bg-emerald-500/10'
                    : toast.type === 'warning'
                      ? 'border-amber-500/30 bg-amber-500/10'
                      : toast.type === 'alert'
                        ? 'border-red-500/30 bg-red-500/10'
                        : 'border-accent-500/30 bg-accent-500/10'
                }`}
              >
                <div className="flex items-start gap-3">
                  <TriangleAlert
                    className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                      toast.type === 'success'
                        ? 'text-emerald-300'
                        : toast.type === 'warning'
                          ? 'text-amber-300'
                          : toast.type === 'alert'
                            ? 'text-red-300'
                            : 'text-accent-300'
                    }`}
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-100">{toast.title}</p>
                    <p className="mt-1 text-xs text-slate-300">{toast.message}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
