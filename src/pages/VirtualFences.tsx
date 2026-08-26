import { useState, useMemo, useCallback } from 'react';
import { useApp } from '../store';
import { Fence, Plus, Trash2, Shield, MapPin } from 'lucide-react';
import type { Zone, RiskLevel, Camera } from '../types';
import { GoogleMap, useJsApiLoader, Polygon, Marker } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = ""; // Intentionally empty to allow unregistered dev-mode map loading
const containerStyle = { width: '100%', height: '100%', position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 };

export default function VirtualFences() {
  const { cameras, zones, addZone, deleteZone, showToast } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  
  // New Map-based Creation State
  const [zoneName, setZoneName] = useState('');
  const [zoneType, setZoneType] = useState('Virtual Fence');
  const [severity, setSeverity] = useState<RiskLevel>('HIGH');
  const [selectedCameraIds, setSelectedCameraIds] = useState<string[]>([]);
  
  const [, setMap] = useState<google.maps.Map | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY || ''
  });

  const center = useMemo(() => {
    // Default to the first online camera's center
    const active = cameras.filter(c => c.status !== 'OFFLINE');
    if (active.length > 0) return active[0].mapCoord;
    return { lat: 28.6139, lng: 77.2090 };
  }, [cameras]);

  const onLoad = useCallback(function callback(mapInstance: google.maps.Map) {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  const toggleCameraSelection = (camId: string) => {
    setSelectedCameraIds(prev => 
      prev.includes(camId) ? prev.filter(id => id !== camId) : [...prev, camId]
    );
  };

  const handleSave = () => {
    if (!zoneName || selectedCameraIds.length < 2) {
      showToast({ type: 'warning', title: 'Invalid Fence', message: 'You must select at least 2 cameras.'});
      return;
    }

    const zone: Zone = {
      id: `Z-${Date.now()}`,
      cameraIds: selectedCameraIds,
      name: zoneName,
      zoneType,
      severity,
      coordinates: [], // We don't use internal X,Y drawing coords anymore, we rely on grouped cameras
      rule: `${zoneType === 'Tripwire' ? 'Crossing' : 'Detection in grouping'} → ${severity} alert`,
    };
    
    addZone(zone);
    setShowCreate(false);
    setZoneName('');
    setSelectedCameraIds([]);
  };
  
  // Calculate Polygon Path based on selected cameras
  const polygonPath = useMemo(() => {
     return selectedCameraIds.map(id => {
        const c = cameras.find(cam => cam.id === id);
        return c ? c.mapCoord : null;
     }).filter(Boolean) as { lat: number; lng: number }[];
  }, [selectedCameraIds, cameras]);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Virtual Fences</h1>
          <p className="text-xs text-slate-600">{zones.length} active zones • Multi-camera boundary mapping</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> Create Fencing
        </button>
      </div>

      {/* Existing zones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-t border-slate-200 mt-4 pt-4">
        {zones.map(zone => {
          const camArray = zone.cameraIds || ((zone as unknown as {cameraId: string}).cameraId ? [(zone as unknown as {cameraId: string}).cameraId] : []);
          return (
            <div 
               key={zone.id} 
               onClick={() => window.dispatchEvent(new CustomEvent('appNavigate', { detail: { page: 'live', cameraIds: camArray } }))}
               className="card p-5 border shadow-sm border-slate-200 hover:shadow-md hover:border-accent-500 hover:bg-slate-50 cursor-pointer transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-slate-100 rounded-lg">
                     <Fence className="h-5 w-5 text-accent-500" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-800">{zone.name}</p>
                    <p className="text-xs font-mono text-slate-600">{zone.id} • {zone.zoneType}</p>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteZone(zone.id); }} className="text-slate-300 group-hover:text-slate-400 hover:!text-red-500 transition-colors p-1">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              
              <div className="space-y-2 mt-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                 <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1 border-b border-slate-200 pb-1">Covered Cameras</p>
                 <div className="flex flex-wrap gap-1">
                   {camArray.map(cid => (
                     <span key={cid} className="badge bg-white shadow-sm text-slate-700 border border-slate-200 font-mono text-[10px]"><CameraIdLabel id={cid} cameras={cameras}/></span>
                   ))}
                   {camArray.length === 0 && <span className="text-xs italic text-slate-500">Legacy single-cam zone</span>}
                 </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                  <span className={`badge px-2 py-1 uppercase font-black text-[10px] tracking-wide ${zone.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-500 border border-red-500/30' : zone.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30' : 'bg-amber-500/20 text-amber-500 border border-amber-500/30'}`}>
                     {zone.severity} ALERT
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium truncate ml-2">{zone.rule}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Map-based Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <div>
                 <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-accent-500" /> Plot Fencing Perimeter
                 </h2>
                 <p className="text-xs text-slate-600 mt-1">Select assigned cameras on the map to form a perimeter fence.</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:bg-slate-200 p-2 rounded-full transition-colors">✕</button>
            </div>

            <div className="flex flex-1 min-h-0">
               
               {/* Left Controls */}
               <div className="w-80 p-5 border-r border-slate-200 bg-white overflow-y-auto flex flex-col">
                  <div className="space-y-4 flex-1">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Fence Name</label>
                      <input type="text" value={zoneName} onChange={e => setZoneName(e.target.value)} placeholder="e.g. Northern Perimeter" className="input w-full" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Fence Type</label>
                      <select value={zoneType} onChange={e => setZoneType(e.target.value)} className="input w-full">
                        <option>Virtual Fence</option>
                        <option>Tripwire</option>
                        <option>Loitering Zone</option>
                        <option>Restricted Area</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Alarm Severity</label>
                      <select value={severity} onChange={e => setSeverity(e.target.value as RiskLevel)} className="input w-full">
                        <option value="MEDIUM">Medium / Warning</option>
                        <option value="HIGH">High / Alert</option>
                        <option value="CRITICAL">Critical / Emergency</option>
                      </select>
                    </div>
                    
                    <div className="pt-4 mt-4 border-t border-slate-200">
                       <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Selected Nodes ({selectedCameraIds.length})</h3>
                       {selectedCameraIds.length === 0 ? (
                           <div className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded border border-dashed border-slate-300">Click cameras on the map to add them to this fence circuit. Minimum 2 required.</div>
                       ) : (
                           <div className="space-y-1.5 max-h-48 overflow-y-auto">
                              {selectedCameraIds.map((cid, i) => {
                                  const c = cameras.find(c => c.id === cid);
                                  return (
                                     <div key={cid} className="text-[11px] flex items-center justify-between font-mono bg-sky-50 border border-sky-100 text-sky-800 p-2 rounded">
                                        <span>{i+1}. {cid} | {c?.name.slice(0, 10)}</span>
                                        <button onClick={() => toggleCameraSelection(cid)} className="text-sky-500 hover:text-red-500">✕</button>
                                     </div>
                                  )
                              })}
                           </div>
                       )}
                    </div>
                  </div>
                  
                  <div className="pt-4 mt-auto">
                     <button 
                        onClick={handleSave} 
                        disabled={!zoneName || selectedCameraIds.length < 2} 
                        className="btn-primary w-full py-3 font-bold uppercase tracking-widest text-xs"
                     >
                       <Shield className="h-4 w-4 mr-2 inline" /> Enact Fencing
                     </button>
                  </div>
               </div>
               
               {/* Right Map */}
               <div className="flex-1 relative bg-slate-200 min-h-[400px]">
                  {isLoaded ? (
                       <GoogleMap
                          mapContainerStyle={containerStyle}
                          center={center}
                          zoom={12}
                          onLoad={onLoad}
                          onUnmount={onUnmount}
                          options={{ mapTypeId: 'satellite', disableDefaultUI: false }}
                       >
                        {/* Dynamic Drawing of Polygon among selected cameras */}
                        {polygonPath.length > 1 && (
                           <Polygon
                             paths={polygonPath}
                             options={{
                               fillColor: severity === 'CRITICAL' ? '#ef4444' : '#f97316',
                               fillOpacity: 0.25,
                               strokeColor: severity === 'CRITICAL' ? '#ef4444' : '#f97316',
                               strokeOpacity: 0.9,
                               strokeWeight: 3,
                             }}
                           />
                        )}

                        {/* Camera Markers */}
                        {cameras.filter(c => c.status !== 'OFFLINE').map(cam => {
                           const isSelected = selectedCameraIds.includes(cam.id);
                           const iconPath = isSelected 
                              ? "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" 
                              : "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
                           
                           return (
                              <Marker
                                key={cam.id}
                                position={cam.mapCoord}
                                icon={{ url: iconPath }}
                                title={`${cam.id} - ${cam.name} (Click to toggle)`}
                                onClick={() => toggleCameraSelection(cam.id)}
                              />
                           );
                        })}
                       </GoogleMap>
                  ) : (
                     <div className="w-full h-full flex flex-col items-center justify-center font-mono text-slate-500">
                        <div className="w-8 h-8 border-4 border-slate-300 border-t-accent-500 rounded-full animate-spin mb-4"></div>
                        <p>Initializing Google Maps GIS Link...</p>
                     </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CameraIdLabel({ id, cameras }: { id: string, cameras: Camera[] }) {
   const cam = cameras.find(c => c.id === id);
   return (
      <button
        type="button"
        onClick={(e) => {
           e.preventDefault();
           e.stopPropagation();
           window.dispatchEvent(new CustomEvent('appNavigate', { detail: { page: 'live', cameraId: id } }));
        }}
        className="text-inherit hover:text-accent-600 font-bold cursor-pointer transition-colors"
      >
         {id}{cam ? ` - ${cam.name.split(' ')[0]}` : ''}
      </button>
   );
}
