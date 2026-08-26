import { useState } from 'react';
import { useApp } from '../store';
import { Shield, Lock, User as UserIcon, Eye, EyeOff, AlertCircle, Radio } from 'lucide-react';

export default function Login() {
  const { login } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const ok = await login(username, password);
      if (!ok) {
        setError('Invalid credentials. Access denied.');
      }
    } catch (err: any) {
      setError('Invalid credentials. Access denied.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-ink-950 flex items-center justify-center p-4">
      {/* Background grid */}
      <div className="absolute inset-0 grid-overlay opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-br from-accent-900/10 via-transparent to-brand-900/10" />

      {/* Animated radar sweep */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-accent-500/5 animate-pulse-slow" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-accent-500/5" />

      {/* Floating status indicators */}
      <div className="absolute top-8 left-8 flex items-center gap-2 text-[10px] font-mono text-slate-600">
        <Radio className="h-3 w-3 animate-pulse" />
        SECURE CHANNEL ESTABLISHED
      </div>
      <div className="absolute top-8 right-8 flex items-center gap-2 text-[10px] font-mono text-slate-600">
        <span className="status-dot bg-emerald-400 animate-pulse" />
        SYSTEM ONLINE
      </div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-mono text-slate-700">
        MINISTRY OF HOME AFFAIRS / SASHASTRA SEEMA BAL
      </div>

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="glass-strong rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="mb-8 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-500/15 border border-accent-500/30 mb-4">
              <Shield className="h-8 w-8 text-accent-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-wider">IBVAP</h1>
            <p className="text-xs text-slate-500 mt-1">Intelligent Border Video Analytics Platform</p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-500/10 border border-accent-500/20">
              <span className="status-dot bg-accent-400 animate-pulse" />
              <span className="text-[9px] font-mono text-accent-300">SECURE ACCESS GATEWAY</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">Username</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="input pl-10"
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input pl-10 pr-10"
                  placeholder="Enter password"
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="rounded border-white/20 bg-ink-900 text-accent-500 focus:ring-accent-500/30" />
              <span className="text-xs text-slate-400">Remember session</span>
            </label>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30">
                <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-300">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5"
            >
              {loading ? (
                <>
                  <Radio className="h-4 w-4 animate-pulse" />
                  AUTHENTICATING...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  SECURE LOGIN
                </>
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 pt-5 border-t border-white/5">
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-600 mb-2 text-center">Demo Access Credentials</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { role: 'Admin', u: 'admin', p: 'admin123', color: 'text-accent-300' },
                { role: 'Operator', u: 'operator', p: 'operator123', color: 'text-emerald-300' },
                { role: 'Commander', u: 'commander', p: 'commander123', color: 'text-amber-300' },
              ].map(acc => (
                <button
                  key={acc.role}
                  onClick={() => quickLogin(acc.u, acc.p)}
                  className="text-center px-2 py-2 rounded-lg bg-white/5 border border-white/5 hover:border-white/15 transition-colors"
                >
                  <p className={`text-[10px] font-mono ${acc.color}`}>{acc.role}</p>
                  <p className="text-[9px] text-slate-600 mt-0.5">{acc.u}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-[10px] text-slate-700 font-mono">
          PROTOTYPE / DEMO MODE — ALL DATA IS FICTIONAL
        </p>
      </div>
    </div>
  );
}
