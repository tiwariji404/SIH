import { useState, useRef, MouseEvent, useEffect } from 'react';
import { useApp } from '../store';
import { Settings, Shield, Plus, MoreHorizontal, ChevronDown, ChevronUp, Map as MapIcon, Camera as CameraIcon, Trash2, ShieldAlert, Check, RefreshCw } from 'lucide-react';
import { GoogleMap, useJsApiLoader, MarkerF, PolygonF } from '@react-google-maps/api';

type Point = { x: number; y: number };

const containerStyle = {
  width: '100%',
  height: '100%'
};

// Punjab Border roughly
const defaultCenter = {
  lat: 31.6045,
  lng: 74.5768
};

export default function VirtualFences() {
  const { showToast } = useApp();
  
  const [viewMode, setViewMode] = useState<'camera' | 'map'>('camera');
  const [selectedCamera, setSelectedCamera] = useState('Cam 1 - Border Sector A');
  
  // Custom Camera Stream
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamActive, setStreamActive] = useState(false);

  // Drawing State
  const [points, setPoints] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(true);
  
  // Simulation State
  const [isBreached, setIsBreached] = useState(false);
  const [breachPoint, setBreachPoint] = useState<Point | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyDJkmhAaJGSlhomraLnXjDMeTd5dXzyCMM'
  });

  // Map coordinates mapping for cameras
  const cameraLocations: Record<string, { lat: number, lng: number }> = {
    'Cam 1 - Border Sector A': { lat: 31.6050, lng: 74.5765 },
    'Cam 2 - Checkpoint Alpha': { lat: 31.6080, lng: 74.5790 },
    'Cam 3 - Outpost Delta': { lat: 31.6020, lng: 74.5730 },
    'Hardware Device (Webcam 1)': { lat: 31.6045, lng: 74.5768 },
    'Hardware Device (Webcam 2)': { lat: 31.6030, lng: 74.5750 },
  };

  const currentGeo = cameraLocations[selectedCamera] || defaultCenter;

  // Approximate convert of UI points to geo polygon for map representation
  const mapPolygonPositions = points.map(p => {
    const latOffset = (50 - p.y) * 0.00005; 
    const lngOffset = (p.x - 50) * 0.00005;
    return { lat: currentGeo.lat + latOffset, lng: currentGeo.lng + lngOffset };
  });

  useEffect(() => {
    // If a hardware camera is selected, try to hook up the webcam feed.
    if (selectedCamera.startsWith('Hardware Device') && viewMode === 'camera') {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
          .then((stream) => {
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              setStreamActive(true);
            }
          })
          .catch((err) => {
            showToast({ type: 'alert', title: 'Hardware Access Denied', message: err.message });
            setStreamActive(false);
          });
      }
    } else {
      // Disconnect hardware stream if not using it
      if (videoRef.current && videoRef.current.srcObject) {
         const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
         tracks.forEach(t => t.stop());
         videoRef.current.srcObject = null;
      }
      setStreamActive(false);
    }
  }, [selectedCamera, viewMode, showToast]);

  const handleSvgClick = (e: MouseEvent<SVGSVGElement>) => {
    if (!isDrawing) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    if (points.length >= 3) {
      const first = points[0];
      const dist = Math.sqrt(Math.pow(x - first.x, 2) + Math.pow(y - first.y, 2));
      if (dist < 3) {
        setIsDrawing(false);
        showToast({ type: 'success', title: 'Fence Saved', message: 'Virtual Fence area established.' });
        return;
      }
    }
    setPoints([...points, { x, y }]);
  };

  const clearPolygon = () => {
    setPoints([]);
    setIsDrawing(true);
    setIsBreached(false);
    setBreachPoint(null);
  };

  const simulateBreach = () => {
    if (points.length < 3) {
      showToast({ type: 'warning', title: 'Action Failed', message: 'Draw a complete fence first.' });
      return;
    }
    
    const centerX = points.reduce((acc, p) => acc + p.x, 0) / points.length;
    const centerY = points.reduce((acc, p) => acc + p.y, 0) / points.length;
    
    setBreachPoint({ x: centerX, y: centerY });
    setIsBreached(true);
    showToast({ type: 'alert', title: 'CRITICAL BREACH', message: `Unauthorized intrusion detected in ${selectedCamera}.` });
    
    setTimeout(() => {
      setIsBreached(false);
      setBreachPoint(null);
    }, 5000);
  };

  const [humanDetection, setHumanDetection] = useState(true);
  const [vehicleClassification, setVehicleClassification] = useState(true);
  const [aiExpanded, setAiExpanded] = useState(true);

  return (
    <div className="h-[calc(100vh-4rem)] flex -mx-4 sm:-mx-6 -my-5 bg-[#0b0f19] text-slate-300">
      
      {/* Left Column (70%) - Main Viewer */}
      <div className="flex-1 relative border-r border-slate-800 bg-black flex flex-col min-w-0">
        
        {/* Header inside viewer */}
        <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/80 to-transparent z-[1000] flex justify-between items-center pointer-events-none">
          <div className="flex items-center gap-3 pointer-events-auto">
            <h2 className="text-sm font-bold text-slate-200 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700 backdrop-blur-md">
              {selectedCamera}
            </h2>
            
            <div className="flex bg-slate-900/80 border border-slate-700 rounded-lg p-0.5 backdrop-blur-md">
               <button 
                 onClick={() => setViewMode('camera')}
                 className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${viewMode === 'camera' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
               >
                 <CameraIcon className="w-3.5 h-3.5" /> Live Feed
               </button>
               <button 
                 onClick={() => setViewMode('map')}
                 className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${viewMode === 'map' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
               >
                 <MapIcon className="w-3.5 h-3.5" /> Proper Map
               </button>
            </div>
          </div>
        </div>

        {viewMode === 'camera' ? (
          <div className="flex-1 relative overflow-hidden">
            {selectedCamera.startsWith('Hardware') ? (
               <video 
                  ref={videoRef}
                  autoPlay 
                  playsInline 
                  muted 
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ${isBreached ? 'brightness-110 saturate-150' : ''}`} 
               />
            ) : (
                <img 
                  src="/border_fence.jpg" 
                  alt="Camera Feed" 
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ${isBreached ? 'brightness-110 saturate-150' : ''}`} 
                />
            )}
            
            {(!streamActive && selectedCamera.startsWith('Hardware')) && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50">
                   <div className="text-center text-slate-400">
                      <CameraIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Hardware Camera Disconnected or Loading...</p>
                      <p className="text-xs mt-1">Please allow camera permissions.</p>
                   </div>
                </div>
            )}
            
            {isBreached && <div className="absolute inset-0 bg-red-900/20 mix-blend-color animate-pulse pointer-events-none" />}
            
            {/* Interactive SVG Canvas */}
            <svg 
              className="absolute inset-0 w-full h-full z-20 cursor-crosshair" 
              preserveAspectRatio="none" 
              viewBox="0 0 100 100"
              onClick={handleSvgClick}
            >
              {points.length > 1 && (
                <polygon 
                  points={points.map(p => `${p.x},${p.y}`).join(' ')} 
                  fill={isBreached ? "rgba(239, 68, 68, 0.3)" : (isDrawing ? "rgba(59, 130, 246, 0.2)" : "rgba(6, 182, 212, 0.2)")} 
                  stroke={isBreached ? "rgba(239, 68, 68, 0.9)" : (isDrawing ? "rgba(59, 130, 246, 0.8)" : "rgba(6, 182, 212, 0.8)")} 
                  strokeWidth="0.5" 
                />
              )}
              {points.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="1" fill="white" stroke={i === 0 && isDrawing ? "yellow" : "black"} strokeWidth="0.2" />
              ))}
              {isBreached && breachPoint && (
                <g>
                  <circle cx={breachPoint.x} cy={breachPoint.y} r="3" fill="rgba(239, 68, 68, 0.5)" className="animate-ping" />
                  <circle cx={breachPoint.x} cy={breachPoint.y} r="1" fill="red" />
                  <rect x={breachPoint.x - 2} y={breachPoint.y - 4} width="4" height="2" fill="red" />
                  <text x={breachPoint.x} y={breachPoint.y - 5} fontSize="1.5" fill="white" textAnchor="middle" fontWeight="bold">INTRUDER</text>
                </g>
              )}
            </svg>

            {isDrawing && points.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700 px-6 py-4 rounded-xl shadow-2xl flex flex-col items-center animate-bounce">
                   <Shield className="w-8 h-8 text-blue-400 mb-2" />
                   <p className="text-white font-bold text-lg">Draw Virtual Fence</p>
                   <p className="text-slate-400 text-xs mt-1">Click on the video feed to plot points.</p>
                </div>
              </div>
            )}
            
            {isBreached && (
               <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-red-600/90 backdrop-blur-md px-6 py-2 rounded-full border border-red-400 text-white font-bold tracking-widest text-sm shadow-[0_0_30px_rgba(239,68,68,0.6)] z-50 flex items-center gap-2">
                 <ShieldAlert className="w-5 h-5 animate-pulse" /> BREACH DETECTED IN SECTOR
               </div>
            )}
          </div>
        ) : (
          <div className="flex-1 relative z-10 w-full h-full bg-slate-900">
             {/* Google Maps Integration */}
             {isLoaded ? (
                 <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={currentGeo}
                    zoom={15}
                    options={{ disableDefaultUI: true, mapTypeId: 'hybrid' }}
                 >
                    {Object.entries(cameraLocations).map(([camName, pos]) => (
                        <MarkerF 
                            key={camName} 
                            position={pos} 
                            onClick={() => setSelectedCamera(camName)}
                            label={{ text: camName.includes('Hardware') ? 'Webcam' : 'CCTV', color: 'yellow', fontSize: '10px', className: 'mt-10' }}
                        />
                    ))}

                    {!isDrawing && mapPolygonPositions.length > 2 && (
                        <PolygonF 
                            paths={mapPolygonPositions}
                            options={{
                                fillColor: isBreached ? '#ef4444' : '#06b6d4',
                                fillOpacity: 0.35,
                                strokeColor: isBreached ? '#ef4444' : '#06b6d4',
                                strokeOpacity: 0.8,
                                strokeWeight: 2
                            }}
                        />
                    )}
                 </GoogleMap>
             ) : (
                 <div className="flex items-center justify-center h-full w-full text-slate-400">Loading Map...</div>
             )}
             
             {isBreached && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000]">
                   <div className="bg-red-600/90 text-white px-4 py-2 rounded-lg font-bold shadow-[0_0_20px_rgba(239,68,68,0.8)] border border-red-400 animate-pulse flex items-center gap-2">
                     <ShieldAlert className="w-5 h-5" /> FENCE BREACH AT THIS LOCATION
                   </div>
                </div>
             )}
          </div>
        )}
      </div>

      {/* Right Column (30%) - Configuration Sidebar */}
      <div className="w-80 lg:w-96 bg-[#131722] flex flex-col h-full z-10 overflow-y-auto custom-scrollbar">
        
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#1a1d27]">
          <h2 className="text-sm font-medium text-slate-200">Fence Configuration</h2>
          <MoreHorizontal className="w-4 h-4 text-slate-500" />
        </div>

        <div className="p-4 border-b border-slate-800 bg-[#0b0f19]">
           <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
             Select Camera Target
             {selectedCamera.startsWith('Hardware') && <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px]">Customize</span>}
           </label>
           <div className="relative">
             <select 
               value={selectedCamera}
               onChange={(e) => { setSelectedCamera(e.target.value); clearPolygon(); }}
               className="w-full bg-[#131722] border border-slate-700 text-slate-200 text-sm font-medium rounded-lg px-3 py-2.5 appearance-none focus:outline-none focus:border-blue-500"
             >
               <optgroup label="Punjab Border Mock Cameras">
                   <option value="Cam 1 - Border Sector A">Cam 1 - Border Sector A</option>
                   <option value="Cam 2 - Checkpoint Alpha">Cam 2 - Checkpoint Alpha</option>
                   <option value="Cam 3 - Outpost Delta">Cam 3 - Outpost Delta</option>
               </optgroup>
               <optgroup label="Custom / Hardware Connectivity">
                   <option value="Hardware Device (Webcam 1)">Connect Local Webcam 1</option>
                   <option value="Hardware Device (Webcam 2)">Connect Local Webcam 2</option>
               </optgroup>
             </select>
             <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
           </div>
        </div>

        <div className="p-4 border-b border-slate-800 space-y-3">
           <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">Geometry Tools</label>
           
           <div className="flex gap-2">
              <button 
                onClick={clearPolygon}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-slate-700"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear Area
              </button>
              
              {!isDrawing ? (
                <button 
                  onClick={() => setIsDrawing(true)}
                  className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-blue-500/30"
                >
                  <Plus className="w-3.5 h-3.5" /> Draw New
                </button>
              ) : (
                <div className="flex-1 bg-green-500/10 text-green-400 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border border-green-500/20">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Drawing Mode
                </div>
              )}
           </div>

           <button 
              onClick={simulateBreach}
              disabled={points.length < 3 || isDrawing}
              className={`w-full py-3 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                points.length >= 3 && !isDrawing 
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
           >
              <ShieldAlert className="w-4 h-4" /> Simulate Intrusion
           </button>
        </div>

        <div className="border-b border-slate-800">
          <button 
            onClick={() => setAiExpanded(!aiExpanded)}
            className="w-full flex justify-between items-center p-4 hover:bg-slate-800/50 transition-colors"
          >
            <span className="text-sm font-medium text-slate-300">AI Analytics Layer</span>
            {aiExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>
          
          {aiExpanded && (
            <div className="px-4 pb-4 space-y-4">
              <ToggleRow label="Human Detection" checked={humanDetection} onChange={setHumanDetection} />
              <ToggleRow label="Vehicle Classification" checked={vehicleClassification} onChange={setVehicleClassification} />
            </div>
          )}
        </div>

        <div className="p-4 space-y-5">
           <div>
             <label className="block text-xs font-medium text-slate-400 mb-2">Sensitivity Threshold</label>
             <div className="flex bg-[#0b0f19] rounded-lg p-1 border border-slate-800">
               <button className="flex-1 py-1.5 text-xs text-slate-500 font-medium rounded hover:text-slate-300">High</button>
               <button className="flex-1 py-1.5 text-xs text-slate-200 font-medium bg-slate-800 rounded shadow-sm border border-slate-700">Medium</button>
               <button className="flex-1 py-1.5 text-xs text-slate-500 font-medium rounded hover:text-slate-300">Low</button>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-slate-300">{label}</span>
      <button 
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-blue-500' : 'bg-slate-700 border border-slate-600'}`}
      >
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}
