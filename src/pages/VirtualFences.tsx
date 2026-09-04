import { useState, useRef, MouseEvent, useEffect } from 'react';
import { useApp } from '../store';
import { Settings, Shield, Plus, MoreHorizontal, ChevronDown, ChevronUp, Map as MapIcon, Camera as CameraIcon, Trash2, ShieldAlert, Check } from 'lucide-react';
import { MapContainer, TileLayer, Polygon as LeafletPolygon, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet marker icon issue in react-leaflet
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

type Point = { x: number; y: number };

export default function VirtualFences() {
  const { showToast } = useApp();
  
  const [viewMode, setViewMode] = useState<'camera' | 'map'>('camera');
  const [selectedCamera, setSelectedCamera] = useState('Cam 1 - Border Sector A');
  
  // Drawing State
  const [points, setPoints] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(true);
  
  // Simulation State
  const [isBreached, setIsBreached] = useState(false);
  const [breachPoint, setBreachPoint] = useState<Point | null>(null);

  // Map coordinates mapping for cameras (Dummy data)
  const cameraLocations: Record<string, [number, number]> = {
    'Cam 1 - Border Sector A': [28.6139, 77.2090],
    'Cam 2 - Checkpoint Alpha': [28.6150, 77.2100],
    'Cam 3 - Outpost Delta': [28.6120, 77.2080],
  };

  const currentCoords = cameraLocations[selectedCamera];

  // Map polygon coordinates (approximate conversion for demo purposes)
  // In a real app, you'd map pixel coordinates to geo coordinates using a calibration matrix
  const mapPolygonPositions = points.map(p => {
    // scale pixel (0-100) to geo offset
    const latOffset = (50 - p.y) * 0.0001; 
    const lngOffset = (p.x - 50) * 0.0001;
    return [currentCoords[0] + latOffset, currentCoords[1] + lngOffset] as [number, number];
  });

  const handleSvgClick = (e: MouseEvent<SVGSVGElement>) => {
    if (!isDrawing) return;
    
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    
    // Calculate percentage coordinates (0 to 100)
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Check if clicking near the first point to close polygon
    if (points.length >= 3) {
      const first = points[0];
      const dist = Math.sqrt(Math.pow(x - first.x, 2) + Math.pow(y - first.y, 2));
      if (dist < 3) { // 3% threshold
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
    
    // Find a point inside the polygon (approximate center for demo)
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

  // Check if a point is in polygon (Ray-casting algorithm)
  const isPointInPolygon = (point: Point, vs: Point[]) => {
    let x = point.x, y = point.y;
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        let xi = vs[i].x, yi = vs[i].y;
        let xj = vs[j].x, yj = vs[j].y;
        let intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
  };

  // AI Toggles
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
            <img 
              src="/border_fence.jpg" 
              alt="Camera Feed" 
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ${isBreached ? 'brightness-110 saturate-150' : ''}`} 
            />
            {isBreached && <div className="absolute inset-0 bg-red-900/20 mix-blend-color animate-pulse pointer-events-none" />}
            
            {/* Interactive SVG Canvas */}
            <svg 
              className="absolute inset-0 w-full h-full z-20 cursor-crosshair" 
              preserveAspectRatio="none" 
              viewBox="0 0 100 100"
              onClick={handleSvgClick}
              onMouseMove={(e) => {
                // If drawing, we could show a line to the cursor.
                // For simplicity, just handling clicks.
              }}
            >
              {/* Draw established polygon */}
              {points.length > 1 && (
                <polygon 
                  points={points.map(p => `${p.x},${p.y}`).join(' ')} 
                  fill={isBreached ? "rgba(239, 68, 68, 0.3)" : (isDrawing ? "rgba(59, 130, 246, 0.2)" : "rgba(6, 182, 212, 0.2)")} 
                  stroke={isBreached ? "rgba(239, 68, 68, 0.9)" : (isDrawing ? "rgba(59, 130, 246, 0.8)" : "rgba(6, 182, 212, 0.8)")} 
                  strokeWidth="0.5" 
                />
              )}
              
              {/* Draw nodes */}
              {points.map((p, i) => (
                <circle 
                  key={i} 
                  cx={p.x} 
                  cy={p.y} 
                  r="1" 
                  fill="white" 
                  stroke={i === 0 && isDrawing ? "yellow" : "black"} 
                  strokeWidth="0.2" 
                />
              ))}

              {/* Draw Breach Point Indicator */}
              {isBreached && breachPoint && (
                <g>
                  <circle cx={breachPoint.x} cy={breachPoint.y} r="3" fill="rgba(239, 68, 68, 0.5)" className="animate-ping" />
                  <circle cx={breachPoint.x} cy={breachPoint.y} r="1" fill="red" />
                  <rect x={breachPoint.x - 2} y={breachPoint.y - 4} width="4" height="2" fill="red" />
                  <text x={breachPoint.x} y={breachPoint.y - 5} fontSize="1.5" fill="white" textAnchor="middle" fontWeight="bold">INTRUDER</text>
                </g>
              )}
            </svg>

            {/* Instruction Overlay */}
            {isDrawing && points.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700 px-6 py-4 rounded-xl shadow-2xl flex flex-col items-center animate-bounce">
                   <Shield className="w-8 h-8 text-blue-400 mb-2" />
                   <p className="text-white font-bold text-lg">Draw Virtual Fence</p>
                   <p className="text-slate-400 text-xs mt-1">Click on the video feed to plot points.</p>
                </div>
              </div>
            )}
            
            {/* Alert Overlay */}
            {isBreached && (
               <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-red-600/90 backdrop-blur-md px-6 py-2 rounded-full border border-red-400 text-white font-bold tracking-widest text-sm shadow-[0_0_30px_rgba(239,68,68,0.6)] z-50 flex items-center gap-2">
                 <ShieldAlert className="w-5 h-5 animate-pulse" /> BREACH DETECTED IN SECTOR
               </div>
            )}
          </div>
        ) : (
          <div className="flex-1 relative z-10">
             {/* Leaflet Map */}
             <MapContainer center={currentCoords} zoom={17} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" // Dark theme map tiles
                />
                
                <Marker position={currentCoords}>
                  <Popup>
                    {selectedCamera}
                  </Popup>
                </Marker>

                {!isDrawing && mapPolygonPositions.length > 2 && (
                  <LeafletPolygon 
                    positions={mapPolygonPositions} 
                    pathOptions={{ color: isBreached ? 'red' : 'cyan', fillColor: isBreached ? 'red' : 'cyan', fillOpacity: 0.2 }} 
                  />
                )}
             </MapContainer>
             
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
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#1a1d27]">
          <h2 className="text-sm font-medium text-slate-200">Fence Configuration</h2>
          <MoreHorizontal className="w-4 h-4 text-slate-500" />
        </div>

        {/* Camera Selector */}
        <div className="p-4 border-b border-slate-800">
           <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Select Camera Target</label>
           <div className="relative">
             <select 
               value={selectedCamera}
               onChange={(e) => { setSelectedCamera(e.target.value); clearPolygon(); }}
               className="w-full bg-[#0b0f19] border border-slate-700 text-slate-200 text-sm font-medium rounded-lg px-3 py-2.5 appearance-none focus:outline-none focus:border-blue-500"
             >
               {Object.keys(cameraLocations).map(cam => (
                 <option key={cam} value={cam}>{cam}</option>
               ))}
             </select>
             <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
           </div>
        </div>

        {/* Drawing Controls */}
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

           {/* SIMULATE BUTTON */}
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

        {/* AI Feature Activation Accordion */}
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

        {/* Settings Block */}
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
