import { useState } from 'react';
import { Search, Users, CheckCircle, HelpCircle, AlertCircle, Box, Camera, User as UserIcon, Calendar, MapPin, Clock } from 'lucide-react';

// Combined mock data type for the merged view
type DetectedEntity = {
  id: string;
  type: 'PERSON' | 'OBJECT';
  identity: string; // 'Unknown Person', 'Unattended Baggage', 'Rajendra Tiwari', etc.
  status: 'AUTHORIZED' | 'UNKNOWN' | 'FLAGGED' | 'DANGEROUS';
  confidence: number;
  cameraId: string;
  location: string;
  timestamp: string;
  details: string;
  photos: string[]; // 3-4 angles
};

// Generate realistic mock data for today
const todayStr = new Date().toLocaleDateString('en-IN');
const mockData: DetectedEntity[] = [
  {
    id: 'ENT-001',
    type: 'PERSON',
    identity: 'Unknown Person A',
    status: 'UNKNOWN',
    confidence: 89,
    cameraId: 'Cam 1 - Border Sector A',
    location: 'North Fence',
    timestamp: `${todayStr}, 09:15 AM`,
    details: 'Unrecognized individual lingering near the border fence. Face partially covered.',
    photos: [
      'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=150&h=150&fit=crop',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop',
      'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=150&h=150&fit=crop'
    ]
  },
  {
    id: 'ENT-002',
    type: 'PERSON',
    identity: 'Rahul Sharma',
    status: 'AUTHORIZED',
    confidence: 98,
    cameraId: 'Cam 3 - Outpost Delta',
    location: 'Main Entry Gate',
    timestamp: `${todayStr}, 10:45 AM`,
    details: 'Authorized personnel. ID matched with centralized database. Shift started.',
    photos: [
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop'
    ]
  },
  {
    id: 'ENT-003',
    type: 'OBJECT',
    identity: 'Suspicious Backpack',
    status: 'FLAGGED',
    confidence: 94,
    cameraId: 'Cam 2 - Checkpoint Alpha',
    location: 'Checkpoint Alpha Waiting Area',
    timestamp: `${todayStr}, 11:20 AM`,
    details: 'Unattended dark backpack left on the bench for over 15 minutes. Heat signature matches standard non-biological.',
    photos: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=150&h=150&fit=crop',
      'https://images.unsplash.com/photo-1491336477066-31156b5e4f35?w=150&h=150&fit=crop',
      'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=150&h=150&fit=crop',
      'https://images.unsplash.com/photo-1547949003-9792a18a2601?w=150&h=150&fit=crop'
    ]
  },
  {
    id: 'ENT-004',
    type: 'OBJECT',
    identity: 'Concealed Weapon / Rifle',
    status: 'DANGEROUS',
    confidence: 99,
    cameraId: 'Cam 1 - Border Sector A',
    location: 'Sector A Bushes',
    timestamp: `${todayStr}, 01:10 PM`,
    details: 'Long metallic object detected matching the thermal and shape profile of an assault rifle.',
    photos: [
      'https://images.unsplash.com/photo-1595590424283-b8f1784cb2c8?w=150&h=150&fit=crop',
      'https://images.unsplash.com/photo-1584281729424-65123011e4cb?w=150&h=150&fit=crop'
    ]
  }
];

export default function FaceDetection() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = mockData.filter(f => {
    if (search && !f.identity.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'ALL' && f.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div>
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Face & Object Detection</h1>
        <p className="text-sm font-semibold text-slate-600 mt-1">Unified centralized view of all recognized faces and suspicious objects per day</p>
      </div>

      <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-start gap-3 shadow-sm">
        <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-slate-800">Unified Detection Protocol Active</h4>
          <p className="text-xs font-semibold text-slate-600 mt-1">
            System automatically merges duplicate faces captured on the same day into a single profile with multiple angles (3-4 photos). Suspicious objects are tracked alongside identities for rapid threat assessment.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search identity or object..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 text-slate-800 font-semibold transition-all" 
          />
        </div>
        {['ALL', 'AUTHORIZED', 'UNKNOWN', 'FLAGGED', 'DANGEROUS'].map(s => (
          <button 
            key={s} 
            onClick={() => setStatusFilter(s)} 
            className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-colors border ${
              statusFilter === s 
                ? 'bg-slate-800 text-white border-slate-800 shadow-md' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filtered.map(item => (
          <div key={item.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row group hover:shadow-md transition-shadow">
            
            {/* Multiple Photos Gallery */}
            <div className="md:w-2/5 p-4 bg-slate-50 border-r border-slate-100 flex flex-col gap-2">
              {item.photos.length > 0 ? (
                <>
                  <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                    <img src={item.photos[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Primary Angle" />
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase">
                      Angle 1
                    </div>
                  </div>
                  {item.photos.length > 1 && (
                    <div className="grid grid-cols-3 gap-2">
                      {item.photos.slice(1, 4).map((photo, idx) => (
                        <div key={idx} className="relative aspect-square rounded-md overflow-hidden border border-slate-200">
                          <img src={photo} className="w-full h-full object-cover" alt={`Angle ${idx + 2}`} />
                          <div className="absolute top-1 left-1 bg-black/60 text-white px-1 py-0.5 rounded text-[8px] font-bold">
                            A{idx + 2}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                 <div className="flex-1 flex items-center justify-center bg-slate-200 rounded-lg">
                   <Camera className="w-8 h-8 text-slate-400" />
                 </div>
              )}
            </div>

            {/* Details */}
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {item.type === 'PERSON' ? <UserIcon className="w-4 h-4 text-slate-500" /> : <Box className="w-4 h-4 text-slate-500" />}
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{item.type}</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-800 leading-tight">{item.identity}</h3>
                </div>
                
                {item.status === 'AUTHORIZED' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wider"><CheckCircle className="w-3 h-3" /> Authorized</span>
                ) : item.status === 'FLAGGED' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold uppercase tracking-wider"><AlertCircle className="w-3 h-3" /> Flagged</span>
                ) : item.status === 'DANGEROUS' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold uppercase tracking-wider animate-pulse"><AlertCircle className="w-3 h-3" /> Dangerous</span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider"><HelpCircle className="w-3 h-3" /> Unknown</span>
                )}
              </div>

              <p className="text-sm text-slate-600 font-medium leading-relaxed mb-6 flex-1">
                {item.details}
              </p>

              <div className="grid grid-cols-2 gap-y-3 gap-x-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Location</p>
                    <p className="text-xs font-semibold text-slate-800 truncate" title={item.location}>{item.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Source Camera</p>
                    <p className="text-xs font-semibold text-slate-800 truncate" title={item.cameraId}>{item.cameraId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">First Spotted</p>
                    <p className="text-xs font-semibold text-slate-800 truncate">{item.timestamp}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">AI Confidence</p>
                    <p className="text-xs font-semibold text-slate-800 truncate">{item.confidence}% Match</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white border border-slate-200 p-12 rounded-xl text-center shadow-sm">
          <Users className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No detections found</h3>
          <p className="text-sm text-slate-500 font-medium mt-1">Try adjusting your filters or search query.</p>
        </div>
      )}
    </div>
  );
}
