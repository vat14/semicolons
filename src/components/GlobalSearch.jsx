import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const searchIndex = [
  { label: 'Home — Overview', path: '/', keywords: 'home overview dashboard kpi metrics status' },
  { label: 'Alerts — Stock & Fleet', path: '/alerts', keywords: 'alert low stock high stock overstock fleet delay warning' },
  { label: 'Inventory & Predictions', path: '/inventory', keywords: 'inventory warehouse stock products product_id items predict map' },
  { label: 'QR Scan — In & Out', path: '/scan', keywords: 'scan qr barcode camera in out management' },
  { label: 'Analytics — Charts', path: '/analytics', keywords: 'analytics charts graphs bar pie donut heatmap radar revenue trend compare' },
  { label: 'Live Feed — Camera', path: '/live-feed', keywords: 'live feed camera engine vision scan log detect' },
  { label: 'ML Insights — Forecasting', path: '/ml-insights', keywords: 'ml machine learning predict demand forecast stockout risk reorder selling' },
  { label: 'Logistics — Fleet', path: '/logistics', keywords: 'logistics fleet trucks delivery map route tracking delay dock' },
];

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState([]);
  const navigate = useNavigate();
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (value) => {
    setQuery(value);
    if (!value.trim()) { setResults([]); return; }
    const q = value.toLowerCase();
    const matched = searchIndex.filter(
      (item) => item.label.toLowerCase().includes(q) || item.keywords.includes(q)
    );
    const seen = new Set();
    setResults(matched.filter((item) => {
      if (seen.has(item.path)) return false;
      seen.add(item.path);
      return true;
    }));
  };

  const handleSelect = (path) => {
    navigate(path);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => { handleSearch(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search..."
          className="w-full bg-surface-100 border border-surface-200 rounded-lg pl-9 pr-3 py-2
                     text-xs text-surface-700 placeholder:text-surface-400
                     focus:outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-50
                     transition-all duration-200"
        />
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-surface-200
                        rounded-lg shadow-elevated z-50 overflow-hidden">
          {results.map((item, i) => (
            <button
              key={i}
              onClick={() => handleSelect(item.path)}
              className="w-full px-4 py-2.5 text-left text-xs text-surface-700 hover:bg-brand-50 hover:text-brand-700
                         border-b border-surface-100 last:border-0 flex items-center gap-2 transition-colors"
            >
              <svg className="w-3 h-3 text-brand-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
