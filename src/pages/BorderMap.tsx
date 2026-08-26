import { useState, useRef, useMemo, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Polygon, Marker } from '@react-google-maps/api';
import { useFirebaseTelemetry } from '../lib/firebase';
import { Shield, Radio, Activity, AlertTriangle, Crosshair, MapPin, Search } from 'lucide-react';
import './BorderMap.css';

// Replace with real Google Maps API Key. If left empty, it will load with a watermark.
const GOOGLE_MAPS_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY";

const containerStyle = {
  width: '100%',
  height: '100%'
};

const SECTORS: Record<string, { lat: number; lng: number; zoom: number; description: string }> = {
  'Sector Alpha': { lng: 77.2090, lat: 28.6139, zoom: 15, description: 'Northern Border Approach' },
  'Sector Bravo': { lng: 77.2100, lat: 28.6250, zoom: 16, description: 'Eastern Checkpoint' },
  'Sector Charlie': { lng: 77.2205, lat: 28.6105, zoom: 15, description: 'Valley Passage' },
};

export default function BorderMap() {
  const telemetryEvents = useFirebaseTelemetry();
  const [selectedSector, setSelectedSector] = useState<string>('Sector Alpha');
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [center, setCenter] = useState({ 
    lat: SECTORS['Sector Alpha'].lat, 
    lng: SECTORS['Sector Alpha'].lng 
  });
  
  const [zoom, setZoom] = useState(SECTORS['Sector Alpha'].zoom);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY || ''
  });

  const onLoad = useCallback(function callback(mapInstance: google.maps.Map) {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  const handleFlyToSector = (sectorName: string) => {
    setSelectedSector(sectorName);
    const data = SECTORS[sectorName];
    setCenter({ lat: data.lat, lng: data.lng });
    setZoom(data.zoom);
    if (map) {
      map.panTo({ lat: data.lat, lng: data.lng });
      map.setZoom(data.zoom);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    try {
      // Using openstreetmap for geocoding so it works even without a valid Google Geocoding API key
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const result = data[0];
        const newLat = parseFloat(result.lat);
        const newLng = parseFloat(result.lon);
        
        setSelectedSector('Custom Search');
        setCenter({ lat: newLat, lng: newLng });
        setZoom(15);
        if (map) {
          map.panTo({ lat: newLat, lng: newLng });
          map.setZoom(15);
        }
      } else {
        alert("Location not found. Try a different search term.");
      }
    } catch (err) {
      console.error("Geocoding failed", err);
    }
  };

  // Google Maps Polygon format
  const restrictedZonePaths = useMemo(() => [
    { lat: 28.615, lng: 77.205 },
    { lat: 28.615, lng: 77.215 },
    { lat: 28.618, lng: 77.215 },
    { lat: 28.618, lng: 77.205 }
  ], []);

  const bufferZonePaths = useMemo(() => [
    { lat: 28.610, lng: 77.200 },
    { lat: 28.610, lng: 77.210 },
    { lat: 28.613, lng: 77.210 },
    { lat: 28.613, lng: 77.200 }
  ], []);

  return (
    <div className="space-y-4 animate-fade-in flex flex-col h-[calc(100vh-100px)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Tactical GIS & Telemetry</h1>
          <p className="text-xs text-slate-600">Pure Google Maps integration with live Firestore telemetry.</p>
        </div>
        
        {/* Custom Location Search */}
        <form onSubmit={handleSearch} className="flex gap-2 relative w-64">
          <input 
            type="text" 
            placeholder="Search custom location..." 
            className="input text-sm py-1.5 px-3 pr-10 w-full"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-900">
             <Search className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* 3-Column Systematic Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0">
        
        {/* LEFT COLUMN: Navigation Console */}
        <div className="card p-4 overflow-y-auto hidden lg:flex flex-col border-r border-slate-200">
          <h3 className="text-xs font-bold text-slate-600 mb-4 uppercase tracking-widest flex items-center gap-2">
            <Crosshair className="h-4 w-4" /> Targeting & Sectors
          </h3>
          <div className="space-y-2">
            {Object.entries(SECTORS).map(([name, data]) => {
              const isSelected = selectedSector === name;
              return (
                <button
                  key={name}
                  onClick={() => handleFlyToSector(name)}
                  className={`w-full text-left p-3 rounded border transition-colors ${
                    isSelected 
                     ? 'bg-slate-100 border-accent-500/50 text-accent-300' 
                     : 'bg-white border-slate-200 hover:bg-white/10 text-slate-700'
                  }`}
                >
                  <div className="font-bold text-sm tracking-wide">{name}</div>
                  <div className="text-[10px] text-slate-600 mt-1 uppercase font-mono">
                    {data.description}
                  </div>
                  <div className="text-[9px] font-mono text-slate-600 mt-2">
                    LNG: {data.lng.toFixed(4)} | LAT: {data.lat.toFixed(4)}
                  </div>
                </button>
              )
            })}
          </div>
          
          <div className="mt-auto pt-4 border-t border-slate-200">
             <h4 className="text-[10px] font-bold text-slate-600 mb-2 uppercase">Map Legend</h4>
             <div className="space-y-2">
               <div className="flex items-center gap-2 text-xs font-mono text-slate-700">
                 <div className="w-3 h-3 bg-red-500/30 border border-red-500 rounded-sm"></div>
                 Restricted Zone
               </div>
               <div className="flex items-center gap-2 text-xs font-mono text-slate-700">
                 <div className="w-3 h-3 bg-emerald-500/30 border border-emerald-500 rounded-sm"></div>
                 Buffer / Accessible
               </div>
             </div>
          </div>
        </div>

        {/* CENTER COLUMN: Google Map Engine */}
        <div className="card lg:col-span-2 overflow-hidden relative border border-slate-200">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={center}
              zoom={zoom}
              onLoad={onLoad}
              onUnmount={onUnmount}
              options={{
                mapTypeId: 'satellite',
                disableDefaultUI: false, // Keep basic controls
                zoomControl: true,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: true
              }}
            >
              {/* Restricted Zone Polygon */}
              <Polygon
                paths={restrictedZonePaths}
                options={{
                  fillColor: "#ef4444",
                  fillOpacity: 0.2,
                  strokeColor: "#ef4444",
                  strokeOpacity: 0.8,
                  strokeWeight: 2,
                }}
              />

              {/* Buffer Zone Polygon */}
              <Polygon
                paths={bufferZonePaths}
                options={{
                  fillColor: "#10b981",
                  fillOpacity: 0.15,
                  strokeColor: "#10b981",
                  strokeOpacity: 0.8,
                  strokeWeight: 1,
                }}
              />

              {/* Telemetry Markers */}
              {telemetryEvents.map(evt => {
                const isIntrusion = evt.type === 'INTRUSION';
                const isOffline = evt.type === 'OFFLINE';
                
                // Using standard Google Map markers since custom HTML markers require advanced OverlayViews
                // We'll use color-coded marker URLs
                let iconUrl = "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
                if (isIntrusion) iconUrl = "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
                if (isOffline) iconUrl = "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";

                return (
                  <Marker
                    key={evt.id}
                    position={{ lat: evt.coordinates[1], lng: evt.coordinates[0] }}
                    icon={{ url: iconUrl }}
                    title={evt.type}
                  />
                );
              })}
            </GoogleMap>
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-slate-100">
               <p className="text-slate-600 animate-pulse">Loading Google Maps API...</p>
            </div>
          )}

          {/* Map Overlay Status */}
          <div className="absolute top-4 left-4 z-10 pointer-events-none flex gap-2">
            <span className="badge bg-white/90 border border-slate-200 backdrop-blur-md text-slate-700 font-mono text-[10px]">
              <Radio className="inline h-3 w-3 mr-1 text-accent-400" /> SATCOM LINK
            </span>
            <span className="badge bg-white/90 border border-slate-200 backdrop-blur-md text-slate-700 font-mono text-[10px]">
              <Shield className="inline h-3 w-3 mr-1 text-accent-400" /> {selectedSector}
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Telemetry Logs */}
        <div className="card p-4 overflow-y-auto hidden lg:flex flex-col border-l border-slate-200">
          <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
             <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
               <Activity className="h-4 w-4 text-emerald-400 animate-pulse" /> Telemetry Logs
             </h3>
             <span className="badge bg-emerald-500/20 text-emerald-400 text-[9px] uppercase border border-emerald-500/30">Live Sync</span>
          </div>
          
          <div className="space-y-3">
            {telemetryEvents.map(evt => (
              <div 
                key={evt.id} 
                className={`p-3 rounded-md border ${
                  evt.type === 'INTRUSION' ? 'bg-red-500/10 border-red-500/30' : 
                  evt.type === 'OFFLINE' ? 'bg-amber-500/10 border-amber-500/30' : 
                  'bg-emerald-500/5 border-emerald-500/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                   <div className="flex items-center gap-1.5">
                     {evt.type === 'INTRUSION' && <AlertTriangle className="h-3.5 w-3.5 text-red-400" />}
                     {evt.type === 'OFFLINE' && <Radio className="h-3.5 w-3.5 text-amber-400" />}
                     {evt.type === 'ACTIVE' && <Shield className="h-3.5 w-3.5 text-emerald-400" />}
                     <span className={`text-[10px] font-bold tracking-wider ${
                        evt.type === 'INTRUSION' ? 'text-red-400' : 
                        evt.type === 'OFFLINE' ? 'text-amber-400' : 
                        'text-emerald-400'
                     }`}>{evt.type}</span>
                   </div>
                   <span className="text-[9px] font-mono text-slate-600">
                     {new Date(evt.timestamp).toLocaleTimeString()}
                   </span>
                </div>
                
                <p className="text-xs text-slate-800 mb-2 leading-relaxed">
                  {evt.message}
                </p>
                
                <div className="flex items-center gap-2 text-[9px] font-mono text-slate-600 bg-black/30 rounded p-1.5 border border-slate-200">
                  <MapPin className="h-3 w-3 text-slate-600" />
                  <span>{evt.sector}</span>
                  <span className="text-slate-600">|</span>
                  <span>[{evt.coordinates[0].toFixed(3)}, {evt.coordinates[1].toFixed(3)}]</span>
                </div>
              </div>
            ))}
            
            {telemetryEvents.length === 0 && (
               <div className="text-center text-xs text-slate-600 py-10 font-mono italic">
                 Awaiting telemetry data...
               </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
