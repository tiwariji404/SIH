import { useState, useEffect } from 'react';
import { useApp } from '../store';
import { Shield, ShieldCheck, ShieldAlert, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Hash } from 'lucide-react';
import { formatTime } from '../types';
import { api } from '../lib/api';

export default function Evidence() {
  const { evidence, refreshEvidence, showToast, token } = useApp();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [verifyResults, setVerifyResults] = useState<Record<string, any>>({});

  useEffect(() => {
    setLoading(true);
    refreshEvidence().finally(() => setLoading(false));
  }, []);

  const verifyIntegrity = async (id: string) => {
    setVerifying(id);
    try {
      const result = await api.analytics.verifyEvidence(id);
      setVerifyResults(prev => ({ ...prev, [id]: result }));
      if (result.status === 'VERIFIED' || result.status === 'PARTIAL_VERIFIED_NO_LEDGER') {
        showToast({ type: 'success', title: 'Integrity Verified', message: `Evidence ${id.slice(0, 8)} integrity confirmed.` });
      } else {
        showToast({ type: 'alert', title: 'INTEGRITY FAILURE', message: `Evidence ${id.slice(0, 8)} may be compromised!` });
      }
    } catch (e: any) {
      showToast({ type: 'warning', title: 'Verification Error', message: e.message });
    } finally {
      setVerifying(null);
    }
  };

  if (loading) return <div className="text-center py-16 text-slate-400">Loading evidence...</div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" /> Evidence Vault
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{evidence.length} evidence records · SHA-256 integrity protected</p>
        </div>
        <button onClick={() => { setLoading(true); refreshEvidence().finally(() => setLoading(false)); }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {evidence.length === 0 ? (
        <div className="text-center py-16">
          <Shield className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No evidence records found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {evidence.map(ev => {
            const vr = verifyResults[ev.id];
            const isVerifying = verifying === ev.id;

            return (
              <div key={ev.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-4 py-4">
                  <div className="flex items-start gap-4">
                    {/* File type icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${ev.file_type === 'SNAPSHOT' ? 'bg-blue-50' : 'bg-purple-50'}`}>
                      <Shield className={`h-5 w-5 ${ev.file_type === 'SNAPSHOT' ? 'text-blue-500' : 'text-purple-500'}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-700 uppercase">{ev.file_type}</span>
                        <IntegrityBadge status={vr?.status || ev.integrity_status} />
                      </div>
                      <p className="text-[10px] font-mono text-slate-400 mt-1 truncate">ID: {ev.id}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Camera: <span className="font-mono">{ev.camera_id}</span> · {formatTime(ev.created_at)}
                      </p>

                      {/* SHA-256 */}
                      <div className="mt-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 flex items-start gap-2">
                        <Hash className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">SHA-256 Hash</p>
                          <p className="text-[10px] font-mono text-slate-600 break-all">{ev.sha256_hash}</p>
                        </div>
                      </div>

                      {/* Filename */}
                      <p className="text-[10px] text-slate-400 mt-1.5 font-mono truncate">{ev.file_location}</p>

                      {/* Verify result */}
                      {vr && (
                        <div className={`mt-2 rounded-lg px-3 py-2 border text-xs ${
                          vr.status === 'VERIFIED' || vr.status === 'PARTIAL_VERIFIED_NO_LEDGER'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-red-50 border-red-200 text-red-700'
                        }`}>
                          <div className="flex items-center gap-2">
                            {vr.status === 'VERIFIED' || vr.status === 'PARTIAL_VERIFIED_NO_LEDGER'
                              ? <CheckCircle2 className="h-3.5 w-3.5" />
                              : <XCircle className="h-3.5 w-3.5" />}
                            <span className="font-bold">{vr.status}</span>
                          </div>
                          <div className="mt-1 text-[10px] space-y-0.5">
                            <p>File integrity: <span className="font-mono">{vr.file_integrity}</span></p>
                            <p>Ledger: <span className="font-mono">{vr.ledger_integrity}</span> <span className="italic opacity-70">(Prototype Integrity Ledger)</span></p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Verify button */}
                    <button
                      onClick={() => verifyIntegrity(ev.id)}
                      disabled={isVerifying}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors"
                    >
                      {isVerifying ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                      {isVerifying ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function IntegrityBadge({ status }: { status: string }) {
  if (!status || status === 'PENDING') return (
    <span className="text-[10px] px-2 py-0.5 rounded border font-bold text-slate-500 bg-slate-50 border-slate-200">PENDING</span>
  );
  if (status === 'VERIFIED' || status === 'PARTIAL_VERIFIED_NO_LEDGER') return (
    <span className="text-[10px] px-2 py-0.5 rounded border font-bold text-emerald-700 bg-emerald-50 border-emerald-200 flex items-center gap-1">
      <CheckCircle2 className="h-3 w-3" /> VERIFIED
    </span>
  );
  return (
    <span className="text-[10px] px-2 py-0.5 rounded border font-bold text-red-700 bg-red-50 border-red-200 flex items-center gap-1">
      <AlertTriangle className="h-3 w-3" /> {status}
    </span>
  );
}
