import { useState } from 'react';
import { Search, Calendar, Users, MapPin, Clock } from 'lucide-react';
import { useApp } from '../store';

export default function PeopleDetected() {
  const [search, setSearch] = useState('');
  const { faces } = useApp();

  const faceLogs = faces.map((f) => {
    const d = new Date(f.timestamp);
    return {
      id: f.id,
      date: d.toLocaleDateString(),
      time: d.toLocaleTimeString(),
      camera: f.cameraId,
      location: f.cameraId,
      screenshot: f.thumbnail || '/border_patrol_1788078522989.jpg',
      confidence: f.confidence || 0,
      notes: f.identity === 'Unknown' ? 'Unknown individual detected. Logged for review.' : `Matched with ${f.identity}.`
    };
  });

  const filtered = faceLogs.filter(p => 
    p.camera.toLowerCase().includes(search.toLowerCase()) || 
    p.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="h-6 w-6 text-accent-500" /> People Detected Log
          </h1>
          <p className="text-xs text-slate-600 mt-1">Comprehensive log of all human detections across the perimeter.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap items-center gap-4 bg-white border border-slate-200">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by location, camera..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          <Calendar className="h-4 w-4 text-slate-500" />
          <select className="bg-transparent text-sm font-medium outline-none text-slate-700">
             <option>Today (Sep 4)</option>
             <option>Yesterday (Sep 3)</option>
             <option>Last 7 Days</option>
          </select>
        </div>
      </div>

      {/* List View */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
               <thead className="bg-slate-50 border-b border-slate-200">
                 <tr>
                    <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Snapshot</th>
                    <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Location & Camera</th>
                    <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">AI Details</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {filtered.map(person => (
                    <tr key={person.id} className="hover:bg-slate-50 transition-colors">
                       <td className="px-6 py-4">
                         <div className="w-24 h-16 rounded overflow-hidden relative bg-slate-900 border border-slate-200 shadow-sm">
                            <img src={person.screenshot} alt="Person Detected" className="absolute inset-0 w-full h-full object-cover" />
                            {/* Faux bounding box */}
                            <div className="absolute inset-2 border border-green-500 rounded-sm"></div>
                         </div>
                       </td>
                       <td className="px-6 py-4">
                         <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                            <div>
                               <p className="font-bold text-slate-800">{person.location}</p>
                               <p className="text-xs text-slate-500">{person.camera}</p>
                            </div>
                         </div>
                       </td>
                       <td className="px-6 py-4">
                         <div className="flex items-center gap-2 text-slate-700 font-medium">
                            <Clock className="w-4 h-4 text-slate-400" />
                            {person.date} <br/> {person.time}
                         </div>
                       </td>
                       <td className="px-6 py-4">
                         <div className="space-y-1">
                            <span className="badge bg-green-500/10 text-green-700 border border-green-500/20 text-[10px]">
                               {person.confidence}% CONFIDENCE
                            </span>
                            <p className="text-xs text-slate-600 max-w-[200px] truncate">{person.notes}</p>
                         </div>
                       </td>
                    </tr>
                 ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
