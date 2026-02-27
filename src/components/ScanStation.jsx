import { useState } from 'react';

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

      {/* Webcam Scanner Mockup */}
      <div className="relative rounded-lg bg-industrial-900 border border-industrial-600
                      aspect-square max-h-[200px] flex flex-col items-center justify-center
                      overflow-hidden mb-4">
        {/* Animated scan line */}
        <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-accent-violet to-transparent
                        animate-bounce opacity-60" />

        {/* QR frame overlay */}
        <div className="relative w-24 h-24 mb-3">
          <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-accent-violet rounded-tl" />
          <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-accent-violet rounded-tr" />
          <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-accent-violet rounded-bl" />
          <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-accent-violet rounded-br" />

          {/* Fake QR icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-10 h-10 text-industrial-400 opacity-50" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM13 13h2v2h-2zM15 15h2v2h-2zM13 17h2v2h-2zM17 13h2v2h-2zM19 15h2v2h-2zM17 17h2v2h-2zM15 19h2v2h-2zM19 19h2v2h-2z" />
            </svg>
          </div>
        </div>

        <span className="text-[10px] text-industrial-400 mb-1">Align QR / Barcode in frame</span>
        <span className="text-[9px] text-industrial-500">
          💡 Install <code className="text-accent-violet/80">@yudiel/react-qr-scanner</code> for live scanning
        </span>
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
        <div className="bg-accent-violet/5 border border-accent-violet/20 rounded-lg p-3">
          <p className="text-[10px] text-accent-violet/80 leading-relaxed">
            <strong className="text-accent-violet">Recommended:</strong> Install{' '}
            <code className="bg-industrial-700 px-1 rounded text-[9px]">@yudiel/react-qr-scanner</code>{' '}
            for live webcam QR/Barcode scanning integration.
          </p>
          <p className="text-[9px] text-industrial-400 mt-1 font-mono">
            npm install @yudiel/react-qr-scanner
          </p>
        </div>
      </div>
    </div>
  );
}
