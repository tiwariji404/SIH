import { useState } from 'react';
import { useApp } from '../store';
import { Shield, ShieldAlert, Power, Plus } from 'lucide-react';
import type { Zone } from '../types';

export default function VirtualFences() {
  const { zones } = useApp();
  
  // Local state to toggle zones for the UI
  const [activeFences, setActiveFences] = useState<Record<string, boolean>>(
    zones.reduce((acc, zone) => ({ ...acc, [zone.id]: true }), {})
  );

  const toggleFence = (id: string) => {
    setActiveFences(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex -mx-4 sm:-mx-6 -my-5">
      
      {/* Left Column (30%) - Sidebar */}
      <div className="w-[30%] min-w-[320px] max-w-[400px] border-r border-slate-200 bg-white flex flex-col h-full shadow-lg z-10">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Virtual Fences</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Tactical Perimeters</p>
          </div>
          <button className="bg-slate-800 text-white p-2 rounded-lg hover:bg-slate-700 transition-colors shadow-md">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Fence List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-100/50">
          {zones.map((zone: Zone) => {
            const isActive = activeFences[zone.id];
            return (
              <div key={zone.id} className={`rounded-xl border ${isActive ? 'border-slate-300 shadow-md' : 'border-slate-200 opacity-60'} bg-white overflow-hidden transition-all duration-300 relative group`}>
                
                {/* Blurred Camera Placeholder */}
                <div className="h-28 relative overflow-hidden bg-slate-800">
                  <img 
                    src={zone.id.length % 2 === 0 ? "/border_fence.jpg" : "/border_patrol.jpg"} 
                    alt="Fence feed" 
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${isActive ? 'blur-sm scale-105' : 'blur-md grayscale'}`} 
                  />
                  <div className="absolute inset-0 bg-slate-900/40" />
                  
                  {/* Status Tag overlay */}
                  <div className="absolute top-3 left-3">
                    {zone.severity === 'CRITICAL' && (
                       <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-600/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest rounded-md shadow-lg border border-red-500/50">
                         <ShieldAlert className="w-3 h-3" /> Critical Alert
                       </span>
                    )}
                    {zone.severity === 'HIGH' && (
                       <span className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest rounded-md shadow-lg border border-orange-400/50">
                         <Shield className="w-3 h-3" /> High Alert
                       </span>
                    )}
                    {zone.severity === 'MEDIUM' && (
                       <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest rounded-md shadow-lg border border-amber-400/50">
                         <Shield className="w-3 h-3" /> Monitoring
                       </span>
                    )}
                  </div>

                  {/* Toggle Switch */}
                  <div className="absolute top-3 right-3">
                    <button 
                      onClick={() => toggleFence(zone.id)}
                      className={`w-10 h-6 rounded-full transition-colors flex items-center p-1 shadow-inner ${isActive ? 'bg-green-500' : 'bg-slate-400'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${isActive ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 bg-white">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide leading-tight">{zone.name}</h3>
                      <p className="text-[10px] font-mono text-slate-500 uppercase mt-1">{zone.zoneType} | {zone.cameraIds?.length || 1} Nodes</p>
                    </div>
                  </div>
                  
                  {/* Action row */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${isActive ? 'text-green-600' : 'text-slate-500'}`}>
                      <Power className="w-3 h-3" />
                      {isActive ? 'System Armed' : 'System Disarmed'}
                    </span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column (70%) - Interactive Map */}
      <div className="flex-1 bg-slate-900 relative overflow-hidden">
        
        {/* Placeholder Dark Mode 3D Map */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1920&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-luminosity filter contrast-125"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/80"></div>
        
        {/* Map Grid overlay */}
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

        {/* Tactical UI overlay on map */}
        <div className="absolute top-6 left-6 z-10">
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700 p-4 rounded-xl shadow-2xl">
            <h3 className="text-white font-bold uppercase tracking-widest text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Live Tactical Map
            </h3>
            <p className="text-slate-400 text-[10px] font-mono mt-2">LAT: 28.6139° N | LNG: 77.2090° E</p>
          </div>
        </div>

        {/* Faux 3D Map Elements */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 w-[600px] h-[600px] border border-red-500/30 rounded-full animate-[pulse_4s_ease-in-out_infinite]"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 w-[400px] h-[400px] border border-orange-500/20 rounded-full"></div>
        
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
           <div className="w-4 h-4 bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,1)] animate-ping absolute inset-0"></div>
           <div className="w-4 h-4 bg-red-600 rounded-full relative z-10 border border-white"></div>
           <div className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/90 text-red-400 font-mono text-[10px] px-2 py-1 rounded border border-red-900">
             BREACH DETECTED
           </div>
        </div>

      </div>

    </div>
  );
}
