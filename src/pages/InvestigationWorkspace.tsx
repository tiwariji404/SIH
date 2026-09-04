import { useState, useEffect } from 'react';
import { useApp } from '../store';
import { Search, ShieldCheck, ShieldAlert, FileSearch, HardDrive, List } from 'lucide-react';

export default function InvestigationWorkspace() {
  const { token, toast, showToast } = useApp();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetchIncidents();
  }, [token]);

  const fetchIncidents = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // Assuming GET /api/v1/analytics/incidents returns incidents with related events and evidence
      const res = await fetch('/api/v1/analytics/incidents', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIncidents(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEvidence = async (evidenceId: string) => {
    if (!token) return;
    setVerifying(true);
    setVerificationResult(null);
    try {
      const res = await fetch(`/api/v1/analytics/evidence/${evidenceId}/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setVerificationResult(data);
        if (data.status === 'VERIFIED') {
          showToast({ type: 'success', title: 'Integrity SECURE', message: 'Cryptographic Ledger & File Match.' });
        } else {
          showToast({ type: 'alert', title: 'Integrity COMPROMISED', message: data.status });
        }
      }
    } catch (e) {
      console.error(e);
      showToast({ type: 'alert', title: 'Error', message: 'Could not connect to integrity service' });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in flex flex-col h-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileSearch className="h-5 w-5 text-orange-600" />
            Investigation Workspace
          </h1>
          <p className="text-xs text-slate-600">Multi-Camera Incident Timeline & Evidence Vault</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
        {/* Incident List */}
        <div className="card p-0 flex flex-col h-full bg-white border border-slate-200">
          <div className="p-3 border-b border-slate-200 bg-slate-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search incidents..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                className="input pl-9 w-full text-sm py-1.5"
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {incidents.filter(i => i.title?.toLowerCase().includes(search.toLowerCase())).map(incident => (
              <button
                key={incident.id}
                onClick={() => setSelectedIncident(incident)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedIncident?.id === incident.id 
                    ? 'border-orange-500 bg-orange-50/50 shadow-sm' 
                    : 'border-slate-200 hover:border-orange-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-sm font-bold text-slate-800 line-clamp-1">{incident.title}</h3>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${incident.status === 'OPEN' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                    {incident.status}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-mono">
                  {new Date(incident.created_at).toLocaleString()}
                </p>
              </button>
            ))}
            {incidents.length === 0 && !loading && (
              <div className="text-center p-8 text-slate-500">
                <List className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No incidents found in DB</p>
              </div>
            )}
          </div>
        </div>

        {/* Incident Timeline & Vault Details */}
        <div className="lg:col-span-2 flex flex-col h-full card p-0 bg-white border border-slate-200">
          {selectedIncident ? (
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <div>
                  <h2 className="font-black text-slate-800 uppercase tracking-tight">{selectedIncident.title}</h2>
                  <p className="text-xs text-slate-500 font-mono">ID: {selectedIncident.id}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                
                {/* Events Timeline Segment */}
                <div>
                  <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-3">Event Timeline</h3>
                  {selectedIncident.events && selectedIncident.events.length > 0 ? (
                    <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                       {selectedIncident.events.map((evt: any) => (
                         <div key={evt.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                           <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 group-[.is-active]:bg-orange-500 text-slate-500 group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                              <List className="h-4 w-4" />
                           </div>
                           <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] card p-3 shadow border border-slate-200">
                             <div className="flex justify-between font-bold text-xs mb-1">
                               <span className="text-slate-800">{evt.eventType}</span>
                               <span className="text-slate-500 font-mono">{new Date(evt.event_timestamp).toLocaleTimeString()}</span>
                             </div>
                             <p className="text-[10px] text-slate-600">Camera: {evt.cameraId}</p>
                             <p className="text-[10px] text-slate-600">Score: {evt.riskScore} | {evt.severity}</p>
                           </div>
                         </div>
                       ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No events mapped</p>
                  )}
                </div>

                {/* Evidence Vault Segment */}
                <div>
                  <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-3 flex items-center gap-1">
                    <HardDrive className="h-4 w-4" />
                    Evidence Vault
                  </h3>
                  {selectedIncident.evidence && selectedIncident.evidence.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedIncident.evidence.map((ev: any) => (
                        <div key={ev.id} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                          <img src={ev.file_url || '/placeholder.jpg'} alt="Evidence" className="w-full h-32 object-cover rounded bg-slate-200 mb-2 border border-slate-300" />
                          <div className="flex justify-between items-center">
                            <p className="text-[10px] font-mono text-slate-500 truncate w-32" title={ev.sha256_hash}>
                              {ev.sha256_hash}
                            </p>
                            <button 
                              onClick={() => handleVerifyEvidence(ev.id)}
                              disabled={verifying}
                              className="px-2 py-1 bg-slate-800 text-white rounded text-[10px] font-bold hover:bg-slate-700 flex items-center gap-1"
                            >
                              {verifying ? '...' : (ev.integrity_status === 'VERIFIED' ? <ShieldCheck className="h-3 w-3 text-green-400" /> : <ShieldAlert className="h-3 w-3" />)}
                              Verify Ledger
                            </button>
                          </div>
                          {verificationResult && ev.id === verificationResult.evidence_id && (
                            <div className="mt-2 p-2 bg-slate-100 rounded text-[9px] font-mono whitespace-pre-wrap text-slate-700 border border-slate-200">
                              Data: {JSON.stringify(verificationResult, null, 2)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No evidence attached safely</p>
                  )}
                </div>

              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full items-center justify-center p-8 text-center text-slate-500">
              <FileSearch className="h-12 w-12 text-slate-300 mb-4" />
              <p className="text-sm font-semibold">Select an incident to view details</p>
              <p className="text-xs mt-1">Timeline correlation and evidence vault requires selection</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
