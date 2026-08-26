import { useApp } from '../store';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadialBarChart, RadialBar,
} from 'recharts';
import { TrendingUp, Users, Car, Clock, Activity } from 'lucide-react';

export default function Analytics() {
  const { events, cameras, vehicles } = useApp();

  const hourlyData = Array.from({ length: 24 }, (_, h) => ({
    hour: `${String(h).padStart(2, '0')}h`,
    people: Math.floor(Math.abs(Math.sin(h / 3) * 20) + Math.random() * 10),
    vehicles: Math.floor(Math.abs(Math.cos(h / 4) * 12) + Math.random() * 6),
  alerts: Math.floor(Math.abs(Math.sin(h / 5) * 5) + Math.random() * 3),
  }));

  const dailyIntrusions = Array.from({ length: 7 }, (_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    intrusions: Math.floor(Math.random() * 8) + 1,
    resolved: Math.floor(Math.random() * 6) + 1,
  }));

  const cameraUptime = cameras.slice(0, 8).map(c => ({
    name: c.id,
    uptime: c.health,
    fill: c.health > 90 ? '#10b981' : c.health > 70 ? '#f59e0b' : '#ef4444',
  }));

  const severityData = [
    { name: 'LOW', value: events.filter(e => e.severity === 'LOW').length, color: '#10b981' },
    { name: 'MEDIUM', value: events.filter(e => e.severity === 'MEDIUM').length, color: '#f59e0b' },
    { name: 'HIGH', value: events.filter(e => e.severity === 'HIGH').length, color: '#f97316' },
    { name: 'CRITICAL', value: events.filter(e => e.severity === 'CRITICAL').length, color: '#ef4444' },
  ];

  const vehicleTypes = ['SUV', 'Sedan', 'Truck', 'Motorcycle', 'Pickup', 'Van'].map(type => ({
    name: type,
    count: vehicles.filter(v => v.vehicleType === type).length,
  }));

  const responseTimes = Array.from({ length: 12 }, (_, i) => ({
    incident: `INC-${i + 1}`,
    response: Math.floor(Math.random() * 180) + 30,
  }));

  const stats = [
    { label: 'Total Events', value: events.length, icon: Activity, color: 'text-accent-400' },
    { label: 'People Detections', value: events.filter(e => e.eventType.includes('Person')).length + 142, icon: Users, color: 'text-blue-400' },
    { label: 'Vehicle Detections', value: vehicles.length, icon: Car, color: 'text-amber-400' },
    { label: 'Avg Response Time', value: '2.4 min', icon: Clock, color: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Analytics</h1>
        <p className="text-xs text-slate-500">Surveillance intelligence and trend analysis</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card p-4">
              <Icon className={`h-5 w-5 ${s.color} mb-2`} />
              <p className="text-2xl font-bold text-slate-100">{s.value}</p>
              <p className="text-[10px] text-slate-500">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Detections over time */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-accent-400" /> Detections Over 24 Hours
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={hourlyData}>
            <defs>
              <linearGradient id="peopleG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} /><stop offset="100%" stopColor="#06b6d4" stopOpacity={0} /></linearGradient>
              <linearGradient id="vehiclesG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="100%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
              <linearGradient id="alertsG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} /><stop offset="100%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
            <XAxis dataKey="hour" stroke="#475569" fontSize={9} interval={2} />
            <YAxis stroke="#475569" fontSize={10} />
            <Tooltip contentStyle={{ background: '#0d1320', border: '1px solid #243044', borderRadius: '8px', fontSize: '11px' }} />
            <Legend wrapperStyle={{ fontSize: '10px' }} />
            <Area type="monotone" dataKey="people" stroke="#06b6d4" strokeWidth={2} fill="url(#peopleG)" />
            <Area type="monotone" dataKey="vehicles" stroke="#3b82f6" strokeWidth={2} fill="url(#vehiclesG)" />
            <Area type="monotone" dataKey="alerts" stroke="#ef4444" strokeWidth={2} fill="url(#alertsG)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Intrusions per day */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Intrusions Per Day</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyIntrusions}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
              <XAxis dataKey="day" stroke="#475569" fontSize={10} />
              <YAxis stroke="#475569" fontSize={10} />
              <Tooltip contentStyle={{ background: '#0d1320', border: '1px solid #243044', borderRadius: '8px', fontSize: '11px' }} cursor={{ fill: '#ffffff05' }} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Bar dataKey="intrusions" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Severity distribution */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Alert Severity Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={severityData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                {severityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#0d1320', border: '1px solid #243044', borderRadius: '8px', fontSize: '11px' }} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Vehicle detections */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Vehicle Detections by Type</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={vehicleTypes} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
              <XAxis type="number" stroke="#475569" fontSize={10} />
              <YAxis dataKey="name" type="category" stroke="#475569" fontSize={10} width={70} />
              <Tooltip contentStyle={{ background: '#0d1320', border: '1px solid #243044', borderRadius: '8px', fontSize: '11px' }} cursor={{ fill: '#ffffff05' }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Camera uptime */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Camera Uptime %</h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadialBarChart data={cameraUptime} innerRadius="20%" outerRadius="90%" startAngle={90} endAngle={-270}>
              <RadialBar dataKey="uptime" cornerRadius={4} background={{ fill: '#1a2332' }} />
              <Tooltip contentStyle={{ background: '#0d1320', border: '1px solid #243044', borderRadius: '8px', fontSize: '11px' }} />
              <Legend iconSize={8} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '9px' }} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Response time */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-slate-200 mb-4">Incident Response Time (seconds)</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={responseTimes}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
            <XAxis dataKey="incident" stroke="#475569" fontSize={9} />
            <YAxis stroke="#475569" fontSize={10} />
            <Tooltip contentStyle={{ background: '#0d1320', border: '1px solid #243044', borderRadius: '8px', fontSize: '11px' }} />
            <Line type="monotone" dataKey="response" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
