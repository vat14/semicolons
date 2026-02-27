import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { searchInventory, fetchAvailableInputs, predictDemand } from '../data/api';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const warehouseLocations = [
  { id: 'WH-001', name: 'Mumbai Central', lat: 19.076, lng: 72.8777 },
  { id: 'WH-002', name: 'Delhi NCR', lat: 28.7041, lng: 77.1025 },
  { id: 'WH-003', name: 'Bangalore Hub', lat: 12.9716, lng: 77.5946 },
  { id: 'WH-004', name: 'Chennai Port', lat: 13.0827, lng: 80.2707 },
];

// Debounce hook
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

export default function InventoryPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Prediction form
  const [inputs, setInputs] = useState({ products: [], warehouses: [] });
  const [form, setForm] = useState({ product_id: '', warehouse_id: '', promotion: 0, lead_time: 14 });
  const [prediction, setPrediction] = useState(null);
  const [predLoading, setPredLoading] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    fetchAvailableInputs().then(setInputs).catch(() => {});
  }, []);

  useEffect(() => {
    if (inputs.products.length && !form.product_id) {
      setForm((f) => ({ ...f, product_id: inputs.products[0], warehouse_id: inputs.warehouses[0] }));
    }
  }, [inputs]);

  useEffect(() => {
    if (!debouncedQuery.trim()) { setResults([]); return; }
    setLoading(true);
    searchInventory(debouncedQuery)
      .then((r) => { setResults(r.data || []); setShowDropdown(true); })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  const handlePredict = async (e) => {
    e.preventDefault();
    setPredLoading(true);
    try {
      const res = await predictDemand(form);
      setPrediction(res);
    } catch (err) {
      setPrediction({ error: err.message });
    }
    setPredLoading(false);
  };

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-surface-900">Inventory & Predictions</h2>
        <p className="text-sm text-surface-500 mt-0.5">Search products, view warehouse map, and predict demand</p>
      </div>

      {/* Search Bar */}
      <div className="panel relative z-[100] mb-5">
        <div className="relative z-[100]">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length && setShowDropdown(true)}
            placeholder="Search by Product ID, product name, warehouse..."
            className="input-field w-full pl-11 text-base"
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); setShowDropdown(false); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 text-sm">✕</button>
          )}
        </div>

        {/* Dropdown Results */}
        {showDropdown && results.length > 0 && (
          <div className="absolute left-0 right-0 top-[110%] bg-white border border-surface-200 rounded-xl shadow-elevated z-[100] max-h-72 overflow-y-auto">
            {results.slice(0, 20).map((r, i) => (
              <div key={i} className="px-4 py-3 hover:bg-brand-50 border-b border-surface-100 last:border-0 cursor-pointer transition-colors"
                onClick={() => {
                  setQuery(r.Product_ID);
                  setForm(f => ({ ...f, product_id: r.Product_ID, warehouse_id: r.Warehouse_ID }));
                  setShowDropdown(false);
                }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-surface-800">{r.Product_ID}</span>
                  <span className="badge-neutral">{r.Warehouse_ID}</span>
                </div>
                <div className="flex gap-4 mt-1 text-xs text-surface-500">
                  <span>Stock: <b className="text-surface-700">{r.Inventory_Level}</b></span>
                  <span>Sold: <b className="text-surface-700">{r.Units_Sold}</b></span>
                  <span>Cost: <b className="text-surface-700">₹{r.Unit_Cost}</b></span>
                </div>
              </div>
            ))}
          </div>
        )}
        {showDropdown && query && results.length === 0 && !loading && (
          <div className="absolute left-0 right-0 top-[110%] bg-white border border-surface-200 rounded-xl shadow-elevated z-[100] px-4 py-6 text-center text-sm text-surface-400">
            No results for "{query}"
          </div>
        )}
      </div>

      {/* Two column: Map + Predictor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 relative z-0">
        {/* Warehouse Map */}
        <div className="panel" style={{ minHeight: '380px' }}>
          <div className="panel-header">
            <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Warehouse Locations
          </div>
          <div className="flex-1 rounded-lg overflow-hidden border border-surface-200" style={{ height: '320px' }}>
            <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap'
              />
              {warehouseLocations.map((wh) => (
                <Marker key={wh.id} position={[wh.lat, wh.lng]}>
                  <Popup><b>{wh.id}</b><br />{wh.name}</Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Demand Predictor */}
        <div className="panel">
          <div className="panel-header">
            <svg className="w-4 h-4 text-info-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Demand Predictor
          </div>

          <form onSubmit={handlePredict} className="space-y-4 mt-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-surface-600 block mb-1">Product ID</label>
                <select value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                  className="input-field w-full text-sm">
                  {inputs.products.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-surface-600 block mb-1">Warehouse</label>
                <select value={form.warehouse_id} onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}
                  className="input-field w-full text-sm">
                  {inputs.warehouses.map((w) => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-surface-600 block mb-1">Lead Time (days)</label>
                <input type="number" value={form.lead_time} onChange={(e) => setForm({ ...form, lead_time: e.target.value === '' ? '' : parseInt(e.target.value) })}
                  className="input-field w-full text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-surface-600 block mb-1">Promotion?</label>
                <select value={form.promotion} onChange={(e) => setForm({ ...form, promotion: parseInt(e.target.value) })}
                  className="input-field w-full text-sm">
                  <option value={0}>No</option>
                  <option value={1}>Yes</option>
                </select>
              </div>
            </div>
            <button type="submit" disabled={predLoading} className="btn-primary w-full">
              {predLoading ? 'Predicting...' : '🔮 Predict Demand'}
            </button>
          </form>

          {prediction && !prediction.error && (
            <div className="mt-4 bg-surface-50 rounded-xl border border-surface-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-surface-500">{prediction.product_id} @ {prediction.warehouse_id}</span>
                <span className={`badge ${
                  prediction.risk_level === 'HIGH' ? 'badge-danger' : prediction.risk_level === 'MODERATE' ? 'badge-warning' : 'badge-success'
                }`}>{prediction.risk_level} Risk</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div><div className="text-lg font-bold text-info-600">{prediction.predicted_daily_demand}</div>
                  <div className="text-[9px] text-surface-400 uppercase">Predicted</div></div>
                <div><div className="text-lg font-bold text-brand-600">{prediction.dynamic_reorder_point}</div>
                  <div className="text-[9px] text-surface-400 uppercase">Reorder</div></div>
                <div><div className="text-lg font-bold text-surface-800">{prediction.current_inventory}</div>
                  <div className="text-[9px] text-surface-400 uppercase">Stock</div></div>
              </div>
              <div className="bg-white rounded-lg border border-surface-200 p-2.5 text-xs text-surface-600">
                💡 {prediction.suggested_action}
              </div>
            </div>
          )}
          {prediction && prediction.error && (
            <div className="mt-4 bg-danger-50 rounded-xl border border-danger-200 p-4 text-sm text-danger-700">
              ⚠️ {prediction.error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
