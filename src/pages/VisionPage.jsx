import { useState, useEffect, useRef } from 'react';
import { fetchEngineStatus, fetchScanLog } from '../data/api';

async function sendFrame(blob) {
  const form = new FormData();
  form.append('frame', blob, 'frame.jpg');
  await fetch('http://localhost:8000/api/video-frame', { method: 'POST', body: form });
}

export default function VisionPage() {
  const [engineStatus, setEngineStatus] = useState(null);
  const [scanLog, setScanLog] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchEngineStatus().then(setEngineStatus).catch(() => {});
    fetchScanLog().then((r) => setScanLog(r.log || [])).catch(() => {});
    const poll = setInterval(() => {
      fetchEngineStatus().then(setEngineStatus).catch(() => {});
      fetchScanLog().then((r) => setScanLog(r.log || [])).catch(() => {});
    }, 3000);
    return () => clearInterval(poll);
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreaming(true);
        intervalRef.current = setInterval(() => captureAndSend(), 2000);
      }
    } catch (err) {
      console.error('Camera access denied:', err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
    setStreaming(false);
  };

  const captureAndSend = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    canvasRef.current.toBlob((blob) => {
      if (blob) sendFrame(blob).catch(() => {});
    }, 'image/jpeg', 0.7);
  };

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-surface-900">Live Feed & Engine</h2>
        <p className="text-sm text-surface-500 mt-0.5">Camera status, live detection feed, and scan log</p>
      </div>

      {/* Engine Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatusCard label="Engine Status"
          value={engineStatus?.status || '—'}
          badge={engineStatus?.status === 'running' ? 'badge-success' : 'badge-warning'} />
        <StatusCard label="Cameras"
          value={`${engineStatus?.cameras_active || 0} Active`}
          badge={engineStatus?.cameras_active > 0 ? 'badge-success' : 'badge-danger'} />
        <StatusCard label="Detection Model"
          value={engineStatus?.model || 'YOLOv8'}
          badge="badge-info" />
        <StatusCard label="Last Detection"
          value={engineStatus?.last_detection || '—'}
          badge="badge-neutral" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Camera Feed */}
        <div className="panel">
          <div className="panel-header">
            <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Live Camera Feed
            {streaming && <span className="ml-auto badge-danger">● LIVE</span>}
          </div>
          <div className="relative bg-surface-100 rounded-lg overflow-hidden border border-surface-200" style={{ minHeight: '260px' }}>
            <video ref={videoRef} autoPlay playsInline muted
              className="w-full h-full object-cover" style={{ minHeight: '260px', display: streaming ? 'block' : 'none' }} />
            {!streaming && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-surface-400">
                <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="text-sm">Camera offline</span>
              </div>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <div className="flex gap-2 mt-3">
            <button onClick={startCamera} disabled={streaming} className="btn-primary flex-1">
              ▶ Start Feed
            </button>
            <button onClick={stopCamera} disabled={!streaming} className="btn-secondary flex-1">
              ⏹ Stop
            </button>
          </div>
        </div>

        {/* Scan Log */}
        <div className="panel">
          <div className="panel-header">
            <svg className="w-4 h-4 text-info-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Live Scan Log
            <span className="ml-auto badge-neutral">{scanLog.length} entries</span>
          </div>
          <div className="space-y-1.5 max-h-80 overflow-y-auto mt-2">
            {scanLog.length === 0 && (
              <div className="text-center py-8 text-sm text-surface-400">No detections yet</div>
            )}
            {scanLog.map((entry, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-50 transition-colors border border-surface-100">
                <div className="w-2 h-2 rounded-full bg-brand-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-surface-800">{entry.item || entry.label}</span>
                </div>
                <span className="text-[10px] text-surface-400 flex-shrink-0">{entry.timestamp || entry.time}</span>
                <span className="badge-success text-[9px]">{entry.confidence ? `${(entry.confidence * 100).toFixed(0)}%` : 'OK'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusCard({ label, value, badge }) {
  return (
    <div className="panel">
      <div className="text-xs text-surface-500 font-medium mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-surface-800">{value}</span>
        <span className={badge}>{value}</span>
      </div>
    </div>
  );
}
