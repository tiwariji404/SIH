import { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../store';
import { Settings, Shield, Plus, MoreHorizontal, ChevronDown, ChevronUp, Map as MapIcon, Camera as CameraIcon, Trash2, ShieldAlert, Check, Layers, Video } from 'lucide-react';
import { GoogleMap, useJsApiLoader, MarkerF, PolygonF } from '@react-google-maps/api';

type Point = { x: number; y: number };

const containerStyle = {
  width: '100%',
  height: '100%'
};

// 12 Cameras across 3 major border locations
const cameraLocations: Record<string, { lat: number, lng: number }> = {
  // Punjab Border (North)
  'Punjab Sector - Cam 1': { lat: 31.60450, lng: 74.57680 },
  'Punjab Sector - Cam 2': { lat: 31.60550, lng: 74.57780 },
  'Punjab Sector - Cam 3': { lat: 31.60650, lng: 74.57880 },
  'Punjab Sector - Cam 4': { lat: 31.60750, lng: 74.57980 },
  // Rajasthan Border (West)
  'Rajasthan Desert - Cam 1': { lat: 26.9124, lng: 70.9083 },
  'Rajasthan Desert - Cam 2': { lat: 26.9134, lng: 70.9093 },
  'Rajasthan Desert - Cam 3': { lat: 26.9144, lng: 70.9103 },
  'Rajasthan Desert - Cam 4': { lat: 26.9154, lng: 70.9113 },
  // Bengal Border (East)
  'Bengal River - Cam 1': { lat: 22.9868, lng: 88.4886 },
  'Bengal River - Cam 2': { lat: 22.9878, lng: 88.4896 },
  'Bengal River - Cam 3': { lat: 22.9888, lng: 88.4906 },
  'Bengal River - Cam 4': { lat: 22.9898, lng: 88.4916 },
};

const defaultCenter = { lat: 31.6045, lng: 74.5768 };

export default function VirtualFences() {
  const { showToast, activeAlarm, savedFences, setSavedFences } = useApp();
  
  const [hardwareDevices, setHardwareDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameras, setSelectedCameras] = useState<string[]>([]); // Immediately stream when ticked
  const [fenceName, setFenceName] = useState('');
  
  const [showFenceGroups, setShowFenceGroups] = useState(false);

  // Drawing State
  const [points, setPoints] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(true);
  
  // Streaming State for Hardware Cameras
  const [hwStreams, setHwStreams] = useState<Record<string, MediaStream>>({});
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyDJkmhAaJGSlhomraLnXjDMeTd5dXzyCMM'
  });

  useEffect(() => {
    // Enumerate hardware devices
    const loadHardware = async () => {
      try {
        if (!navigator.mediaDevices) return;
        const devices = await navigator.mediaDevices.enumerateDevices();
        setHardwareDevices(devices.filter(d => d.kind === 'videoinput'));
      } catch (err) {}
    };
    loadHardware();
  }, []);

  // Manage Media Streams based on SELECTED cameras (immediately start streaming when checked)
  useEffect(() => {
    const activeHwCameras = new Set<string>();
    
    // We want to stream any ticked camera, regardless of whether it's saved in a fence yet
    selectedCameras.forEach(c => {
      if (c.startsWith('HW:')) activeHwCameras.add(c);
    });
    
    // Also keep streams alive if they are in an active saved fence
    savedFences.forEach(f => {
      if (f.active) {
        f.cameras.forEach(c => {
          if (c.startsWith('HW:')) activeHwCameras.add(c);
        });
      }
    });

    // Start new streams
    activeHwCameras.forEach(async (cam) => {
      if (!hwStreams[cam]) {
        const deviceId = cam.split('HW:')[1];
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: deviceId } });
          setHwStreams(prev => ({ ...prev, [cam]: stream }));
        } catch (e) {
          console.error("Failed to start camera", cam, e);
        }
      }
    });

    // Stop unused streams
    Object.keys(hwStreams).forEach(cam => {
      if (!activeHwCameras.has(cam)) {
        hwStreams[cam].getTracks().forEach(t => t.stop());
        setHwStreams(prev => {
          const next = { ...prev };
          delete next[cam];
          return next;
        });
      }
    });
  }, [selectedCameras, savedFences]); // Removed hwStreams from dependency to prevent loop

  // WebSocket for AI Backend
  useEffect(() => {
    let ws: WebSocket | null = null;
    let frameInterval: any = null;
    
    const activeHwCamerasForAI = new Set<string>();
    // Only send frames to AI for cameras that are actually saved in an active Fencing Group
    savedFences.forEach(f => {
      if (f.active) f.cameras.forEach(c => { if (c.startsWith('HW:')) activeHwCamerasForAI.add(c); });
    });

    if (activeHwCamerasForAI.size > 0) {
      ws = new WebSocket('ws://localhost:8000/ws/detections');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 640;
      canvas.height = 480;

      ws.onopen = () => {
         console.log("Connected to Python AI Backend for frame streaming");
         activeHwCamerasForAI.forEach(camId => {
             ws?.send(JSON.stringify({ type: 'set_scenario', camera_id: camId, scenario: 'intrusion' }));
         });
         frameInterval = setInterval(() => {
            activeHwCamerasForAI.forEach(camId => {
               const video = videoRefs.current[camId];
               if (video && video.readyState >= 2) {
                  ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
                  const base64 = canvas.toDataURL('image/jpeg', 0.6);
                  ws?.send(JSON.stringify({ type: 'frame', camera_id: camId, image: base64 }));
               }
            });
         }, 500); // 2 FPS per camera
      };
    }
    
    return () => {
      if (frameInterval) clearInterval(frameInterval);
      if (ws) ws.close();
    };
  }, [savedFences, hwStreams]);

  // Auto-center map on first selected demo camera if any
  const currentGeo = useMemo(() => {
    const firstDemo = selectedCameras.find(c => !c.startsWith('HW:'));
    return firstDemo && cameraLocations[firstDemo] ? cameraLocations[firstDemo] : defaultCenter;
  }, [selectedCameras]);

  const mapPolygonPositions = points.map(p => {
    const latOffset = (50 - p.y) * 0.00005; 
    const lngOffset = (p.x - 50) * 0.00005;
    return { lat: currentGeo.lat + latOffset, lng: currentGeo.lng + lngOffset };
  });

  const clearPolygon = () => {
    setPoints([]);
    setIsDrawing(true);
  };

  const createFence = () => {
    if (!fenceName.trim()) {
      showToast({ type: 'warning', title: 'Name Required', message: 'Please enter a Fence Name.' });
      return;
    }
    if (selectedCameras.length === 0) {
      showToast({ type: 'warning', title: 'Camera Required', message: 'Please select at least one camera.' });
      return;
    }
    
    const newFence = {
      id: Date.now().toString(),
      name: fenceName,
      cameras: [...selectedCameras],
      points: [...points], // Points are now optional
      active: true
    };
    
    setSavedFences([...savedFences, newFence]);
    showToast({ type: 'success', title: 'Fence Created', message: `${fenceName} is now saved in Fencing Groups.` });
    
    // Reset form
    setFenceName('');
    setSelectedCameras([]);
    clearPolygon();
    setShowFenceGroups(true); // Auto open groups to show the new fence
  };

  const toggleCameraSelection = (camId: string) => {
    setSelectedCameras(prev => 
      prev.includes(camId) ? prev.filter(c => c !== camId) : [...prev, camId]
    );
  };

  const deleteFence = (id: string) => {
    setSavedFences(savedFences.filter(f => f.id !== id));
  };

  const [aiExpanded, setAiExpanded] = useState(true);

  return (
    <div className="h-[calc(100vh-4rem)] flex -mx-4 sm:-mx-6 -my-5 bg-[#0b0f19] text-slate-300">
      
      {/* Left Column (70%) - Main Viewer */}
      <div className="flex-1 relative border-r border-slate-800 bg-slate-900 flex flex-col min-w-0">
        
        {/* Header inside viewer */}
        <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/80 to-transparent z-[1000] flex justify-between items-center pointer-events-none">
          <div className="flex items-center gap-3 pointer-events-auto relative">
            <button 
              onClick={() => setShowFenceGroups(true)}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors border shadow-lg ${showFenceGroups ? 'bg-blue-600 text-white border-blue-400/50' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-200'}`}
            >
              <Layers className="w-4 h-4" /> Fencing Groups
            </button>
            <button 
              onClick={() => setShowFenceGroups(false)}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors border shadow-lg ${!showFenceGroups ? 'bg-blue-600 text-white border-blue-400/50' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-200'}`}
            >
              <MapIcon className="w-3.5 h-3.5" /> Tactical Map View
            </button>
          </div>
        </div>

        <div className="flex-1 relative z-10 w-full h-full bg-slate-900">

            {/* Fencing Groups Full View */}
            {showFenceGroups ? (
              <div className="absolute inset-0 bg-slate-900 z-[500] p-6 overflow-y-auto pt-20">
                <div className="max-w-3xl mx-auto">
                  <h3 className="text-xl font-bold text-slate-200 uppercase tracking-wider mb-6 flex items-center gap-3 border-b border-slate-700 pb-4">
                    <Layers className="w-6 h-6 text-blue-500" /> Active Fence Groups
                  </h3>
                  
                  {savedFences.length === 0 ? (
                    <div className="bg-slate-800/50 rounded-xl p-10 text-center border border-slate-700 shadow-inner">
                      <p className="text-slate-400 font-medium">No active fences created yet.</p>
                      <p className="text-slate-500 text-sm mt-2">Use the Tactical Map View to create a new fence.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {savedFences.map(fence => (
                        <div key={fence.id} className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-lg hover:border-blue-500/50 transition-colors group relative">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse" />
                              <h4 className="text-lg font-bold text-slate-200">{fence.name}</h4>
                            </div>
                            <button onClick={() => deleteFence(fence.id)} className="text-slate-500 hover:text-red-400 bg-slate-900/50 p-2 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="space-y-2">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-700 pb-1">Assigned Cameras</p>
                            <div className="flex flex-col gap-2">
                              {fence.cameras.map(c => (
                                <button key={c} onClick={() => {
                                  window.dispatchEvent(new CustomEvent('appNavigate', { detail: { page: 'live', cameraId: c } }));
                                }} className="flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 transition-colors border border-slate-700 rounded-lg text-xs text-slate-300 font-medium cursor-pointer text-left focus:outline-none">
                                  {c.startsWith('HW:') ? <Video className="w-3.5 h-3.5 text-emerald-400" /> : <CameraIcon className="w-3.5 h-3.5 text-blue-400" />}
                                  {c.startsWith('HW:') ? c.replace('HW:', 'Hardware: ') : c}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Google Maps Integration */
              isLoaded ? (
                 <GoogleMap
                    mapContainerStyle={containerStyle}
                  center={currentGeo}
                  zoom={12} // Zoomed out to see the spread of locations
                  options={{ disableDefaultUI: true, mapTypeId: 'hybrid' }}
                  onClick={(e) => {
                    if (!isDrawing || !e.latLng) return;
                    const lat = e.latLng.lat();
                    const lng = e.latLng.lng();
                    const x = 50 + (lng - currentGeo.lng) / 0.00005;
                    const y = 50 - (lat - currentGeo.lat) / 0.00005;
                    setPoints(prev => [...prev, { x, y }]);
                  }}
               >
                  {Object.entries(cameraLocations).map(([camName, pos]) => (
                      <MarkerF 
                          key={camName} 
                          position={pos} 
                          onClick={() => { 
                            toggleCameraSelection(camName); 
                          }}
                          label={{ text: camName, color: 'yellow', fontSize: '10px', className: 'mt-10 bg-black/50 px-1 rounded' }}
                      />
                  ))}

                  {/* Render Saved Fences */}
                  {savedFences.map(fence => {
                     const firstDemoCam = fence.cameras.find(c => !c.startsWith('HW:'));
                     const fCenter = firstDemoCam ? cameraLocations[firstDemoCam] : defaultCenter;
                     if (!fCenter) return null;

                     const fPaths = fence.points.map(p => ({
                        lat: fCenter.lat + (50 - p.y) * 0.00005,
                        lng: fCenter.lng + (p.x - 50) * 0.00005
                     }));
                     
                     // Check if this fence has triggered an alarm
                     const isThisFenceBreached = activeAlarm && activeAlarm.status !== 'RESOLVED' && fence.cameras.some(c => c.startsWith('HW:'));

                     if (fPaths.length < 3) return null; // Avoid crashing Google Maps with empty polygons

                     return (
                       <PolygonF 
                           key={fence.id}
                           paths={fPaths}
                           options={{
                               fillColor: isThisFenceBreached ? '#ef4444' : '#10b981',
                               fillOpacity: isThisFenceBreached ? 0.6 : 0.2,
                               strokeColor: isThisFenceBreached ? '#ef4444' : '#10b981',
                               strokeOpacity: 0.8,
                               strokeWeight: 2
                           }}
                       />
                     );
                  })}

                  {/* Render Current Drawing Polygon */}
                  {mapPolygonPositions.length > 2 && (
                      <PolygonF 
                          paths={mapPolygonPositions}
                          options={{
                              fillColor: '#3b82f6',
                              fillOpacity: 0.4,
                              strokeColor: '#60a5fa',
                              strokeOpacity: 0.9,
                              strokeWeight: 2
                          }}
                      />
                  )}
               </GoogleMap>
             ) : (
                 <div className="flex items-center justify-center h-full w-full text-slate-400">Loading Tactical Map...</div>
             )
           )}


           
           {activeAlarm && activeAlarm.status !== 'RESOLVED' && (
              <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000]">
                 <div className="bg-red-600/90 text-white px-8 py-4 rounded-full font-bold shadow-[0_0_50px_rgba(239,68,68,1)] border-2 border-red-400 animate-pulse flex items-center gap-3 tracking-widest text-lg">
                   <ShieldAlert className="w-7 h-7" /> CRITICAL BREACH DETECTED!
                 </div>
              </div>
           )}
        </div>
      </div>

      {/* Right Column (30%) - Configuration Sidebar */}
      <div className="w-80 lg:w-[400px] bg-[#131722] flex flex-col h-full z-10 overflow-y-auto custom-scrollbar border-l border-slate-800">
        
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-[#1a1d27]">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-500" /> Fence Configuration
          </h2>
        </div>

        <div className="p-5 border-b border-slate-800 bg-[#0b0f19] space-y-4">
           
           <div>
             <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">Fence Group Name</label>
             <input 
               type="text"
               value={fenceName}
               onChange={(e) => setFenceName(e.target.value)}
               placeholder="e.g., Alpha Sector West"
               className="w-full bg-[#131722] border border-slate-700 text-slate-200 text-sm font-medium rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
             />
           </div>

           <div>
             <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">Assign Cameras</label>
             <div className="bg-[#131722] border border-slate-700 rounded-lg p-2 max-h-72 overflow-y-auto custom-scrollbar space-y-1">
                
                <div className="px-2 py-1 text-[10px] font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1 bg-emerald-500/10 rounded mb-1">
                   <Video className="w-3 h-3" /> Live Hardware
                </div>
                {hardwareDevices.map((dev, i) => {
                  const id = `HW:${dev.deviceId}`;
                  return (
                    <label key={id} className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded cursor-pointer transition-colors border border-transparent hover:border-slate-700">
                      <input 
                        type="checkbox" 
                        checked={selectedCameras.includes(id)}
                        onChange={() => toggleCameraSelection(id)}
                        className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 bg-slate-900"
                      />
                      <span className="text-sm text-slate-300 font-medium">{dev.label || `USB Camera ${i + 1}`}</span>
                    </label>
                  );
                })}
                {hardwareDevices.length === 0 && <div className="px-2 pb-2 text-xs text-slate-500 italic">No hardware cameras found</div>}

                <div className="px-2 py-1 mt-2 text-[10px] font-bold text-blue-500 uppercase tracking-wider flex items-center gap-1 bg-blue-500/10 rounded mb-1">
                   <CameraIcon className="w-3 h-3" /> Virtual Demo Cameras (12)
                </div>
                {Object.keys(cameraLocations).map(cam => (
                  <label key={cam} className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      checked={selectedCameras.includes(cam)}
                      onChange={() => toggleCameraSelection(cam)}
                      className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 bg-slate-900"
                    />
                    <span className="text-sm text-slate-300 font-medium truncate" title={cam}>{cam}</span>
                  </label>
                ))}
             </div>
           </div>
        </div>

        <div className="p-5 border-b border-slate-800 space-y-4 bg-[#1a1d27]">
           <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500">Geometry Tools (Optional)</label>
           
           <div className="flex gap-2">
              <button 
                onClick={clearPolygon}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-slate-700"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear Map Area
              </button>
           </div>
           
           {points.length > 0 && (
             <p className="text-xs text-slate-400 font-medium text-center">
               {points.length} points plotted
             </p>
           )}

           <button 
              onClick={createFence}
              disabled={!fenceName || selectedCameras.length === 0}
              className={`w-full py-3.5 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg ${
                fenceName && selectedCameras.length > 0
                  ? 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/50' 
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
           >
              <Check className="w-4 h-4" /> Create Fence
           </button>
        </div>

        <div className="border-b border-slate-800">
          <button 
            onClick={() => setAiExpanded(!aiExpanded)}
            className="w-full flex justify-between items-center p-5 hover:bg-slate-800/50 transition-colors"
          >
            <span className="text-sm font-bold text-slate-300 uppercase tracking-widest">AI Analytics Layer</span>
            {aiExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>
          
          {aiExpanded && (
            <div className="px-5 pb-5 space-y-4">
              <ToggleRow label="Human Detection" checked={true} onChange={() => {}} />
              <ToggleRow label="Vehicle & Drone Classification" checked={true} onChange={() => {}} />
              <ToggleRow label="Animal Detection" checked={true} onChange={() => {}} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-slate-300 font-medium">{label}</span>
      <button 
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-blue-500' : 'bg-slate-700 border border-slate-600'}`}
      >
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}
