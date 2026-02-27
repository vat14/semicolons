import { useState, useRef } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';

export default function ScanStation({ onScan }) {
  const [inputValue, setInputValue] = useState('');
  const [mode, setMode] = useState('add');
  const [feedback, setFeedback] = useState(null);
  const [useCamera, setUseCamera] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const code = inputValue.trim().toUpperCase();
    if (!code) return;

    onScan({ assigned_location: code.startsWith('Z') ? code.split('-')[0] : 'A', id: code }, mode);
    setFeedback({
      type: 'success',
      message: `${mode === 'add' ? 'Scanned IN' : 'Scanned OUT'}: ${code}`,
    });
    setTimeout(() => setFeedback(null), 3000);
    setInputValue('');
  };

  const handleQrScan = (result) => {
    if (result?.[0]?.rawValue) {
      const code = result[0].rawValue;
      onScan({ assigned_location: 'A', id: code }, mode);
      setFeedback({ type: 'success', message: `QR Scanned: ${code}` });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div className="panel flex flex-col">
      <div className="panel-header">
        <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
        Scan Station
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-1 mb-4 bg-surface-100 rounded-lg p-1">
        <button onClick={() => setMode('add')}
          className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all
            ${mode === 'add' ? 'bg-brand-500 text-white shadow-sm' : 'text-surface-600 hover:bg-surface-200'}`}>
          📥 Scan In
        </button>
        <button onClick={() => setMode('remove')}
          className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all
            ${mode === 'remove' ? 'bg-danger-500 text-white shadow-sm' : 'text-surface-600 hover:bg-surface-200'}`}>
          📤 Scan Out
        </button>
      </div>

      {/* Manual Entry */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter item code or scan QR..."
          className="input-field flex-1"
        />
        <button type="submit" className={mode === 'add' ? 'btn-primary' : 'btn-danger'}>
          {mode === 'add' ? '+ Add' : '− Remove'}
        </button>
      </form>

      {/* QR Scanner Toggle */}
      <button onClick={() => setUseCamera(!useCamera)}
        className="btn-secondary w-full mb-3">
        {useCamera ? '⏹ Close Camera' : '📷 Open QR Scanner'}
      </button>

      {useCamera && (
        <div className="rounded-lg overflow-hidden border border-surface-200 mb-3" style={{ height: '200px' }}>
          <Scanner onScan={handleQrScan} />
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div className={`animate-alert-slide rounded-lg px-4 py-3 text-sm font-medium
          ${feedback.type === 'success' ? 'bg-brand-50 text-brand-700 border border-brand-200' : 'bg-danger-50 text-danger-700 border border-danger-100'}`}>
          {feedback.type === 'success' ? '✅' : '⚠️'} {feedback.message}
        </div>
      )}
    </div>
  );
}
