import { useState } from 'react';
import { useApp } from '../store';
import { Shield, Lock, User as UserIcon, Eye, EyeOff, AlertTriangle, Loader2 } from 'lucide-react';

export default function Login() {
  const { login, authError, authLoading } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setLoading(true);
    try {
      const ok = await login(username, password);
      if (!ok) setLocalError(authError || 'Authentication failed.');
    } catch {
      setLocalError('Unable to connect to backend.');
    } finally {
      setLoading(false);
    }
  };

  const error = localError || authError;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Top bar */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="India" className="h-10 select-none" />
            <div>
              <p className="text-[10px] text-orange-400 font-mono uppercase tracking-widest">Ministry of Defence</p>
              <p className="text-sm font-bold text-white">Border Security Force — IBVAP</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-mono uppercase tracking-wider">Secure Gateway</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left — Info */}
          <div className="hidden lg:block">
            <div className="mb-8">
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-orange-400 mb-2">IBVAP Platform</p>
              <h1 className="text-3xl font-black text-white leading-tight">
                Intelligent Border<br />Video Analytics
              </h1>
              <p className="text-slate-400 mt-3 text-sm leading-relaxed max-w-sm">
                AI-powered surveillance for border security. Real-time detection, tracking, virtual fencing, evidence chain, and incident investigation.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { icon: '🎯', label: 'AI Detection & Tracking', desc: 'YOLO-based real-time object detection' },
                { icon: '⚡', label: 'Instant Alerts', desc: 'Risk scoring and WebSocket notifications' },
                { icon: '🔒', label: 'SHA-256 Evidence', desc: 'Tamper-evident evidence chain' },
                { icon: '📡', label: 'Edge-First Architecture', desc: 'Offline-capable with sync on reconnect' },
              ].map(f => (
                <div key={f.label} className="flex items-start gap-3 bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
                  <span className="text-lg">{f.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{f.label}</p>
                    <p className="text-xs text-slate-400">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Login form */}
          <div>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
              <div className="h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-emerald-500" />
              <div className="p-8">
                <div className="text-center mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-slate-700 border border-slate-600 flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-7 w-7 text-orange-400" />
                  </div>
                  <h2 className="text-xl font-black text-white uppercase tracking-widest">Operator Login</h2>
                  <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Authorized personnel only</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Username</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-3 text-sm font-medium focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                        placeholder="Enter authorized ID"
                        required
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-500 rounded-xl pl-10 pr-10 py-3 text-sm font-medium focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                        placeholder="Enter secure password"
                        required
                        autoComplete="current-password"
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 bg-red-900/30 border border-red-700/50 text-red-400 rounded-lg px-3 py-2.5">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                      <p className="text-xs font-medium">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || authLoading}
                    className="w-full py-3.5 bg-orange-600 hover:bg-orange-500 disabled:bg-orange-900/50 text-white rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2.5 transition-all"
                  >
                    {(loading || authLoading) ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Authenticating...</>
                    ) : (
                      <><Shield className="h-4 w-4" /> Secure Login</>
                    )}
                  </button>
                </form>

                <p className="text-center text-[10px] text-slate-500 mt-6 uppercase tracking-widest">
                  Restricted access — All activity is audited and monitored
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
