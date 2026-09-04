import { useState, useRef, useCallback } from 'react';
import { useApp } from '../store';
import CameraFeed from '../components/CameraFeed';
import { Radio, Grid3x3, Cctv, Smartphone, X, RefreshCw } from 'lucide-react';

export default function LiveSurveillance() {
  const { cameras, selectedLiveCameraIds, setSelectedLiveCameraIds, refreshCameras } = useApp();
  const [gridSize, setGridSize] = useState<'2x2' | '3x3'>('2x2');
  const [liveStream, setLiveStream] = useState<MediaStream | null>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const connectPhoneCamera = useCallback(async () => {
    setCamError(null);
    setConnecting(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not available. Use HTTPS or localhost.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setLiveStream(stream);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to access camera';
      setCamError(msg);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnectPhoneCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setLiveStream(null);
  }, []);

  const visibleCameras = selectedLiveCameraIds && selectedLiveCameraIds.length > 0
    ? cameras.filter(c => selectedLiveCameraIds.includes(c.id))
    : cameras.filter(c => c.status !== 'OFFLINE' && c.status !== 'DISCONNECTED');

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-800">Live Surveillance</h1>
          <p className="text-xs text-slate-500">Real-time CCTV monitoring · {visibleCameras.length} cameras active</p>
        </div>
        <div className="flex items-center gap-2">
          {liveStream ? (
            <button onClick={disconnectPhoneCamera} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors text-[11px] font-bold">
              <X className="h-3.5 w-3.5" /> Disconnect Phone
            </button>
          ) : (
            <button onClick={connectPhoneCamera} disabled={connecting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors text-[11px] font-bold disabled:opacity-50">
              <Smartphone className="h-3.5 w-3.5" />
              {connecting ? 'Connecting...' : 'Connect Phone'}
            </button>
          )}
          <button onClick={refreshCameras} className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-white border border-slate-200">
            <button onClick={() => setGridSize('2x2')} className={`p-1.5 rounded text-xs font-bold ${gridSize === '2x2' ? 'bg-orange-100 text-orange-700' : 'text-slate-500'}`}>
              <Grid3x3 className="h-4 w-4" />
            </button>
            <button onClick={() => setGridSize('3x3')} className={`px-2 py-1.5 rounded text-[10px] font-bold ${gridSize === '3x3' ? 'bg-orange-100 text-orange-700' : 'text-slate-500'}`}>
              3×3
            </button>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200">
            <Radio className="h-3 w-3 text-red-500 animate-pulse" />
            <span className="text-[10px] font-black text-red-600">LIVE</span>
          </div>
        </div>
      </div>

      {/* Error */}
      {camError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
          <X className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-red-700">Camera Access Failed</p>
            <p className="text-[11px] text-red-600 mt-0.5">{camError}</p>
          </div>
          <button onClick={connectPhoneCamera} className="text-[10px] text-red-600 font-bold flex items-center gap-1">
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      )}

      {liveStream && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-xs text-emerald-700 font-medium">
          <Smartphone className="h-4 w-4" /> Phone camera connected — broadcasting live feed
        </div>
      )}

      {/* Camera selector chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-wrap">
        <button onClick={() => setSelectedLiveCameraIds(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${!selectedLiveCameraIds || selectedLiveCameraIds.length === 0 ? 'bg-orange-100 text-orange-700 border-orange-300' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
          All Cameras
        </button>
        {cameras.map(cam => {
          const isSelected = selectedLiveCameraIds?.includes(cam.id);
          const isOnline = cam.status === 'ONLINE' || cam.status === 'ACTIVE' || cam.status === 'LIVE';
          return (
            <button key={cam.id} onClick={() => setSelectedLiveCameraIds([cam.id])}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 ${isSelected ? 'bg-orange-100 text-orange-700 border-orange-300' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-400'}`} />
              {cam.name || cam.id}
            </button>
          );
        })}
      </div>

      {/* Camera grid */}
      {visibleCameras.length === 0 ? (
        <div className="text-center py-16">
          <Cctv className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No live cameras available</p>
          <p className="text-xs text-slate-400 mt-1">Add cameras via Camera Management and set status to ACTIVE.</p>
        </div>
      ) : (
        <div className={`grid gap-3 ${gridSize === '2x2' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
          {visibleCameras.map(cam => (
            <div key={cam.id}>
              <CameraFeed
                camera={cam}
                detections={[]}
                liveStream={liveStream}
              />
              <div className="mt-1.5 flex items-center justify-between gap-2 px-1">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-700 truncate">{cam.name || cam.id}</p>
                  <p className="text-[10px] text-slate-400">{cam.bop || ''}{cam.location ? ` · ${cam.location}` : ''}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border flex-shrink-0 ${
                  cam.status === 'ONLINE' || cam.status === 'ACTIVE' || cam.status === 'LIVE'
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : 'text-red-600 bg-red-50 border-red-200'
                }`}>{cam.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Offline notice */}
      {cameras.some(c => c.status === 'OFFLINE' || c.status === 'DISCONNECTED') && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-xs text-red-600">
          <Cctv className="h-4 w-4" />
          {cameras.filter(c => c.status === 'OFFLINE' || c.status === 'DISCONNECTED').length} camera(s) offline
        </div>
      )}
    </div>
  );
}
