import { Shield, Cpu, Eye, Radio, Gauge, Layers, Heart, Zap } from 'lucide-react';

export default function Innovation() {
  const innovations = [
    {
      icon: Shield,
      title: 'Software-First Surveillance',
      desc: 'No need for expensive smart cameras. IBVAP adds an AI brain to existing CCTV infrastructure.',
      color: 'text-accent-400 bg-accent-500/10',
    },
    {
      icon: Cpu,
      title: 'Edge AI',
      desc: 'Suitable for remote border locations. Process video locally on edge devices like NVIDIA Jetson.',
      color: 'text-blue-400 bg-blue-500/10',
    },
    {
      icon: Eye,
      title: 'Explainable Alerts',
      desc: 'Every alert shows its reason. No black-box decisions — operators understand why each alert fired.',
      color: 'text-emerald-400 bg-emerald-500/10',
    },
    {
      icon: Radio,
      title: 'Multi-Camera Intelligence',
      desc: 'Track objects across cameras. A person moving BOP-04 → BOP-05 → BOP-06 is tracked as one identity.',
      color: 'text-purple-400 bg-purple-500/10',
    },
    {
      icon: Gauge,
      title: 'Risk Scoring',
      desc: 'Prioritize important events with a 0-100 risk score. Combine signals for accurate threat assessment.',
      color: 'text-orange-400 bg-orange-500/10',
    },
    {
      icon: Layers,
      title: 'Unified Platform',
      desc: 'Person + vehicle + ANPR + intrusion + analytics in one system. No fragmented tools.',
      color: 'text-amber-400 bg-amber-500/10',
    },
    {
      icon: Heart,
      title: 'Camera Health',
      desc: 'Detect surveillance infrastructure failures. Know immediately when a camera goes offline.',
      color: 'text-red-400 bg-red-500/10',
    },
    {
      icon: Zap,
      title: 'Real-Time Response',
      desc: 'Sub-second alert delivery. WebSocket-ready architecture for instant command center updates.',
      color: 'text-cyan-400 bg-cyan-500/10',
    },
  ];

  const architecture = [
    { step: 'CCTV Camera', desc: 'Existing IP-based cameras at BOPs, check posts, border roads', icon: Shield },
    { step: 'Edge AI Device', desc: 'NVIDIA Jetson or similar edge computer processes video locally', icon: Cpu },
    { step: 'Detection', desc: 'YOLO object detection: people, vehicles, faces, plates', icon: Eye },
    { step: 'Tracking', desc: 'ByteTrack/DeepSORT assigns persistent tracking IDs', icon: Radio },
    { step: 'Event Intelligence', desc: 'Rule-based behavior analysis and risk scoring', icon: Gauge },
    { step: 'Metadata Only', desc: 'Only events/metadata sent to central command — not raw video', icon: Layers },
    { step: 'Command Center', desc: 'Unified dashboard for monitoring, alerts, and analytics', icon: Zap },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Innovation</h1>
        <p className="text-xs text-slate-500">What makes IBVAP different from traditional surveillance</p>
      </div>

      {/* Core message */}
      <div className="card p-6 border-accent-500/20 bg-gradient-to-br from-accent-500/5 to-transparent">
        <div className="text-center">
          <p className="text-lg font-bold text-slate-100 mb-2">
            "We are not replacing existing CCTV infrastructure."
          </p>
          <p className="text-lg font-bold text-accent-400">
            "We are adding an AI brain to it."
          </p>
          <div className="mt-4 inline-flex items-center gap-3 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
            <span className="text-sm text-slate-300">Existing Infrastructure</span>
            <span className="text-accent-400 font-bold">+</span>
            <span className="text-sm text-slate-300">AI Software</span>
            <span className="text-accent-400 font-bold">=</span>
            <span className="text-sm font-bold text-emerald-400">Intelligent Border Surveillance</span>
          </div>
        </div>
      </div>

      {/* Innovation cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {innovations.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="card card-hover p-4">
              <div className={`p-2.5 rounded-lg ${item.color} inline-block mb-3`}>
                <Icon className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-semibold text-slate-100 mb-1">{item.title}</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Architecture flow */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-4">Edge AI Architecture</h3>
        <div className="space-y-2">
          {architecture.map((a, i) => {
            const Icon = a.icon;
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent-500/10 border border-accent-500/20">
                    <Icon className="h-5 w-5 text-accent-400" />
                  </div>
                  {i < architecture.length - 1 && <div className="w-0.5 h-6 bg-accent-500/20" />}
                </div>
                <div className="flex-1 pb-2">
                  <p className="text-sm font-medium text-slate-200">{a.step}</p>
                  <p className="text-[11px] text-slate-500">{a.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Lower Bandwidth', value: 'Only metadata sent' },
          { label: 'Lower Latency', value: 'Local processing' },
          { label: 'Reduced Cloud Cost', value: 'No video upload' },
          { label: 'Better Remote Ops', value: 'Works offline' },
          { label: 'Modular Design', value: 'Swap AI models' },
        ].map((b, i) => (
          <div key={i} className="card p-3 text-center">
            <p className="text-xs font-semibold text-accent-400">{b.label}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{b.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
