import { useEffect, useState } from 'react';
import { useApp } from '../store';
import { Activity, Database, HardDrive, Server, Wifi, WifiOff, RefreshCw, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';

export default function SystemHealth() {
  const { health, refreshAll } = useApp();
  const [backendPing, setBackendPing] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);

  const checkHealth = async () => {
    setChecking(true);
    const start = Date.now();
    try {
      await api.health();
      setBackendPing(Date.now() - start);
    } catch {
      setBackendPing(null);
    }
    await refreshAll();
    setChecking(false);
  };

  useEffect(() => { checkHealth(); }, []);

  const services = [
    { label: 'FastAPI Backend', value: backendPing !== null ? 'healthy' : 'offline', icon: Server, detail: backendPing ? `${backendPing}ms` : 'No response' },
    { label: 'PostgreSQL', value: health?.database, icon: Database, detail: health?.database === 'healthy' ? 'Connected' : 'Unavailable' },
    { label: 'MinIO Storage', value: health?.storage, icon: HardDrive, detail: health?.storage === 'healthy' ? 'Connected' : health?.storage || 'Unknown' },
    { label: 'Redis Cache', value: health?.redis, icon: Activity, detail: health?.redis === 'offline' ? 'Not configured / offline' : health?.redis || 'Unknown' },
  ];

  const statusIcon = (v?: string | null) => {
    if (!v || v === 'offline' || v === 'unhealthy') return <XCircle className="h-4 w-4 text-red-500" />;
    if (v === 'healthy') return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  };

  const overallOk = services.every(s =>
    s.value === 'healthy' || s.label === 'Redis Cache'
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" /> System Health
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Real-time service status and infrastructure diagnostics</p>
        </div>
        <button onClick={checkHealth} disabled={checking}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors disabled:opacity-50">
          <RefreshCw className={`h-3.5 w-3.5 ${checking ? 'animate-spin' : ''}`} />
          {checking ? 'Checking...' : 'Refresh'}
        </button>
      </div>

      {/* Overall status banner */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-bold ${
        overallOk ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'
      }`}>
        {overallOk ? <Wifi className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
        {overallOk ? 'All critical systems operational' : 'System degraded — check services below'}
        {health?.version && <span className="ml-auto text-xs font-mono opacity-60">{health.version}</span>}
      </div>

      {/* Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map(svc => {
          const Icon = svc.icon;
          const isOk = svc.value === 'healthy';
          const isDeg = svc.value && svc.value !== 'healthy' && svc.value !== 'offline';
          return (
            <div key={svc.label} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isOk ? 'bg-emerald-50' : isDeg ? 'bg-amber-50' : 'bg-red-50'}`}>
                  <Icon className={`h-5 w-5 ${isOk ? 'text-emerald-500' : isDeg ? 'text-amber-500' : 'text-red-500'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {statusIcon(svc.value)}
                    <p className="text-sm font-bold text-slate-800">{svc.label}</p>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{svc.detail}</p>
                </div>
                <span className={`text-xs font-black px-2 py-1 rounded ${isOk ? 'text-emerald-700 bg-emerald-50' : isDeg ? 'text-amber-700 bg-amber-50' : 'text-red-600 bg-red-50'}`}>
                  {svc.value?.toUpperCase() || '—'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edge sync */}
      {health && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <Wifi className="h-4 w-4 text-purple-500" /> Edge Synchronization
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-black text-slate-800">{health.edge_sync_queue}</p>
              <p className="text-xs text-slate-400 mt-0.5">Events pending sync</p>
            </div>
            <div className={`px-4 py-2 rounded-xl font-bold text-sm ${
              health.edge_sync_queue === 0
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-orange-50 text-orange-700 border border-orange-200'
            }`}>
              {health.edge_sync_queue === 0 ? 'SYNCED' : 'PENDING SYNC'}
            </div>
          </div>
          {health.edge_sync_queue > 0 && (
            <p className="text-xs text-slate-500 mt-2">
              ⚠️ Events queued locally. Will sync automatically when Central is reachable.
            </p>
          )}
        </div>
      )}

      {/* Limitations note */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">System Notes</h3>
        <ul className="space-y-1.5 text-xs text-slate-600">
          <li>• <strong>Face Identification:</strong> Prototype available — production GPU model not deployed</li>
          <li>• <strong>Blockchain Ledger:</strong> Prototype tamper-evident local ledger (not Ethereum/Polygon)</li>
          <li>• <strong>ANPR OCR:</strong> CPU-mode easyocr — GPU model for real-world plate recognition recommended</li>
          <li>• <strong>RTSP Streams:</strong> Live demo video feed; physical CCTV integration pending hardware</li>
        </ul>
      </div>
    </div>
  );
}
