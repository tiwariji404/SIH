import { useState, useRef } from 'react';
import { useApp } from '../store';
import { Search, ShieldAlert, CheckCircle, HelpCircle, Plus, Camera, Car, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

export default function ANPR() {
  const { vehicles, showToast, addToWatchlist, watchlistPlates } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Registration Form State
  const [regPlate, setRegPlate] = useState('');
  const [regReason, setRegReason] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regPlate) return;
    
    addToWatchlist(regPlate);
    
    // In production, this pushes to Firebase / FastAPI DB
    showToast({ type: 'success', title: 'Vehicle Registered', message: `Plate ${regPlate} added to Watchlist.` });
    setRegPlate('');
    setRegReason('');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
        const res = await api.analytics.uploadWatchlistPhoto(file);
        if (res.ok) {
            setRegPlate(res.plate_number);
            showToast({ type: 'success', title: 'OCR Successful', message: `Extracted plate ${res.plate_number} from image.` });
            addToWatchlist(res.plate_number);
        }
    } catch (err: any) {
        showToast({ type: 'alert', title: 'OCR Failed', message: err.message || 'Failed to extract text from photo.' });
    } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filtered = vehicles.filter(v => {
    if (search && !v.plateNumber.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'ALL' && v.status !== statusFilter) return false;
    return true;
  });

  const watchlisted = vehicles.filter(v => watchlistPlates.includes(v.plateNumber.toUpperCase()) || v.status === 'WATCHLIST');

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-900">ANPR — Automatic Number Plate Recognition</h1>
        <p className="text-xs text-slate-600">{vehicles.length} plate captures • {watchlistPlates.length} watchlist plates</p>
      </div>

      {/* Watchlist alert */}
      {watchlisted.length > 0 && (
        <div className="card p-4 border-red-500/30 bg-red-500/5 mb-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-red-400 animate-pulse" />
            <div>
              <p className="text-sm font-semibold text-red-300">Watchlist Vehicle Detected</p>
              <p className="text-xs text-slate-600">Plate {watchlisted[0].plateNumber} detected at {watchlisted[0].cameraId}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Col: Registration Form */}
        <div className="lg:col-span-4 space-y-4">
          <div className="card p-6 border-slate-200 shadow-sm bg-white top-4 sticky">
             <h2 className="text-lg font-black text-slate-800 border-b border-slate-200 pb-3 mb-4 flex items-center gap-2">
                <Plus className="h-5 w-5 text-accent-600" /> Add to Watchlist
             </h2>
             <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Target Plate Number</label>
                  <div className="relative">
                    <Car className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. DL 1C AB 1234" 
                      value={regPlate}
                      onChange={e => setRegPlate(e.target.value)}
                      className="input pl-10 font-mono font-bold text-slate-800 uppercase"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Suspicion Details</label>
                  <textarea 
                    rows={3}
                    placeholder="Provide reason for watchlist..." 
                    value={regReason}
                    onChange={e => setRegReason(e.target.value)}
                    className="input font-medium text-sm text-slate-800 resize-none"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Upload Reference Photo</label>
                  <div 
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    className={`border-2 border-dashed ${isUploading ? 'border-accent-200 bg-accent-50 text-accent-500' : 'border-slate-300 hover:border-accent-400 hover:bg-slate-50 text-slate-500'} rounded-lg p-6 flex flex-col items-center justify-center transition-colors cursor-pointer`}
                  >
                    {isUploading ? <Loader2 className="h-6 w-6 mb-2 animate-spin" /> : <Camera className="h-6 w-6 mb-2" />}
                    <span className="text-xs font-semibold">{isUploading ? 'Extracting Plate...' : 'Click to upload photo for Auto-OCR'}</span>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>
                <button type="submit" disabled={isUploading} className="btn-primary w-full p-3 uppercase tracking-widest font-bold disabled:opacity-50">Register Vehicle</button>

             </form>
          </div>
        </div>

        {/* Right Col: Live Feed */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
              <input type="text" placeholder="Search plate number..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-10 bg-white" />
            </div>
            {['ALL', 'AUTHORIZED', 'WATCHLIST', 'UNKNOWN'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`badge ${statusFilter === s ? 'bg-accent-500 text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`}>{s}</button>
            ))}
          </div>

          {/* Plate grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.slice(0, 30).map(v => {
              return (
            <div key={v.id} className={`card p-4 ${v.status === 'WATCHLIST' ? 'border-red-500/30 bg-red-500/5' : ''}`}>
              {/* Simulated vehicle image */}
              <div className="relative h-28 rounded-lg bg-gradient-to-b from-slate-700/40 to-slate-900/60 mb-3 overflow-hidden border border-slate-200">
                <div className="absolute inset-0 grid-overlay opacity-30" />
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                  <div className="h-6 w-24 rounded bg-slate-600/60" />
                  <div className="mx-auto -mt-4 h-4 w-20 rounded-t bg-slate-500/50" />
                </div>
                {/* Plate highlight */}
                <div className="absolute bottom-1 right-2 bg-amber-400/20 border border-amber-400/50 rounded px-1.5 py-0.5">
                  <span className="text-[9px] font-mono text-amber-300">{v.plateNumber}</span>
                </div>
              </div>

              {/* Plate number */}
              <div className="flex items-center justify-between mb-2">
                <div className="px-2 py-1 rounded bg-yellow-400/90 text-black font-mono font-bold text-sm tracking-wider">
                  {v.plateNumber}
                </div>
                <StatusBadge status={v.status} />
              </div>

              <div className="space-y-1 text-[11px]">
                <Row label="Vehicle" value={v.vehicleType} />
                <Row label="Camera" value={v.cameraId} />
                <Row label="Direction" value={v.direction} />
                <Row label="Confidence" value={`${v.confidence}%`} />
                <Row label="Time" value={new Date(v.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })} />
              </div>
            </div>
          );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'WATCHLIST') return <span className="badge bg-red-500/20 text-red-400 border border-red-500/30"><ShieldAlert className="h-3 w-3" /> WATCHLIST</span>;
  if (status === 'AUTHORIZED') return <span className="badge bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"><CheckCircle className="h-3 w-3" /> AUTHORIZED</span>;
  return <span className="badge bg-slate-500/20 text-slate-600 border border-slate-500/30"><HelpCircle className="h-3 w-3" /> UNKNOWN</span>;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-600">{label}:</span>
      <span className="text-slate-700">{value}</span>
    </div>
  );
}
