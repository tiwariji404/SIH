import { useState } from 'react';
import { useApp } from '../store';
import { FileText, Printer, Shield } from 'lucide-react';
import type { Alert } from '../types';

export default function Reports() {
  const { alerts, addAuditLog } = useApp();
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH').slice(0, 10);

  const generateReport = (alert: Alert) => {
    setSelectedAlert(alert);
    addAuditLog('generated incident report', `Incident: ${alert.id}`);
  };

  const handlePrint = () => {
    window.print();
    addAuditLog('printed incident report', selectedAlert?.id);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Incident Reports</h1>
        <p className="text-xs text-slate-500">Generate printable security incident reports</p>
      </div>

      {!selectedAlert ? (
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Select an incident to generate a report</h3>
          <div className="space-y-2">
            {criticalAlerts.map(a => (
              <button key={a.id} onClick={() => generateReport(a)} className="card card-hover w-full p-3 text-left flex items-center gap-3">
                <FileText className="h-4 w-4 text-accent-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-200">{a.title}</p>
                  <p className="text-[10px] text-slate-500">{a.id} • {a.cameraId} • {a.when}</p>
                </div>
                <span className={`badge ${a.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>{a.severity}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button onClick={() => { setSelectedAlert(null); }} className="btn-ghost">← Back</button>
            <button onClick={handlePrint} className="btn-primary"><Printer className="h-4 w-4" /> Print Report</button>
          </div>

          {/* Report document */}
          <div className="card p-8 max-w-3xl mx-auto bg-white text-black" id="report-content">
            {/* Header */}
            <div className="border-b-2 border-slate-800 pb-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-900">
                    <Shield className="h-6 w-6 text-cyan-500" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900">IBVAP — Incident Report</h1>
                    <p className="text-xs text-slate-500">Intelligent Border Video Analytics Platform</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-mono text-slate-500">INCIDENT ID</p>
                  <p className="text-sm font-mono font-bold text-slate-900">INC-2026-{String(Math.floor(Math.random() * 90000) + 10000)}</p>
                </div>
              </div>
            </div>

            {/* Incident details */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Field label="Date" value={new Date(selectedAlert.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })} />
              <Field label="Time" value={selectedAlert.when} />
              <Field label="Camera" value={selectedAlert.cameraId} />
              <Field label="Event" value={selectedAlert.title} />
              <Field label="Tracking ID" value={selectedAlert.object} />
              <Field label="Risk Level" value={selectedAlert.severity} highlight={selectedAlert.severity === 'CRITICAL' ? 'red' : 'orange'} />
              <Field label="Zone" value={selectedAlert.zone || 'N/A'} />
              <Field label="Confidence" value={`${selectedAlert.confidence}%`} />
              <Field label="Status" value={selectedAlert.status} />
              <Field label="Risk Score" value={`${selectedAlert.riskScore} / 100`} highlight="red" />
            </div>

            {/* Reason */}
            <div className="mb-6">
              <p className="text-[10px] font-mono uppercase text-slate-500 mb-1">Reason / Why</p>
              <div className="p-3 rounded-lg bg-slate-100 border border-slate-200">
                <p className="text-sm text-slate-700">{selectedAlert.why}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selectedAlert.reasons.map((r, i) => (
                    <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-red-100 text-red-700 border border-red-200">{r}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Event timeline */}
            <div className="mb-6">
              <p className="text-[10px] font-mono uppercase text-slate-500 mb-2">Event Timeline</p>
              <div className="space-y-2">
                {[
                  { time: selectedAlert.when, event: 'Person detected and tracking ID assigned' },
                  { time: selectedAlert.when, event: 'Object tracked moving through camera view' },
                  { time: selectedAlert.when, event: 'Virtual fence crossing detected' },
                  { time: selectedAlert.when, event: `Critical alert generated — Risk score: ${selectedAlert.riskScore}` },
                  { time: selectedAlert.when, event: 'Alert acknowledged by operator' },
                  { time: selectedAlert.when, event: 'Incident resolved' },
                ].map((t, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-slate-700" />
                      {i < 5 && <div className="w-0.5 h-6 bg-slate-200" />}
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-slate-500">{t.time}</p>
                      <p className="text-xs text-slate-700">{t.event}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-4 mt-6">
              <p className="text-[10px] text-slate-400">
                This report was generated by IBVAP — Intelligent Border Video Analytics Platform.
                All data in this report is fictional/demo data for prototype purposes.
                Generated on {new Date().toLocaleString('en-IN')}.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, highlight }: { label: string; value: string; highlight?: 'red' | 'orange' }) {
  const color = highlight === 'red' ? 'text-red-600 font-bold' : highlight === 'orange' ? 'text-orange-600 font-bold' : 'text-slate-900';
  return (
    <div>
      <p className="text-[10px] font-mono uppercase text-slate-500">{label}</p>
      <p className={`text-sm ${color}`}>{value}</p>
    </div>
  );
}
