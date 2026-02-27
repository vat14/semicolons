import { useState, useRef } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';

export default function ScanStation({ inventory, onScan }) {
  const [inputValue, setInputValue] = useState('');
  const [mode, setMode] = useState('add'); // 'add' or 'remove'
  const [feedback, setFeedback] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const code = inputValue.trim().toUpperCase();
    if (!code) return;

    const item = inventory.find((i) => i.id === code);
    if (!item) {
      setFeedback({ type: 'error', message: `Item "${code}" not found in inventory` });
      setTimeout(() => setFeedback(null), 3000);
      setInputValue('');
      return;
    }

    onScan(code, mode);
    setFeedback({
      type: 'success',
      message: `${mode === 'add' ? 'Added' : 'Removed'} 1× ${item.name} (Zone ${item.zone})`,
    });
    setTimeout(() => setFeedback(null), 3000);
    setInputValue('');
  };

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <svg className="w-4 h-4 text-accent-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
        Manual Scan Station
      </div>

      {/* Live Webcam Scanner */}
      <div className="relative rounded-lg bg-black border border-industrial-600
                      aspect-square max-h-[250px] flex flex-col items-center justify-center
                      overflow-hidden mb-4">
        
        <Scanner
          onScan={(result) => {
            if (result && result.length > 0) {
              const code = result[0].rawValue.trim().toUpperCase();
              
              // Prevent spam-scanning the exact same code rapidly
              if (inputValue !== code) {
                setInputValue(code);
                
                // Programmatically trigger the submit logic for the scanned code
                const item = inventory.find((i) => i.id === code);
                if (!item) {
                  setFeedback({ type: 'error', message: `Item "${code}" not found in inventory` });
                  setTimeout(() => setFeedback(null), 3000);
                  setInputValue('');
                  return;
                }

                onScan(code, mode);
                setFeedback({
                  type: 'success',
                  message: `${mode === 'add' ? 'Added' : 'Removed'} 1× ${item.name} (Zone ${item.zone})`,
                });
                setTimeout(() => setFeedback(null), 3000);
                setTimeout(() => setInputValue(''), 2000); // clear input after a delay
              }
            }
          }}
          components={{
            audio: false,       // disable beep noise
            finder: true,       // show the scanning box
            tracker: undefined, 
          }}
          styles={{
            container: { width: '100%', height: '100%' },
            video: { objectFit: 'cover' }
          }}
        />

        {/* Custom reticle overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-40 h-40 border-2 border-accent-violet/30 rounded-lg relative">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-accent-violet rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-accent-violet rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-accent-violet rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-accent-violet rounded-br-lg" />
            
            {/* Animated scan line */}
            <div className="absolute left-0 right-0 h-0.5 bg-accent-violet/50 shadow-[0_0_8px_2px_rgba(167,139,250,0.4)]
                            animate-scan-line" />
          </div>
        </div>
        
        <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
          <span className="bg-black/60 text-white px-2 py-1 rounded text-[10px] backdrop-blur-sm border border-white/10">
            Scanning for Codes...
          </span>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex rounded-lg overflow-hidden border border-industrial-500 mb-4">
        <button
          onClick={() => setMode('add')}
          className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200
            ${mode === 'add'
              ? 'bg-safe-green/20 text-safe-green border-r border-industrial-500'
              : 'bg-industrial-700 text-industrial-300 border-r border-industrial-500 hover:bg-industrial-600'}
          `}
        >
          + Add
        </button>
        <button
          onClick={() => setMode('remove')}
          className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200
            ${mode === 'remove'
              ? 'bg-warning-red/20 text-warning-red'
              : 'bg-industrial-700 text-industrial-300 hover:bg-industrial-600'}
          `}
        >
          − Remove
        </button>
      </div>

      {/* Fallback Text Input */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="text-[10px] uppercase tracking-widest text-industrial-300">
          Manual Item Code Entry
        </label>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="e.g. QR-001"
          className="input-field"
        />
        <button
          type="submit"
          className={mode === 'add' ? 'btn-primary' : 'btn-danger'}
        >
          {mode === 'add' ? '📦 Add to Inventory' : '📤 Remove from Inventory'}
        </button>
      </form>

      {/* Feedback */}
      {feedback && (
        <div className={`
          mt-3 p-2.5 rounded-lg text-xs font-medium animate-alert-slide
          ${feedback.type === 'success'
            ? 'bg-safe-green/10 text-safe-green border border-safe-green/20'
            : 'bg-warning-red/10 text-warning-red border border-warning-red/20'}
        `}>
          {feedback.message}
        </div>
      )}

      {/* Tip */}
      <div className="mt-auto pt-4">
        <div className="bg-safe-green/5 border border-safe-green/20 rounded-lg p-3 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-safe-green animate-pulse" />
          <p className="text-[10px] text-safe-green/80 leading-relaxed">
            Live webcam scanner is **active**. Hold a QR code or Barcode up to the camera to automatically {mode}.
          </p>
        </div>
      </div>
    </div>
  );
}
