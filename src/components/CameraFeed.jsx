import { useState, useEffect } from 'react';
import { fetchEngineStatus } from '../data/api';

const VIDEO_FEED_URL = 'http://localhost:8000/api/video-feed';

export default function CameraFeed() {
  const [engineOnline, setEngineOnline] = useState(false);
  const [totalScans, setTotalScans] = useState(0);

  useEffect(() => {
    const poll = () => {
      fetchEngineStatus()
        .then((res) => {
          setEngineOnline(res.online);
          setTotalScans(res.total_scans);
        })
        .catch(() => setEngineOnline(false));
    };
    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="panel flex flex-col">
      <div className="panel-header">
        <svg className="w-4 h-4 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Camera Feed
        <span className={`ml-auto flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${
          engineOnline ? 'text-safe-green' : 'text-industrial-400'
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            engineOnline ? 'bg-safe-green animate-pulse' : 'bg-industrial-500'
          }`} />
          {engineOnline ? 'Engine Online' : 'Engine Offline'}
        </span>
      </div>

      {/* Live video or placeholder */}
      <div className="relative flex-1 min-h-[180px] rounded-lg bg-industrial-900 border border-industrial-600
                      flex flex-col items-center justify-center overflow-hidden">

        {engineOnline ? (
          <>
            {/* MJPEG stream from FastAPI */}
            <img
              src={VIDEO_FEED_URL}
              alt="Live Camera Feed"
              className="w-full h-full object-contain rounded-lg"
            />

            {/* LIVE badge */}
            <div className="absolute top-3 right-3 bg-warning-red/90 border border-warning-red rounded
                            px-2 py-0.5 text-[9px] font-bold font-mono text-white uppercase tracking-wider animate-pulse">
              ● LIVE
            </div>

            {/* Scans badge */}
            <div className="absolute bottom-3 left-3 bg-industrial-800/80 border border-industrial-600 rounded
                            px-2 py-0.5 text-[9px] font-mono text-accent-cyan">
              {totalScans} scans
            </div>
          </>
        ) : (
          <>
            {/* Corner brackets */}
            <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-accent-cyan/40 rounded-tl" />
            <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-accent-cyan/40 rounded-tr" />
            <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-accent-cyan/40 rounded-bl" />
            <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-accent-cyan/40 rounded-br" />

            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent-cyan/5 to-transparent pointer-events-none" />

            <svg className="w-10 h-10 text-industrial-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium text-industrial-300">Vision Engine Offline</span>
            <span className="text-[10px] text-industrial-400 mt-1 text-center px-4">
              Run <code className="bg-industrial-700 px-1.5 py-0.5 rounded text-accent-cyan font-mono">python engine.py</code> to connect camera
            </span>
          </>
        )}
      </div>
    </div>
  );
}
