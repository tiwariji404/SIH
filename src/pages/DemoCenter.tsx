import { useApp } from '../store';
import { Zap, Play, Square, Radio, AlertTriangle, Moon, Eye, Car, Cctv, Activity } from 'lucide-react';

interface DemoScenario {
  id: string;
  title: string;
  description: string;
  icon: typeof Zap;
  color: string;
  action: () => void;
}

export default function DemoCenter() {
  const { startLiveDemo, stopLiveDemo, liveDemoRunning, setCameraScenario, triggerCameraOffline, cameras, showToast } = useApp();

  const scenarios: DemoScenario[] = [
    {
      id: 'normal',
      title: 'Normal Monitoring',
      description: 'Normal people and vehicle movement across all cameras.',
      icon: Activity,
      color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5',
      action: () => {
        cameras.forEach(c => setCameraScenario(c.id, 'normal'));
        showToast({ type: 'info', title: 'Scenario: Normal', message: 'All cameras set to normal monitoring.' });
      },
    },
    {
      id: 'intrusion',
      title: 'Border Intrusion',
      description: 'A person crosses a virtual fence at BOP-04 (Restricted Zone).',
      icon: AlertTriangle,
      color: 'text-red-400 border-red-500/30 bg-red-500/5',
      action: () => {
        setCameraScenario('BOP-04', 'intrusion');
        showToast({ type: 'alert', title: 'Scenario: Border Intrusion', message: 'BOP-04 set to intrusion scenario. Watch the Live Surveillance page.' });
      },
    },
    {
      id: 'night',
      title: 'Night Intrusion',
      description: 'A person enters a restricted zone at night. Low-light detection.',
      icon: Moon,
      color: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/5',
      action: () => {
        setCameraScenario('BOP-06', 'night');
        showToast({ type: 'alert', title: 'Scenario: Night Intrusion', message: 'BOP-06 set to night movement scenario.' });
      },
    },
    {
      id: 'loitering',
      title: 'Suspicious Loitering',
      description: 'A person remains in a restricted zone for an extended period.',
      icon: Eye,
      color: 'text-amber-400 border-amber-500/30 bg-amber-500/5',
      action: () => {
        setCameraScenario('BOP-04', 'suspicious');
        showToast({ type: 'warning', title: 'Scenario: Loitering', message: 'BOP-04 set to suspicious loitering scenario.' });
      },
    },
    {
      id: 'watchlist',
      title: 'Watchlisted Vehicle',
      description: 'A vehicle with a fictional watchlist plate enters camera view.',
      icon: Car,
      color: 'text-orange-400 border-orange-500/30 bg-orange-500/5',
      action: () => {
        setCameraScenario('BOP-02', 'anpr');
        showToast({ type: 'alert', title: 'Scenario: Watchlist Vehicle', message: 'BOP-02 set to ANPR scenario. Watch for watchlist plate.' });
      },
    },
    {
      id: 'failure',
      title: 'Camera Failure',
      description: 'BOP-06 suddenly goes offline. Generates a camera-offline alert.',
      icon: Cctv,
      color: 'text-red-400 border-red-500/30 bg-red-500/5',
      action: () => {
        triggerCameraOffline('BOP-06');
      },
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Demo Center</h1>
        <p className="text-xs text-slate-500">Launch realistic surveillance scenarios with one click</p>
      </div>

      {/* Live Demo banner */}
      <div className={`card p-5 border-2 ${liveDemoRunning ? 'border-red-500/40 bg-red-500/5' : 'border-accent-500/20 bg-accent-500/5'}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${liveDemoRunning ? 'bg-red-500/20' : 'bg-accent-500/20'}`}>
              {liveDemoRunning ? <Radio className="h-6 w-6 text-red-400 animate-pulse" /> : <Zap className="h-6 w-6 text-accent-400" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Live Demo: Border Intrusion Sequence</h2>
              <p className="text-xs text-slate-500">
                {liveDemoRunning
                  ? 'Demo running... Watch alerts appear in real-time.'
                  : 'Runs the complete DETECT → TRACK → ANALYZE → DECIDE → ALERT → RESPOND sequence over ~16 seconds.'}
              </p>
            </div>
          </div>
          {liveDemoRunning ? (
            <button onClick={stopLiveDemo} className="btn-danger">
              <Square className="h-4 w-4" /> Stop Demo
            </button>
          ) : (
            <button onClick={startLiveDemo} className="btn-primary">
              <Play className="h-4 w-4" /> Start Live Demo
            </button>
          )}
        </div>

        {/* Demo steps preview */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2">
          {[
            '1. Person Detected',
            '2. Object Tracked',
            '3. Zone Entry',
            '4. Fence Crossed',
            '5. Critical Alert',
          ].map((step, i) => (
            <div key={i} className={`text-center text-[10px] font-mono px-2 py-1.5 rounded-lg ${liveDemoRunning ? 'bg-red-500/10 text-red-300' : 'bg-white/5 text-slate-500'}`}>
              {step}
            </div>
          ))}
        </div>
      </div>

      {/* Scenario cards */}
      <div>
        <h3 className="text-sm font-semibold text-slate-200 mb-3">Individual Scenarios</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {scenarios.map(s => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={s.action}
                className={`card card-hover p-4 text-left border ${s.color} disabled:opacity-50`}
                disabled={liveDemoRunning}
              >
                <Icon className="h-6 w-6 mb-3" />
                <h4 className="text-sm font-semibold text-slate-100 mb-1">{s.title}</h4>
                <p className="text-[11px] text-slate-500">{s.description}</p>
                <div className="mt-3 flex items-center gap-1 text-[10px] font-mono text-accent-400">
                  <Play className="h-3 w-3" /> Launch
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Demo flow guide */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-3">Final Demo Flow (3-5 minutes)</h3>
        <div className="space-y-1.5 text-xs text-slate-400">
          {[
            'Login as Operator → Open Overview → Show 8+ active cameras',
            'Open Live Surveillance → Select BOP Delta → Start "Border Intrusion" scenario',
            'Show person detection → Tracking ID P-104 → Person crosses virtual fence',
            'Risk score changes LOW → HIGH → CRITICAL → Critical alert appears instantly',
            'Operator opens alert → Shows why it was generated → Acknowledge',
            'Open Event Timeline → Open Border Map → Show BOP Delta as red',
            'Open Analytics → Show today\'s intrusion statistics',
            'Open Camera Health → Simulate BOP-06 going offline → Show camera-offline alert',
            'Open Audit Logs → Generate incident report',
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-accent-400 font-mono flex-shrink-0">{String(i + 1).padStart(2, '0')}.</span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
