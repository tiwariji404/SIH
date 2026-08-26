import { useState } from 'react';
import { AppProvider, useApp } from './store';
import Login from './pages/Login';
import Layout, { type PageId } from './components/Layout';
import Overview from './pages/Overview';
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

function AppContent() {
  const { user } = useApp();
  const [page, setPage] = useState<PageId>('overview');

  if (!user) return <Login />;

  // Restrict access based on role (Admin, sub_admin, operator)
  const isOperator = user.role === 'operator';
  const isSubAdmin = user.role === 'sub_admin';

  const renderPage = () => {
    switch (page) {
      case 'overview': 
        if (isOperator) return <LiveSurveillance />; 
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
      default: return <Overview onNavigate={setPage} />;
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
