import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './store';
import Login from './pages/Login';
import Layout, { type PageId } from './components/Layout';
import Overview from './pages/Overview';
import LiveSurveillance from './pages/LiveSurveillance';
import Cameras from './pages/Cameras';
import Events from './pages/Events';
import Alerts from './pages/Alerts';
import ANPR from './pages/ANPR';
import Zones from './pages/Zones';
import Incidents from './pages/Incidents';
import EvidenceVault from './pages/EvidenceVault';
import SystemHealth from './pages/SystemHealth';
import Audit from './pages/Audit';

function AppContent() {
  const { user, authLoading, setSelectedLiveCameraIds, activeAlarm, setActiveAlarm } = useApp();
  const [page, setPage] = useState<PageId>('overview');

  useEffect(() => {
    if (user) setPage('overview');
  }, [user]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.page) setPage(detail.page as PageId);
      if (detail?.cameraIds) setSelectedLiveCameraIds(detail.cameraIds);
      else if (detail?.cameraId) setSelectedLiveCameraIds([detail.cameraId]);
    };
    window.addEventListener('appNavigate', handler);
    return () => window.removeEventListener('appNavigate', handler);
  }, [setSelectedLiveCameraIds]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;

  const renderPage = () => {
    switch (page) {
      case 'overview':  return <Overview onNavigate={setPage} />;
      case 'live':      return <LiveSurveillance />;
      case 'alerts':    return <Alerts />;
      case 'incidents': return <Incidents />;
      case 'evidence':  return <EvidenceVault />;
      case 'cameras':   return <Cameras />;
      case 'zones':     return <Zones />;
      case 'anpr':      return <ANPR />;
      case 'audit':     return <Audit />;
      case 'health':    return <SystemHealth />;
      default:          return <Overview onNavigate={setPage} />;
    }
  };

  return (
    <>
      {/* Critical alert modal */}
      {activeAlarm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white border-2 border-red-500 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-slide-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center animate-alert-pulse">
                <span className="text-2xl">🚨</span>
              </div>
              <div>
                <p className="text-[10px] font-mono text-red-500 uppercase tracking-widest font-bold">CRITICAL ALERT</p>
                <h3 className="font-black text-slate-800 text-lg">{activeAlarm.title || 'Security Alert'}</h3>
              </div>
            </div>
            <div className="space-y-2 mb-5">
              <p className="text-sm text-slate-700">{activeAlarm.reason}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 rounded-lg p-2">
                  <p className="text-slate-400">Camera</p>
                  <p className="font-mono font-bold text-slate-700">{activeAlarm.cameraId}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-2">
                  <p className="text-red-400">Risk Score</p>
                  <p className="font-black text-red-600 text-lg">{activeAlarm.riskScore}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setActiveAlarm(null); setPage('alerts'); }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs transition-colors">
                Open Alert Center
              </button>
              <button onClick={() => setActiveAlarm(null)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 transition-colors">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <Layout current={page} onNavigate={setPage}>
        {renderPage()}
      </Layout>
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
