import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './store';
import Login from './pages/Login';
import Layout, { type PageId } from './components/Layout';
import Overview from './pages/Overview';
import Home from './pages/Home';
import LiveSurveillance from './pages/LiveSurveillance';
import Cameras from './pages/Cameras';
import Alerts from './pages/Alerts';
import Events from './pages/Events';
import BorderMap from './pages/BorderMap';
import ANPR from './pages/ANPR';
import Tracking from './pages/Tracking';
import VirtualFences from './pages/VirtualFences';
import Analytics from './pages/Analytics';
import SystemHealth from './pages/SystemHealth';
import AuditLogs from './pages/AuditLogs';
import Reports from './pages/Reports';
import DemoCenter from './pages/DemoCenter';
import Settings from './pages/Settings';
import Innovation from './pages/Innovation';
import FaceDetection from './pages/FaceDetection';
import { Shield, Target, MapPin, Key, UserIcon, CheckCircle2 } from 'lucide-react';

let globalMockUsers = [
  { id: '1', name: 'Alok Singh', username: 'alok_admin', location: 'Raipur HQ', role: 'Sub-Admin', date: '2026-08-25' },
  { id: '2', name: 'Priya Sharma', username: 'priya_04', location: 'Delhi Control', role: 'Sub-Admin', date: '2026-08-26' },
  { id: '3', name: 'Raj Kumar', username: 'raj_op', location: 'Jammu Sector', role: 'Operator', date: '2026-08-25' },
  { id: '4', name: 'Anita Das', username: 'anita_op', location: 'Kashmir Sector', role: 'Operator', date: '2026-08-26' }
];

function AssignUser({ roleLabel, actionUrl }: { roleLabel: string; actionUrl: string }) {
  const [formData, setFormData] = useState({ name: '', username: '', password: '', location: '', role: roleLabel });
  const [users, setUsers] = useState<any[]>(globalMockUsers);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser = {
      id: Math.random().toString(),
      name: formData.name,
      username: formData.username,
      location: formData.location,
      role: roleLabel,
      date: new Date().toISOString().split('T')[0]
    };
    globalMockUsers = [newUser, ...globalMockUsers];
    setUsers(globalMockUsers);
    setFormData({ name: '', username: '', password: '', location: '', role: roleLabel });
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Form */}
        <div className="lg:col-span-5">
          <div className="card p-6 border-slate-200 bg-white">
            <h2 className="text-xl font-black text-slate-800 mb-6 border-b border-slate-200 pb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-orange-600" />
              Assign New {roleLabel}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                  <input 
                    type="text" 
                    className="input pl-10"
                    placeholder="e.g. Ramesh Kumar"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">User ID / Username</label>
                <div className="relative">
                  <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                  <input 
                    type="text" 
                    className="input pl-10"
                    placeholder="Enter unique ID"
                    value={formData.username}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Location / Control Room</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                  <input 
                    type="text" 
                    className="input pl-10"
                    placeholder="e.g. Raipur, Sector 4"
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Password</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                  <input 
                    type="password" 
                    className="input pl-10"
                    placeholder="Secure password"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Assign Post</label>
                <input 
                  type="text" 
                  className="input opacity-50 cursor-not-allowed font-bold text-orange-400"
                  value={roleLabel}
                  disabled
                />
              </div>

              <div className="pt-4 border-t border-slate-200 mt-2">
                <button type="submit" className="btn-primary w-full shadow-lg">
                  Confirm & Authorize
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: List */}
        <div className="lg:col-span-7">
          <div className="card p-6 h-full flex flex-col bg-white border-slate-200">
            <h2 className="text-xl font-black text-slate-800 mb-6 border-b border-slate-200 pb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Active {roleLabel} Personnel
            </h2>
            <div className="flex-1 overflow-auto space-y-3 pr-2">
              {users.filter(u => u.role === roleLabel).map((u) => (
                <div key={u.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-orange-500/10 text-orange-400 font-bold text-lg">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">{u.name}</h3>
                      <p className="text-xs text-slate-600 font-mono">@{u.username}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <MapPin className="h-3 w-3 text-red-400" />
                      {u.location}
                    </div>
                    <p className="text-[10px] text-slate-600 mt-1">Added: {u.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function AppContent() {
  const { user } = useApp();
  const [page, setPage] = useState<PageId>('home');

  useEffect(() => {
    if (user) {
      setPage('home');
    }
  }, [user]);

  if (!user) return <Login />;

  // Restrict access based on role (Admin, sub_admin, operator)
  const isOperator = user.role === 'operator';
  const isSubAdmin = user.role === 'sub_admin';

  let activePage = page;

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <Home />;
      case 'overview': 
        return <Overview onNavigate={setPage} />;
      case 'live': return <LiveSurveillance />;
      case 'cameras': return <Cameras />;
      case 'alerts': return <Alerts />;
      case 'events': return <Events />;
      case 'map': return <BorderMap />;
      case 'anpr': return <ANPR />;
      case 'tracking': return <Tracking />;
      case 'fences': return <VirtualFences />;
      case 'analytics': return <Analytics />;
      case 'health': return <SystemHealth />;
      case 'audit': return <AuditLogs />;
      case 'reports': return <Reports />;
      case 'demo': return <DemoCenter />;
      case 'settings': return <Settings />;
      case 'innovation': return <Innovation />;
      case 'faces': return <FaceDetection />;
      case 'assign_sub_admin': return <AssignUser roleLabel="Sub-Admin" actionUrl="/api/v1/users" />;
      case 'assign_operator': return <AssignUser roleLabel="Operator" actionUrl="/api/v1/users" />;
      default: return <Home />;
    }
  };

  return (
    <Layout current={page} onNavigate={setPage}>
      {renderPage()}
    </Layout>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
