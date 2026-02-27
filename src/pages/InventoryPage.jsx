import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { fetchInventory, fetchAvailableInputs, predictDemand } from '../data/api';

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
  { id: 'WH-005', name: 'Kolkata East', lat: 22.5726, lng: 88.3639 },
];

export default function InventoryPage() {
  const [allData, setAllData] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Prediction form
  const [inputs, setInputs] = useState({ products: [], warehouses: [] });
  const [form, setForm] = useState({ product_id: '', warehouse_id: '', promotion: 0, lead_time: 14 });
  const [prediction, setPrediction] = useState(null);
  const [predLoading, setPredLoading] = useState(false);

  useEffect(() => {
    fetchInventory(200).then((res) => {
      setAllData(res.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
    fetchAvailableInputs().then(setInputs).catch(() => {});
  }, []);

  useEffect(() => {
    if (inputs.products.length && !form.product_id) {
      setForm((f) => ({ ...f, product_id: inputs.products[0], warehouse_id: inputs.warehouses[0] }));
    }
  }, [inputs]);

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

  // Filter data by search term
  const q = filter.toLowerCase().trim();
  const filtered = q
    ? allData.filter((r) =>
        String(r.Product_ID || '').toLowerCase().includes(q) ||
        String(r.SKU_ID || '').toLowerCase().includes(q) ||
        String(r.Warehouse_ID || '').toLowerCase().includes(q) ||
        String(r.Product_Name || '').toLowerCase().includes(q)
      )
    : allData;

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-surface-900">Inventory & Predictions</h2>
        <p className="text-sm text-surface-500 mt-0.5">Master list, warehouse map, and demand predictor</p>
      </div>

      {/* Master Inventory Table with Search */}
      <div className="panel">
        <div className="flex items-center justify-between mb-4">
          <div className="panel-header">Master Inventory List</div>
          <div className="relative w-72">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by product, SKU, warehouse..."
              className="input-field w-full pl-10 text-sm"
            />
            {filter && (
              <button onClick={() => setFilter('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 text-sm">✕</button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-surface-400 text-sm animate-pulse">Loading inventory...</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-surface-200" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-surface-50 z-10">
                <tr>
                  <th className="px-3 py-2.5 text-left text-surface-500 font-semibold text-[10px] uppercase tracking-wider">Product ID</th>
                  <th className="px-3 py-2.5 text-left text-surface-500 font-semibold text-[10px] uppercase tracking-wider">SKU</th>
                  <th className="px-3 py-2.5 text-left text-surface-500 font-semibold text-[10px] uppercase tracking-wider">Warehouse</th>
                  <th className="px-3 py-2.5 text-right text-surface-500 font-semibold text-[10px] uppercase tracking-wider">Stock</th>
                  <th className="px-3 py-2.5 text-right text-surface-500 font-semibold text-[10px] uppercase tracking-wider">Reorder Pt</th>
                  <th className="px-3 py-2.5 text-right text-surface-500 font-semibold text-[10px] uppercase tracking-wider">Units Sold</th>
                  <th className="px-3 py-2.5 text-right text-surface-500 font-semibold text-[10px] uppercase tracking-wider">Unit Cost</th>
                  <th className="px-3 py-2.5 text-center text-surface-500 font-semibold text-[10px] uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-8 text-surface-400">No results found</td></tr>
                ) : filtered.slice(0, 100).map((r, i) => {
                  const stock = Number(r.Inventory_Level || 0);
                  const reorder = Number(r.Reorder_Point || 0);
                  const isLow = stock < reorder;
                  return (
                    <tr key={i} className={`border-t border-surface-100 hover:bg-surface-50 transition-colors ${isLow ? 'bg-danger-50/30' : ''}`}>
                      <td className="px-3 py-2 font-medium text-surface-800">{r.Product_ID}</td>
                      <td className="px-3 py-2 text-surface-600">{r.SKU_ID}</td>
                      <td className="px-3 py-2 text-surface-600">{r.Warehouse_ID}</td>
                      <td className={`px-3 py-2 text-right font-semibold ${isLow ? 'text-danger-600' : 'text-surface-800'}`}>{stock}</td>
                      <td className="px-3 py-2 text-right text-surface-600">{reorder}</td>
                      <td className="px-3 py-2 text-right text-surface-600">{r.Units_Sold}</td>
                      <td className="px-3 py-2 text-right text-surface-600">₹{r.Unit_Cost}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-block text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                          isLow ? 'bg-danger-100 text-danger-700' : 'bg-brand-50 text-brand-700'
                        }`}>
                          {isLow ? 'LOW' : 'OK'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-2 text-[10px] text-surface-400 text-right">
          Showing {Math.min(filtered.length, 100)} of {filtered.length} results
        </div>
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
