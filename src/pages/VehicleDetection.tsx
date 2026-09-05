import { useState } from 'react';
import { Search, Car, MapPin, Clock, Camera } from 'lucide-react';
import { useApp } from '../store';

export default function VehicleDetection() {
  const { vehicles, cameras } = useApp();
  const [search, setSearch] = useState('');
  
  // Fallback Mock Data for Vehicles & Drivers if empty
  const mockVehicles = [
    {
      id: 'VD-001',
      plate: 'DL-8C-AB1234',
      type: 'SUV',
      date: '2026-09-04',
      time: '14:23:10',
      camera: 'Cam-12 Border Sector B',
      location: 'Sector B - Main Road',
      vehiclePhoto: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&q=80',
      driverPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
      status: 'AUTHORIZED'
    },
    {
      id: 'VD-002',
      plate: 'MH-12-XY9876',
      type: 'TRUCK',
      date: '2026-09-04',
      time: '11:05:42',
      camera: 'Cam-03 Checkpoint Alpha',
      location: 'Checkpoint Alpha - Cargo Bay',
      vehiclePhoto: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&q=80',
      driverPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
      status: 'UNKNOWN'
    },
    {
      id: 'VD-003',
      plate: 'UNKNOWN_PLATE',
      type: 'CAR',
      date: '2026-09-03',
      time: '23:45:11',
      camera: 'Cam-08 Night Vision Perimeter',
      location: 'Perimeter Wall - North',
      vehiclePhoto: 'https://images.unsplash.com/photo-1555122119-90656a88b506?w=400&q=80',
      driverPhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
      status: 'WATCHLIST'
    },
  ];

  const displayVehicles = vehicles && vehicles.length > 0
    ? vehicles.map(v => {
        const cam = cameras.find(c => c.id === v.cameraId);
        const dt = new Date(v.timestamp);
        return {
          id: v.id,
          plate: v.plateNumber,
          type: v.vehicleType || 'Vehicle',
          date: isNaN(dt.getTime()) ? 'Recent' : dt.toLocaleDateString('en-IN'),
          time: isNaN(dt.getTime()) ? 'Live' : dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
          camera: cam ? `${cam.id} ${cam.name}` : v.cameraId,
          location: cam?.location || v.direction || 'Checkpoint Alpha',
          vehiclePhoto: v.image || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&q=80',
          driverPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
          status: v.status || 'UNKNOWN',
        };
      })
    : mockVehicles;

  const filtered = displayVehicles.filter(v => 
    v.plate.toLowerCase().includes(search.toLowerCase()) || 
    v.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Car className="h-6 w-6 text-blue-500" /> Vehicle & Occupant Log
          </h1>
          <p className="text-xs text-slate-600 mt-1">Full vehicle information including ANPR plates and extracted driver photos.</p>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4 relative">
        <Search className="absolute left-7 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search by license plate, vehicle type..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10 w-full md:w-1/2 bg-white"
        />
      </div>

      {/* Vehicle Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filtered.map(vehicle => (
          <div key={vehicle.id} className="card p-0 overflow-hidden flex flex-col sm:flex-row border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
             
             {/* Left side: Vehicle Photo */}
             <div className="w-full sm:w-2/5 h-48 sm:h-auto relative bg-slate-900 border-r border-slate-200">
                <img src={vehicle.vehiclePhoto} alt="Vehicle" className="absolute inset-0 w-full h-full object-cover opacity-90" />
                <div className="absolute top-2 left-2 badge bg-black/70 text-white backdrop-blur-md border-none font-mono tracking-widest shadow-lg">
                  {vehicle.plate}
                </div>
                <div className="absolute bottom-2 left-2 right-2 flex gap-1">
                   <div className="bg-blue-600 w-1/3 h-1 rounded-full"></div>
                   <div className="bg-blue-600/30 w-1/3 h-1 rounded-full"></div>
                   <div className="bg-blue-600/30 w-1/3 h-1 rounded-full"></div>
                </div>
             </div>

             {/* Right side: Details & Driver */}
             <div className="flex-1 p-4 flex flex-col justify-between bg-white">
                <div>
                   <div className="flex justify-between items-start mb-4">
                     <div>
                       <h3 className="font-extrabold text-slate-800 text-lg uppercase tracking-wide">{vehicle.type}</h3>
                       <span className={`badge text-[10px] mt-1 ${
                          vehicle.status === 'AUTHORIZED' ? 'bg-emerald-100 text-emerald-700' :
                          vehicle.status === 'WATCHLIST' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-600'
                       }`}>
                         {vehicle.status}
                       </span>
                     </div>
                     {/* Driver Snapshot */}
                     <div className="flex flex-col items-center gap-1">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-100 shadow-sm">
                           <img src={vehicle.driverPhoto} alt="Driver" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1">
                           <Camera className="w-3 h-3" /> Driver
                        </span>
                     </div>
                   </div>

                   <div className="space-y-2">
                     <div className="flex items-start gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                        <div>
                           <p className="font-bold text-slate-700">{vehicle.location}</p>
                           <p className="text-xs text-slate-500">{vehicle.camera}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-slate-700">{vehicle.date} at {vehicle.time}</span>
                     </div>
                   </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                   <button className="flex-1 btn-ghost text-xs py-1.5 border border-slate-200">
                     View Full Log
                   </button>
                   {vehicle.status !== 'AUTHORIZED' && (
                     <button className="flex-1 btn-primary text-xs py-1.5 bg-slate-800 hover:bg-slate-700">
                       Verify ID
                     </button>
                   )}
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
