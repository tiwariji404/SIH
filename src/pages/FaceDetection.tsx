import { useState, useRef, useEffect } from 'react';
import { useApp } from '../store';
import CameraFeed from '../components/CameraFeed';
import { ScanFace, UserCheck, UserX, AlertTriangle, Clock, MapPin, ArrowRightLeft, Camera as CameraIcon, Maximize2, Minimize2, ShieldAlert, Route } from 'lucide-react';
import type { FaceRecord } from '../types';
import { WS_BASE_URL } from '../lib/api';

export default function FaceDetection() {
  const { cameras, faces } = useApp();
  const [demoStream, setDemoStream] = useState<MediaStream | null>(null);
  const [isDemoActive, setIsDemoActive] = useState(false);
  const [forceWatchlist, setForceWatchlist] = useState(false);
  const [forceReid, setForceReid] = useState(false);
  const [fullscreenCam, setFullscreenCam] = useState<string | null>(null);

  const demoWsRef = useRef<WebSocket | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const flagsRef = useRef({ forceWatchlist, forceReid });

  useEffect(() => {
    flagsRef.current = { forceWatchlist, forceReid };
  }, [forceWatchlist, forceReid]);

  const entryCameras = cameras.filter(c => c.id === 'CAM-01' || c.id === 'CAM-05');
  const sortedFaces = [...faces].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getStatusBadge = (status: FaceRecord['status']) => {
    switch (status) {
      case 'AUTHORIZED': return <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-xs font-bold uppercase tracking-widest border border-emerald-100 flex items-center gap-1"><UserCheck className="w-3 h-3" /> Authorized</span>;
      case 'FLAGGED': return <span className="px-2 py-1 bg-red-50 text-red-600 rounded text-xs font-bold uppercase tracking-widest border border-red-100 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Flagged</span>;
      case 'UNKNOWN': return <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold uppercase tracking-widest border border-slate-200 flex items-center gap-1"><UserX className="w-3 h-3" /> Unknown</span>;
    }
  };

  const getDirectionBadge = (dir: FaceRecord['direction']) => {
    return (
      <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-widest border ${dir === 'Inbound' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
        {dir}
      </span>
    );
  };

  const startDemo = async () => {
    if (isDemoActive) {
      if (demoStream) {
        demoStream.getTracks().forEach(t => t.stop());
        setDemoStream(null);
      }
      if (demoWsRef.current) demoWsRef.current.close();
      setIsDemoActive(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setDemoStream(stream);
      setIsDemoActive(true);

      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      videoRef.current = video;
      
      const canvas = document.createElement('canvas');
      canvasRef.current = canvas;

      const ws = new WebSocket(`${WS_BASE_URL}/ws/detections`);
      demoWsRef.current = ws;

      const sendFrame = () => {
        if (!isDemoActive || !demoWsRef.current || demoWsRef.current.readyState !== WebSocket.OPEN) return;
        if (videoRef.current && canvasRef.current) {
          const v = videoRef.current;
          const c = canvasRef.current;
          if (v.videoWidth > 0) {
            c.width = v.videoWidth;
            c.height = v.videoHeight;
            const ctx = c.getContext('2d');
            if (ctx) {
              ctx.drawImage(v, 0, 0, c.width, c.height);
              const base64 = c.toDataURL('image/jpeg', 0.5);
              demoWsRef.current.send(JSON.stringify({
                type: 'frame',
                camera_id: 'CAM-01',
                image: base64,
                force_watchlist: flagsRef.current.forceWatchlist,
                force_reid: flagsRef.current.forceReid
              }));
            }
          }
        }
      };

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'set_scenario', camera_id: 'CAM-01', scenario: 'faces' }));
        setInterval(sendFrame, 1000);
      };
    } catch (e) {
      console.error("Camera access denied", e);
    }
  };

  useEffect(() => {
    return () => {
      if (demoStream) demoStream.getTracks().forEach(t => t.stop());
      if (demoWsRef.current) demoWsRef.current.close();
      setIsDemoActive(false);
    };
  }, [demoStream]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <ScanFace className="h-8 w-8 text-indigo-600" />
            Entry/Exit Access Control
          </h1>
        </div>
        
        {/* Demo Controls */}
        <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <button 
            onClick={startDemo}
            className={`flex items-center gap-2 px-4 py-2 font-bold rounded-lg shadow-sm transition-colors ${
              isDemoActive 
                ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            <CameraIcon className="w-5 h-5" />
            {isDemoActive ? 'Stop Webcam' : 'Start Webcam Demo'}
          </button>
        </div>
      </div>

      {/* Fullscreen Overlay */}
      {fullscreenCam && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col p-4 animate-in fade-in duration-200">
          <div className="flex justify-end mb-4">
            <button onClick={() => setFullscreenCam(null)} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-bold tracking-wider text-sm">
              <Minimize2 className="w-5 h-5" /> CLOSE FULLSCREEN
            </button>
          </div>
          <div className="flex-1 w-full relative">
            <CameraFeed camera={entryCameras.find(c => c.id === fullscreenCam)!} liveStream={fullscreenCam === 'CAM-01' ? demoStream : null} fullHeight={true} />
            <div className="absolute top-6 left-6 flex items-center gap-3">
              <div className="bg-red-600 animate-pulse w-3 h-3 rounded-full shadow-[0_0_10px_red]"></div>
              <span className="text-white font-mono font-bold tracking-widest text-lg drop-shadow-md">LIVE / {fullscreenCam}</span>
            </div>
          </div>
        </div>
      )}

      {/* Live Feeds Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {entryCameras.map(cam => (
          <div key={cam.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 group transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-indigo-700 font-bold tracking-widest uppercase text-sm">
                <MapPin className="w-4 h-4" />
                {cam.name} ({cam.location})
              </div>
              <button 
                onClick={() => setFullscreenCam(cam.id)}
                className="p-1.5 bg-slate-100 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 transition-colors opacity-0 group-hover:opacity-100"
                title="Fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
            <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-inner relative">
              <CameraFeed camera={cam} liveStream={cam.id === 'CAM-01' ? demoStream : null} />
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-mono border border-white/10">
                LIVENESS CHECK: ACTIVE
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Access Logs Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
            <ArrowRightLeft className="w-5 h-5 text-indigo-500" />
            Recent Access Logs
          </div>
          <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {sortedFaces.length} Records
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-500 font-bold">
              <tr>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Snapshot</th>
                <th className="px-6 py-4">Node</th>
                <th className="px-6 py-4">Flow</th>
                <th className="px-6 py-4">Match Score</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedFaces.map(face => {
                const cam = cameras.find(c => c.id === face.cameraId);
                return (
                  <tr key={face.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className={`font-bold text-base ${face.status === 'FLAGGED' ? 'text-red-600' : 'text-slate-800'}`}>
                        {face.identity}
                      </div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5">DB: {face.database}</div>
                    </td>
                    <td className="px-6 py-4">
                      {face.image ? (
                        <img src={face.image} alt="Face" className="w-10 h-10 rounded-lg object-cover border border-slate-200 shadow-sm" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                          <ScanFace className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-indigo-600">
                        {cam?.name || face.cameraId}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getDirectionBadge(face.direction)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${face.confidence > 90 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${face.confidence}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-600">{face.confidence}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(face.status)}
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(face.timestamp).toLocaleTimeString()}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {sortedFaces.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500 font-medium">
                    No access records available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
