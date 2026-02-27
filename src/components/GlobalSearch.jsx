import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const searchIndex = [
  { label: 'Home — System Overview', path: '/', keywords: 'home overview dashboard kpi metrics alerts status' },
  { label: 'Warehouse — Inventory & Scan', path: '/inventory', keywords: 'inventory warehouse scan stock products sku items table data' },
  { label: 'Vision — Camera Engine', path: '/vision', keywords: 'vision camera scan barcode qr code engine feed live' },
  { label: 'ML Insights — Demand Forecasting', path: '/ml-insights', keywords: 'ml machine learning predict demand forecast stockout risk reorder selling' },
  { label: 'Logistics — Fleet Tracking', path: '/logistics', keywords: 'logistics fleet trucks delivery map route tracking delay dock' },
  { label: 'Product Search', path: '/inventory', keywords: 'search product find item sku lookup' },
  { label: 'Stock Alerts', path: '/', keywords: 'alert low stock high stock overstock understock warning' },
  { label: 'Truck Routes & Map', path: '/logistics', keywords: 'truck route map location gps tracking eta' },
  { label: 'Demand Predictor', path: '/ml-insights', keywords: 'predict demand forecast supply reorder' },
  { label: 'Selling Insights', path: '/ml-insights', keywords: 'selling fast slow mover promotion reorder recommendation' },
];

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState([]);
  const navigate = useNavigate();
  const inputRef = useRef(null);
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
    if (!value.trim()) {
      setResults([]);
      return;
    }
    const q = value.toLowerCase();
    const matched = searchIndex.filter(
      (item) => item.label.toLowerCase().includes(q) || item.keywords.includes(q)
    );
    // Deduplicate by path
    const seen = new Set();
    const unique = matched.filter((item) => {
      if (seen.has(item.path)) return false;
      seen.add(item.path);
      return true;
    });
    setResults(unique);
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
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-industrial-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { handleSearch(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search pages..."
          className="w-full bg-industrial-900 border border-industrial-600 rounded-lg pl-9 pr-3 py-2
                     text-xs text-gray-100 placeholder:text-industrial-400
                     focus:outline-none focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan/20
                     transition-all duration-200"
        />
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-industrial-800 border border-industrial-600
                        rounded-lg shadow-xl shadow-black/30 z-50 overflow-hidden">
          {results.map((item, i) => (
            <button
              key={i}
              onClick={() => handleSelect(item.path)}
              className="w-full px-4 py-2.5 text-left text-xs text-gray-100 hover:bg-accent-cyan/10
                         border-b border-industrial-700/50 last:border-0 flex items-center gap-2 transition-colors"
            >
              <svg className="w-3 h-3 text-accent-cyan flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
