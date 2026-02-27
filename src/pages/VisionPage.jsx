import CameraFeed from '../components/CameraFeed';
import { shelfChanges } from '../data/mockVision';

export default function VisionPage() {
  return (
    <div className="p-6 h-full flex flex-col gap-4">
      {/* Page Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-100">Vision Engine</h2>
        <p className="text-xs text-industrial-300 mt-0.5">OpenCV-powered shelf monitoring and real-time stock change detection</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Camera Feed — expanded */}
        <div className="flex flex-col gap-3">
          <CameraFeed />

          {/* Engine Stats */}
          <div className="panel">
            <div className="panel-header">
              <svg className="w-4 h-4 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
              </svg>
              Model Stats
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Model', value: 'YOLOv8s' },
                { label: 'Confidence', value: '≥ 85%' },
                { label: 'Inference', value: '18 ms' },
              ].map((s) => (
                <div key={s.label} className="bg-industrial-700/50 rounded-lg p-2.5 text-center">
                  <p className="text-[9px] text-industrial-300 uppercase tracking-wider mb-1">{s.label}</p>
                  <p className="text-sm font-bold text-accent-cyan font-mono">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Shelf-Stock Change Log */}
        <div className="panel flex flex-col">
          <div className="panel-header">
            <svg className="w-4 h-4 text-accent-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Shelf Change Log
            <span className="ml-auto status-dot-live" />
          </div>

          <div className="space-y-2 overflow-y-auto flex-1">
            {shelfChanges.map((entry) => {
              const isAdded = entry.changeType === 'added';
              return (
                <div key={entry.id}
                  className="animate-alert-slide flex items-start gap-3 p-2.5 rounded-lg bg-industrial-700/40 border border-industrial-600/50">
                  {/* Change type indicator */}
                  <span className={`mt-0.5 flex-shrink-0 text-sm font-bold ${
                    isAdded ? 'text-safe-green' : 'text-warning-red'
                  }`}>
                    {isAdded ? '＋' : '－'}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-gray-100 truncate">{entry.item}</span>
                      <span className="text-[9px] font-mono text-industrial-400 flex-shrink-0">{entry.timestamp}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-[10px] text-industrial-300">Shelf <span className="text-accent-cyan font-mono">{entry.shelf}</span></span>
                      <span className={`text-[10px] font-semibold ${isAdded ? 'text-safe-green' : 'text-warning-red'}`}>
                        {isAdded ? `+${entry.quantity}` : `-${entry.quantity}`} units
                      </span>
                      <span className="text-[10px] text-industrial-400">
                        {(entry.confidence * 100).toFixed(0)}% conf.
                      </span>
                    </div>
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
