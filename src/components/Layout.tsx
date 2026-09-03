import { useState, type ReactNode } from 'react';
import {
  Camera,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Radio,
  ScanFace,
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
  | 'events'
  | 'anpr'
  | 'tracking'
  | 'fences'
  | 'faces'
  | 'suspicious'
  | 'people'
  | 'camera_health'
  | 'vehicles'
  | 'intrusions';

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

const NAV_ITEMS: Record<string, NavItem> = {
  overview: { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
  fences: { id: 'fences', label: 'Virtual Fencing', icon: Shield },
  anpr: { id: 'anpr', label: 'ANPR (Insert Capture)', icon: TrafficCone },
  live: { id: 'live', label: 'Live Surveillance', icon: Radio, accent: 'text-red-500' },
  events: { id: 'events', label: 'Event Log', icon: FileText },
  cameras: { id: 'cameras', label: 'Recording', icon: Camera },
  faces: { id: 'faces', label: 'Face Detection', icon: ScanFace },
  tracking: { id: 'tracking', label: 'Object Tracking', icon: Target },
};

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
  const { user, logout, toast } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavigate = (page: PageId) => {
    setMobileOpen(false);
    onNavigate(page);
  };
  
  // The user is exclusively an Operator now. No need for complex role logic.
  const PRIMARY_NAV = [
    NAV_ITEMS.overview,
    NAV_ITEMS.fences,
    NAV_ITEMS.anpr,
    NAV_ITEMS.live,
    NAV_ITEMS.tracking,
    NAV_ITEMS.faces,
    NAV_ITEMS.cameras,
    NAV_ITEMS.events
  ];

  return (
    <div className="h-screen bg-tactical text-slate-800 font-sans relative overflow-hidden">
      <div className="flex h-screen overflow-hidden">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-72 transform border-r border-slate-200 bg-white px-4 py-5 transition-transform duration-200 lg:static lg:translate-x-0 shadow-xl overflow-y-auto ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4 relative">
            <div className="absolute top-[-20px] left-[-16px] right-[-16px] h-[5px] bg-gradient-to-r from-orange-500 via-green-500 to-green-600 opacity-90"></div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-orange-600 font-extrabold">
                IBVAP
              </p>
              <h1 className="mt-1 text-lg font-black text-slate-800 tracking-tight uppercase">
                Operator Console
              </h1>
              <p className="text-xs font-bold text-slate-600 mt-1 uppercase tracking-wider">
                Border Security Force
              </p>
            </div>
            <button
              type="button"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-800 lg:hidden"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
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

          {user && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-slate-800">{user.name}</p>
                  <p className="text-[10px] font-bold uppercase text-orange-600 tracking-widest mt-0.5">Operator</p>
                </div>
                <button
                  type="button"
                  className="btn-ghost px-2 py-1 text-[10px] hover:text-red-600 hover:bg-red-50"
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

        <div className="flex h-full min-w-0 flex-1 flex-col overflow-y-auto bg-slate-50">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-800 lg:hidden"
                  onClick={() => setMobileOpen(true)}
                >
                  <Menu className="h-4 w-4" />
                </button>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-orange-600">
                    Live Status
                  </p>
                  <p className="text-sm font-semibold text-slate-600">
                    Tactical surveillance & monitoring active.
                  </p>
                </div>
              </div>

              <div className="hidden items-center gap-2 sm:flex">
                <span className="badge border border-green-200 bg-green-50 text-green-700">
                  <span className="status-dot animate-pulse bg-green-500" />
                  System Secure
                </span>
                <span className="badge border border-slate-200 bg-white text-slate-600 shadow-sm">
                  Full Camera Access
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
                    <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
                    <p className="mt-1 text-xs text-slate-700">{toast.message}</p>
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
