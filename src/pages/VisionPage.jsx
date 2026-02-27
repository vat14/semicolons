import { useState, useEffect } from 'react';
import CameraFeed from '../components/CameraFeed';
import { fetchScanLog, fetchEngineStatus } from '../data/api';

export default function VisionPage() {
  const [scanLog, setScanLog] = useState([]);
  const [scanCount, setScanCount] = useState(0);
  const [engineOnline, setEngineOnline] = useState(false);

  // Poll scan log every 2 seconds
  useEffect(() => {
    const poll = () => {
      fetchScanLog()
        .then((res) => {
          setScanLog(res.data);
          setScanCount(res.count);
        })
        .catch(() => {});
      fetchEngineStatus()
        .then((res) => setEngineOnline(res.online))
        .catch(() => setEngineOnline(false));
    };
    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, []);

  const statusColor = {
    'SECURE': { bg: 'bg-safe-green/10 border-safe-green/30', text: 'text-safe-green', icon: '✓' },
    'GHOST INVENTORY - ALERT': { bg: 'bg-warning-red/10 border-warning-red/30', text: 'text-warning-red', icon: '⚠' },
    'LOGGED - AWAITING PLACEMENT': { bg: 'bg-accent-amber/10 border-accent-amber/30', text: 'text-accent-amber', icon: '◎' },
  };

  return (
    <div className="p-6 h-full flex flex-col gap-4">
      {/* Page Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-100">Vision Engine</h2>
        <p className="text-xs text-industrial-300 mt-0.5">OpenCV-powered barcode scanning, color tracking, and ghost inventory detection</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Camera Feed + Engine Stats */}
        <div className="flex flex-col gap-3">
          <CameraFeed />

          {/* Engine Stats */}
          <div className="panel">
            <div className="panel-header">
              <svg className="w-4 h-4 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
              </svg>
              Engine Stats
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Status', value: engineOnline ? 'ONLINE' : 'OFFLINE', color: engineOnline ? 'text-safe-green' : 'text-industrial-400' },
                { label: 'Total Scans', value: scanCount.toString(), color: 'text-accent-cyan' },
                { label: 'Detection', value: 'Multi-Pass', color: 'text-accent-cyan' },
              ].map((s) => (
                <div key={s.label} className="bg-industrial-700/50 rounded-lg p-2.5 text-center">
                  <p className="text-[9px] text-industrial-300 uppercase tracking-wider mb-1">{s.label}</p>
                  <p className={`text-sm font-bold font-mono ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Scan Log */}
        <div className="panel flex flex-col">
          <div className="panel-header">
            <svg className="w-4 h-4 text-accent-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Live Scan Log
            <span className="ml-auto flex items-center gap-1.5">
              {scanCount > 0 && (
                <span className="text-[10px] font-mono text-accent-cyan bg-accent-cyan/10 px-2 py-0.5 rounded">
                  {scanCount} scans
                </span>
              )}
              <span className="status-dot-live" />
            </span>
          </div>

          <div className="space-y-2 overflow-y-auto flex-1">
            {scanLog.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <svg className="w-10 h-10 text-industrial-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
                <p className="text-xs text-industrial-400 mb-1">No scans yet</p>
                <p className="text-[10px] text-industrial-500">
                  Start <code className="bg-industrial-700 px-1 py-0.5 rounded text-accent-cyan font-mono text-[9px]">python engine.py</code> and scan a barcode
                </p>
              </div>
            )}

            {scanLog.map((entry, i) => {
              const sc = statusColor[entry.status] || { bg: 'bg-industrial-600/30 border-industrial-500/30', text: 'text-industrial-300', icon: '?' };
              const isGhost = entry.status === 'GHOST INVENTORY - ALERT';
              return (
                <div key={`${entry.part_id}-${i}`}
                  className={`animate-alert-slide flex items-start gap-3 p-2.5 rounded-lg border ${sc.bg}`}>
                  {/* Status indicator */}
                  <span className={`mt-0.5 flex-shrink-0 text-sm font-bold ${sc.text}`}>
                    {sc.icon}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-gray-100 truncate font-mono">{entry.part_id}</span>
                      <span className="text-[9px] font-mono text-industrial-400 flex-shrink-0">{entry.timestamp}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-[10px] text-industrial-300">
                        Assigned: <span className="text-accent-cyan font-mono">{entry.assigned_location}</span>
                      </span>
                      <span className="text-[10px] text-industrial-300">
                        Physical: <span className={`font-mono ${isGhost ? 'text-warning-red' : 'text-safe-green'}`}>{entry.physical_location}</span>
                      </span>
                      {entry.detected_shape && entry.detected_shape !== 'UNKNOWN' && (
                        <span className="text-[10px] text-accent-violet font-mono">
                          ◆ {entry.detected_shape}
                        </span>
                      )}
                    </div>
                    <span className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${sc.text} ${sc.bg}`}>
                      {entry.status}
                    </span>
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
