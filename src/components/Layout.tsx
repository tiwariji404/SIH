import { useState, type ReactNode } from 'react';
import {
  LayoutDashboard, Radio, Bell, FolderOpen, Archive,
  Camera, Shield, Car, ClipboardList, Activity,
  LogOut, Menu, X, TriangleAlert, CheckCircle2, AlertTriangle, Info,
  Wifi, WifiOff, RefreshCw,
} from 'lucide-react';
import { useApp, type ToastMsg } from '../store';

export type PageId =
  | 'overview'
  | 'live'
  | 'alerts'
  | 'incidents'
  | 'evidence'
  | 'cameras'
  | 'zones'
  | 'anpr'
  | 'audit'
  | 'health';

interface NavItem { id: PageId; label: string; icon: typeof LayoutDashboard; accent?: string; badge?: number; }
interface Props { current: PageId; onNavigate: (p: PageId) => void; children: ReactNode; }

export default function Layout({ current, onNavigate, children }: Props) {
  const { user, logout, toast, alerts, health } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL' && a.status === 'NEW').length;
  const newAlerts = alerts.filter(a => a.status === 'NEW').length;

  const NAV: NavItem[] = [
    { id: 'overview',   label: 'Overview',        icon: LayoutDashboard },
    { id: 'live',       label: 'Live Monitor',     icon: Radio,          accent: 'text-red-500' },
    { id: 'alerts',     label: 'Alert Center',     icon: Bell,           accent: criticalCount > 0 ? 'text-red-500' : undefined, badge: newAlerts || undefined },
    { id: 'incidents',  label: 'Incidents',        icon: FolderOpen },
    { id: 'evidence',   label: 'Evidence Vault',   icon: Archive },
    { id: 'cameras',    label: 'Cameras',          icon: Camera },
    { id: 'zones',      label: 'Virtual Fences',   icon: Shield },
    { id: 'anpr',       label: 'ANPR',             icon: Car },
    { id: 'audit',      label: 'Audit / History',  icon: ClipboardList },
    { id: 'health',     label: 'System Health',    icon: Activity },
  ];

  const handleNav = (id: PageId) => { setMobileOpen(false); onNavigate(id); };

  return (
    <div className="h-screen bg-slate-100 flex overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 flex flex-col transform transition-transform duration-200 lg:static lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Brand */}
        <div className="px-4 py-4 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-orange-400 font-bold">IBVAP</p>
              <h1 className="text-sm font-black text-white tracking-tight mt-0.5">Operator Console</h1>
              <p className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-wider">Border Security Force</p>
            </div>
            <button type="button" className="text-slate-400 hover:text-white lg:hidden" onClick={() => setMobileOpen(false)}>
              <X className="h-4 w-4" />
            </button>
          </div>
          {/* System status pill */}
          <div className={`mt-3 flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-semibold ${health?.status === 'healthy' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-700/30' : 'bg-red-900/30 text-red-400 border border-red-700/30'}`}>
            {health?.status === 'healthy' ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {health?.status === 'healthy' ? 'CENTRAL ONLINE' : health ? 'SYSTEM DEGRADED' : 'CONNECTING...'}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(item => {
            const Icon = item.icon;
            const active = current === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  active
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 flex-shrink-0 ${active ? 'text-white' : (item.accent ?? '')}`} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User */}
        {user && (
          <div className="px-3 py-4 border-t border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                {(user.name || user.username)?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{user.name || user.username}</p>
                <p className="text-[9px] text-orange-400 uppercase tracking-wider font-semibold">{user.role_name || user.role}</p>
              </div>
              <button type="button" onClick={logout} className="text-slate-400 hover:text-red-400 transition-colors" title="Logout">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Backdrop */}
      {mobileOpen && (
        <button type="button" className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
          <div className="flex items-center justify-between px-4 py-3 gap-3">
            <div className="flex items-center gap-3">
              <button type="button" className="text-slate-500 lg:hidden" onClick={() => setMobileOpen(true)}>
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <p className="text-[9px] font-mono uppercase tracking-widest text-orange-600 font-bold">Live Status</p>
                <p className="text-sm font-semibold text-slate-700">Tactical surveillance active</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {criticalCount > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-bold animate-pulse">
                  <TriangleAlert className="h-3.5 w-3.5" />
                  {criticalCount} CRITICAL
                </span>
              )}
              <span className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${health?.status === 'healthy' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${health?.status === 'healthy' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                {health?.status === 'healthy' ? 'System Secure' : 'Checking...'}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5">
          {children}
        </main>
      </div>

      {/* Toast */}
      {toast && <ToastNotification toast={toast} />}
    </div>
  );
}

function ToastNotification({ toast }: { toast: ToastMsg }) {
  const icons = {
    success: <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />,
    alert: <TriangleAlert className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />,
    info: <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />,
  };
  const styles = {
    success: 'border-emerald-200 bg-emerald-50',
    warning: 'border-amber-200 bg-amber-50',
    alert: 'border-red-200 bg-red-50',
    info: 'border-blue-200 bg-blue-50',
  };
  return (
    <div className="fixed bottom-5 right-5 z-50 w-80 animate-slide-in pointer-events-none">
      <div className={`rounded-xl border p-4 shadow-lg ${styles[toast.type]}`}>
        <div className="flex items-start gap-3">
          {icons[toast.type]}
          <div>
            <p className="text-sm font-bold text-slate-800">{toast.title}</p>
            <p className="text-xs text-slate-600 mt-0.5">{toast.message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
