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
    <div className="relative min-h-screen w-full overflow-hidden bg-tactical flex items-center justify-center p-4">
      {/* Background grid */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-green-600/10" />

      {/* Animated radar sweep */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-orange-500/10 animate-pulse-slow object-cover" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-green-500/10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full border border-white/5" />

      {/* Floating status indicators */}
      <div className="absolute top-8 left-8 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        <Radio className="h-3 w-3 animate-pulse" />
        SECURE CHANNEL ESTABLISHED
      </div>
      <div className="absolute top-8 right-8 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        <span className="status-dot bg-green-500 animate-pulse" />
        SYSTEM ONLINE
      </div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-600 tracking-[0.2em] uppercase">
        Centralized Defense Command
      </div>

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="glass-strong rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-white to-green-600"></div>
          {/* Logo */}
          <div className="mb-8 text-center relative z-10">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900/50 border border-slate-700/50 shadow-inner mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-widest uppercase">IBVAP Core</h1>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">Border Security Force</p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-950/40 border border-green-500/30">
              <span className="status-dot bg-green-500 animate-pulse" />
              <span className="text-[9px] font-bold tracking-wider text-green-400 uppercase">Secure Gateway</span>
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
                  className="input pl-10 bg-slate-900/50"
                  placeholder="Enter authorized ID"
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
                  className="input pl-10 pr-10 bg-slate-900/50"
                  placeholder="Enter secure password"
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="rounded border-slate-700 bg-slate-900 text-orange-500 focus:ring-orange-500/30" />
              <span className="text-xs text-slate-400">Remember user session</span>
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
          <div className="mt-6 pt-5 border-t border-slate-700/50">
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-2 text-center">Select Role</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { role: 'Admin', u: 'admin', p: 'admin123', color: 'text-orange-400 border-orange-500/30' },
                { role: 'Sub-Admin', u: 'sub-admin', p: 'sub-admin123', color: 'text-white border-white/30' },
                { role: 'Operator', u: 'operator', p: 'operator123', color: 'text-green-400 border-green-500/30' },
              ].map(acc => (
                <button
                  key={acc.role}
                  onClick={() => quickLogin(acc.u, acc.p)}
                  className={`text-center px-2 py-2 rounded-lg bg-slate-900/50 border ${acc.color.split(' ')[1]} hover:bg-slate-800 transition-colors`}
                >
                  <p className={`text-[10px] font-bold ${acc.color.split(' ')[0]}`}>{acc.role}</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">{acc.u}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-[10px] text-slate-600 font-mono tracking-widest uppercase">
          MINISTRY OF HOME AFFAIRS • GOVERNMENT OF INDIA
        </p>
      </div>
    </div>
  );
}
