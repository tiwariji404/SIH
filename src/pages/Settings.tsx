import { useState } from 'react';
import { useApp } from '../store';
import { Shield, Bell, Eye, Save } from 'lucide-react';

export default function Settings() {
  const { addAuditLog, showToast, demoMode, setDemoMode } = useApp();
  const [alertSound, setAlertSound] = useState(true);
  const [autoAck, setAutoAck] = useState(false);
  const [nightHours, setNightHours] = useState('22:00 - 06:00');
  const [loitering, setLoitering] = useState(60);
  const [maxPeople, setMaxPeople] = useState(5);
  const [confidence, setConfidence] = useState(75);

  const handleSave = () => {
    addAuditLog('changed system settings', `Night: ${nightHours}, Loitering: ${loitering}s, Max people: ${maxPeople}, Confidence: ${confidence}%`);
    showToast({ type: 'success', title: 'Settings Saved', message: 'System configuration has been updated.' });
  };

  return (
    <div className="space-y-4 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Settings</h1>
        <p className="text-xs text-slate-500">System configuration and detection rules</p>
      </div>

      {/* Detection rules */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Eye className="h-4 w-4 text-accent-400" /> Detection Rules
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono uppercase text-slate-600 mb-1.5">Night-Time Detection Hours</label>
            <input type="text" value={nightHours} onChange={e => setNightHours(e.target.value)} className="input" placeholder="22:00 - 06:00" />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase text-slate-600 mb-1.5">Loitering Threshold (seconds)</label>
            <input type="number" value={loitering} onChange={e => setLoitering(Number(e.target.value))} className="input" min={10} max={300} />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase text-slate-600 mb-1.5">Max People in Restricted Zone</label>
            <input type="number" value={maxPeople} onChange={e => setMaxPeople(Number(e.target.value))} className="input" min={1} max={20} />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase text-slate-600 mb-1.5">Minimum Detection Confidence (%)</label>
            <input type="range" value={confidence} onChange={e => setConfidence(Number(e.target.value))} className="w-full accent-cyan-500" min={50} max={99} />
            <p className="text-xs text-slate-400 mt-1">{confidence}%</p>
          </div>
        </div>
      </div>

      {/* System preferences */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Bell className="h-4 w-4 text-accent-400" /> System Preferences
        </h3>
        <div className="space-y-3">
          <Toggle label="Alert Sound Notifications" value={alertSound} onChange={setAlertSound} />
          <Toggle label="Auto-acknowledge Low Risk Alerts" value={autoAck} onChange={setAutoAck} />
          <Toggle label="Demo Mode (Simulated Data)" value={demoMode} onChange={setDemoMode} />
        </div>
      </div>

      {/* Architecture info */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4 text-accent-400" /> System Information
        </h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <InfoRow label="Version" value="IBVAP v1.0.0 (Prototype)" />
          <InfoRow label="AI Engine" value="YOLO + ByteTrack (Simulated)" />
          <InfoRow label="Database" value="PostgreSQL / Supabase" />
          <InfoRow label="Stream Protocol" value="RTSP / IP Camera Ready" />
          <InfoRow label="Edge Device" value="NVIDIA Jetson Compatible" />
          <InfoRow label="Deployment" value="On-Premise / Air-Gapped" />
        </div>
      </div>

      <button onClick={handleSave} className="btn-primary">
        <Save className="h-4 w-4" /> Save Settings
      </button>
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-300">{label}</span>
      <button onClick={() => onChange(!value)} className={`relative h-5 w-10 rounded-full transition-colors ${value ? 'bg-accent-500' : 'bg-slate-600'}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${value ? 'left-5' : 'left-0.5'}`} />
      </button>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-300 font-mono text-[11px]">{value}</span>
    </div>
  );
}
