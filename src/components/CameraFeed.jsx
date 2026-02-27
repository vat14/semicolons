export default function CameraFeed() {
  return (
    <div className="panel flex flex-col">
      <div className="panel-header">
        <svg className="w-4 h-4 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Camera Feed
        <span className="status-dot-live ml-auto" />
      </div>

      {/* Camera placeholder */}
      <div className="relative flex-1 min-h-[180px] rounded-lg bg-industrial-900 border border-industrial-600
                      flex flex-col items-center justify-center overflow-hidden group">
        {/* Scan-line effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent-cyan/5 to-transparent
                        animate-pulse pointer-events-none" />

        {/* Corner brackets */}
        <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-accent-cyan/40 rounded-tl" />
        <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-accent-cyan/40 rounded-tr" />
        <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-accent-cyan/40 rounded-bl" />
        <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-accent-cyan/40 rounded-br" />

        <svg className="w-10 h-10 text-industrial-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <span className="text-sm font-medium text-industrial-300">Live OpenCV Feed</span>
        <span className="text-[10px] text-industrial-400 mt-1">Awaiting camera connection…</span>

        {/* Fake FPS badge */}
        <div className="absolute top-3 right-12 bg-industrial-800/80 border border-industrial-600 rounded
                        px-2 py-0.5 text-[9px] font-mono text-safe-green">
          30 FPS
        </div>
      </div>
    </div>
  );
}
