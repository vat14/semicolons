import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchInventory, predictStockout, searchInventory } from '../data/api';
import WarehouseMap from '../components/WarehouseMap';
import ScanStation from '../components/ScanStation';
import { initialInventory } from '../data/mockInventory';

export default function InventoryPage() {
  // Existing local state for warehouse map + scan station demo
  const [inventory, setInventory] = useState(initialInventory);
  const [pulsingZone, setPulsingZone] = useState(null);
  const pulseTimer = useRef(null);

  // Live API state
  const [liveData, setLiveData] = useState([]);
  const [liveCount, setLiveCount] = useState(0);
  const [liveLoading, setLiveLoading] = useState(true);
  const [liveError, setLiveError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const searchTimer = useRef(null);

  // Stockout predictor state
  const [predForm, setPredForm] = useState({
    inventory_levels: '',
    supplier_lead_times: '',
    units_sold: '',
    forecasted_demand: '',
  });
  const [prediction, setPrediction] = useState(null);
  const [predLoading, setPredLoading] = useState(false);

  useEffect(() => {
    fetchInventory(50)
      .then((res) => {
        setLiveData(res.data);
        setLiveCount(res.count);
        setLiveLoading(false);
      })
      .catch((err) => {
        setLiveError(err.message);
        setLiveLoading(false);
      });
  }, []);

  const handleScan = useCallback((itemId, mode) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const newStock = mode === 'add' ? item.stock + 1 : Math.max(0, item.stock - 1);
          return { ...item, stock: newStock };
        }
        return item;
      })
    );
    const item = inventory.find((i) => i.id === itemId);
    if (item) {
      if (pulseTimer.current) clearTimeout(pulseTimer.current);
      setPulsingZone(item.zone);
      pulseTimer.current = setTimeout(() => setPulsingZone(null), 3000);
    }
  }, [inventory]);

  const handlePredict = async (e) => {
    e.preventDefault();
    setPredLoading(true);
    setPrediction(null);
    try {
      const payload = {
        inventory_levels: parseInt(predForm.inventory_levels) || 0,
        supplier_lead_times: parseInt(predForm.supplier_lead_times) || 0,
        units_sold: parseInt(predForm.units_sold) || 0,
        forecasted_demand: parseInt(predForm.forecasted_demand) || 0,
      };
      const res = await predictStockout(payload);
      setPrediction(res.prediction);
    } catch (err) {
      setPrediction({ risk_classification: 'Error', confidence_score: 0, suggested_action: err.message });
    } finally {
      setPredLoading(false);
    }
  };

  // Determine which data to show
  const displayData = searchResults ? searchResults.data : liveData;
  const columns = displayData.length > 0 ? Object.keys(displayData[0]).slice(0, 8) : [];

  const riskColor = {
    'High Risk of Stockout': { bg: 'bg-warning-red/10 border-warning-red/30', text: 'text-warning-red' },
    'Moderate Risk': { bg: 'bg-accent-amber/10 border-accent-amber/30', text: 'text-accent-amber' },
    'Low Risk / Overstocked': { bg: 'bg-safe-green/10 border-safe-green/30', text: 'text-safe-green' },
  };

  return (
    <div className="p-6 flex flex-col gap-4">
      {/* Page Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-100">Warehouse & Inventory</h2>
        <p className="text-xs text-industrial-300 mt-0.5">Live inventory data from MongoDB + Warehouse map + ML stockout predictor</p>
      </div>

      {/* Product Search Bar */}
      <div className="panel">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-industrial-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              const q = e.target.value;
              setSearchQuery(q);
              if (searchTimer.current) clearTimeout(searchTimer.current);
              if (!q.trim()) { setSearchResults(null); return; }
              searchTimer.current = setTimeout(() => {
                searchInventory(q).then(setSearchResults).catch(() => {});
              }, 300);
            }}
            placeholder="Search products by SKU, warehouse, region, date..."
            className="w-full bg-industrial-900 border border-industrial-600 rounded-lg pl-10 pr-4 py-2.5
                       text-xs text-gray-100 placeholder:text-industrial-400
                       focus:outline-none focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan/20
                       transition-all duration-200"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setSearchResults(null); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-industrial-400 hover:text-gray-100 text-xs">
              ✕
            </button>
          )}
        </div>
        {searchResults && (
          <div className="mt-2 text-[10px] text-industrial-300">
            Found <span className="text-accent-cyan font-bold">{searchResults.count}</span> results for "{searchQuery}"
          </div>
        )}
      </div>

      {/* Row 1: Warehouse Map + Scan Station */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WarehouseMap inventory={inventory} pulsingZone={pulsingZone} />
        <ScanStation inventory={inventory} onScan={handleScan} />
      </div>

      {/* Row 2: Live Inventory Table */}
      <div className="panel">
        <div className="panel-header">
          <svg className="w-4 h-4 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7z" />
          </svg>
          Live Inventory Data
          {(searchResults ? searchResults.count : liveCount) > 0 && (
            <span className="ml-auto text-[10px] font-mono text-accent-cyan bg-accent-cyan/10 px-2 py-0.5 rounded">
              {searchResults ? searchResults.count : liveCount} records
            </span>
          )}
        </div>

        {liveLoading && (
          <div className="text-center text-industrial-300 text-xs py-8 animate-pulse">
            Fetching inventory from MongoDB…
          </div>
        )}
        {liveError && (
          <div className="text-center text-warning-red text-xs py-8">
            ⚠️ Backend offline — {liveError}
          </div>
        )}
        {!liveLoading && !liveError && displayData.length > 0 && (
          <div className="overflow-x-auto overflow-y-auto max-h-[300px] rounded-lg border border-industrial-600">
            <table className="w-full text-[11px] text-left">
              <thead className="bg-industrial-700 sticky top-0 z-10">
                <tr>
                  {columns.map((col) => (
                    <th key={col} className="px-3 py-2 text-industrial-200 uppercase tracking-wider font-semibold whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayData.map((row, i) => (
                  <tr key={i} className="border-t border-industrial-600/50 hover:bg-industrial-700/30 transition-colors">
                    {columns.map((col) => (
                      <td key={col} className="px-3 py-2 text-industrial-100 whitespace-nowrap font-mono">
                        {typeof row[col] === 'number' ? row[col].toLocaleString() : String(row[col] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Row 3: Stockout Predictor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Prediction Form */}
        <div className="panel">
          <div className="panel-header">
            <svg className="w-4 h-4 text-accent-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19 14.5" />
            </svg>
            ML Stockout Predictor
          </div>

          <form onSubmit={handlePredict} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'inventory_levels', label: 'Inventory Levels', placeholder: 'e.g. 120' },
                { key: 'supplier_lead_times', label: 'Supplier Lead Time (days)', placeholder: 'e.g. 7' },
                { key: 'units_sold', label: 'Units Sold', placeholder: 'e.g. 80' },
                { key: 'forecasted_demand', label: 'Forecasted Demand', placeholder: 'e.g. 150' },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-[10px] uppercase tracking-widest text-industrial-300 mb-1 block">{f.label}</label>
                  <input
                    type="number"
                    value={predForm[f.key]}
                    onChange={(e) => setPredForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    required
                    className="w-full bg-industrial-900 border border-industrial-500 rounded-lg px-3 py-2
                               text-gray-100 text-xs font-['JetBrains_Mono']
                               placeholder:text-industrial-300
                               focus:outline-none focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan/20
                               transition-all duration-200"
                  />
                </div>
              ))}
            </div>
            <button
              type="submit"
              disabled={predLoading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {predLoading ? 'Analyzing…' : '🔮 Predict Stockout Risk'}
            </button>
          </form>
        </div>

        {/* Prediction Result */}
        <div className="panel flex flex-col justify-center">
          <div className="panel-header">
            <svg className="w-4 h-4 text-accent-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Prediction Result
          </div>

          {!prediction && !predLoading && (
            <div className="flex flex-col items-center justify-center flex-1 text-industrial-400 py-8">
              <svg className="w-10 h-10 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0" />
              </svg>
              <p className="text-xs">Fill in the form and click predict</p>
            </div>
          )}

          {predLoading && (
            <div className="flex items-center justify-center flex-1 py-8">
              <span className="text-xs text-industrial-300 animate-pulse">Running ML model…</span>
            </div>
          )}

          {prediction && (
            <div className={`rounded-lg border p-4 space-y-3 ${
              (riskColor[prediction.risk_classification] || riskColor['Moderate Risk']).bg
            }`}>
              <div className="text-center">
                <p className={`text-lg font-bold ${
                  (riskColor[prediction.risk_classification] || riskColor['Moderate Risk']).text
                }`}>
                  {prediction.risk_classification}
                </p>
                <p className="text-[10px] text-industrial-300 mt-1">
                  Confidence: <span className="font-mono text-accent-cyan">{(prediction.confidence_score * 100).toFixed(0)}%</span>
                </p>
              </div>
              <div className="bg-black/20 rounded-lg px-3 py-2">
                <p className="text-[10px] uppercase tracking-wider text-industrial-300 mb-0.5">Suggested Action</p>
                <p className="text-xs font-semibold text-gray-100">{prediction.suggested_action}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
