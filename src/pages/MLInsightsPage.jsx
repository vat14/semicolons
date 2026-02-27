import { useState, useEffect } from 'react';
import { fetchMLSummary, predictDemand, fetchTopRisk, fetchAvailableInputs, fetchSellingInsights } from '../data/api';

export default function MLInsightsPage() {
  const [summary, setSummary] = useState(null);
  const [topRisk, setTopRisk] = useState([]);
  const [inputs, setInputs] = useState({ skus: [], warehouses: [] });
  const [prediction, setPrediction] = useState(null);
  const [predLoading, setPredLoading] = useState(false);
  const [form, setForm] = useState({ sku_id: '', warehouse_id: '', promotion: 0, lead_time: 14 });
  const [sellingInsights, setSellingInsights] = useState(null);

  useEffect(() => {
    fetchMLSummary().then(setSummary).catch(() => {});
    fetchTopRisk(10).then((r) => setTopRisk(r.data || [])).catch(() => {});
    fetchAvailableInputs().then(setInputs).catch(() => {});
    fetchSellingInsights().then(setSellingInsights).catch(() => {});
  }, []);

  // Auto-set first SKU and WH once loaded
  useEffect(() => {
    if (inputs.skus.length && !form.sku_id) {
      setForm((f) => ({ ...f, sku_id: inputs.skus[0], warehouse_id: inputs.warehouses[0] }));
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

  const riskColor = (level) => {
    if (level === 'HIGH') return 'text-warning-red';
    if (level === 'MODERATE') return 'text-amber-400';
    return 'text-safe-green';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-100 flex items-center gap-3">
          <div className="w-9 h-9 bg-accent-violet/20 rounded-lg flex items-center justify-center border border-accent-violet/30">
            <svg className="w-5 h-5 text-accent-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-1.455.654a3.375 3.375 0 01-3.09 0L13 14.5" />
            </svg>
          </div>
          ML Demand Forecasting
        </h1>
        <p className="text-xs text-industrial-300 mt-1 ml-12">
          RandomForest model trained on {summary?.total_records?.toLocaleString() || '...'} inventory records
        </p>
      </div>

      {/* Model Stats Row */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Model MAE" value={summary.mae} sub="Mean Absolute Error" color="cyan" />
          <StatCard label="Model R²" value={summary.r2} sub="Fit Score" color="violet" />
          <StatCard label="Cost Savings" value={`₹${summary.cost_savings.toLocaleString()}`} sub="Static → Dynamic ROP" color="green" />
          <StatCard label="Understock Reduction" value={summary.understock_reduction} sub="Fewer stockout events" color="amber" />
        </div>
      )}

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left: Demand Predictor */}
        <div className="panel">
          <div className="panel-header">
            <svg className="w-4 h-4 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Demand Predictor
          </div>

          <form onSubmit={handlePredict} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-industrial-300 block mb-1">SKU</label>
                <select value={form.sku_id} onChange={(e) => setForm({ ...form, sku_id: e.target.value })}
                  className="input-field w-full text-xs">
                  {inputs.skus.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-industrial-300 block mb-1">Warehouse</label>
                <select value={form.warehouse_id} onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}
                  className="input-field w-full text-xs">
                  {inputs.warehouses.map((w) => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-industrial-300 block mb-1">Lead Time (days)</label>
                <input type="number" value={form.lead_time} onChange={(e) => setForm({ ...form, lead_time: parseInt(e.target.value) || 14 })}
                  className="input-field w-full text-xs" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-industrial-300 block mb-1">Promotion?</label>
                <select value={form.promotion} onChange={(e) => setForm({ ...form, promotion: parseInt(e.target.value) })}
                  className="input-field w-full text-xs">
                  <option value={0}>No</option>
                  <option value={1}>Yes</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={predLoading} className="btn-primary w-full">
              {predLoading ? 'Predicting...' : '🔮 Predict Demand'}
            </button>
          </form>

          {/* Prediction Result */}
          {prediction && !prediction.error && (
            <div className="mt-4 bg-industrial-900 rounded-lg border border-industrial-600 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-industrial-300">
                  {prediction.sku_id} @ {prediction.warehouse_id}
                </span>
                <span className={`text-xs font-bold uppercase ${riskColor(prediction.risk_level)}`}>
                  {prediction.risk_level} Risk
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-2">
                <div className="text-center">
                  <div className="text-lg font-bold text-accent-cyan">{prediction.predicted_daily_demand}</div>
                  <div className="text-[9px] text-industrial-400 uppercase">Predicted Demand</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-accent-violet">{prediction.dynamic_reorder_point}</div>
                  <div className="text-[9px] text-industrial-400 uppercase">Reorder Point</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-100">{prediction.current_inventory}</div>
                  <div className="text-[9px] text-industrial-400 uppercase">Current Stock</div>
                </div>
              </div>

              <div className="bg-industrial-800 rounded p-2 mt-2">
                <span className="text-[10px] text-industrial-300">💡 Suggested Action: </span>
                <span className="text-[10px] text-gray-100 font-medium">{prediction.suggested_action}</span>
              </div>
            </div>
          )}

          {prediction?.error && (
            <div className="mt-4 bg-warning-red/10 border border-warning-red/20 rounded-lg p-3 text-xs text-warning-red">
              ⚠️ {prediction.error}
            </div>
          )}
        </div>

        {/* Right: Top Risk SKUs */}
        <div className="panel">
          <div className="panel-header">
            <svg className="w-4 h-4 text-warning-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Top Stockout Risk SKUs
          </div>

          <div className="mt-4 space-y-1">
            {/* Table Header */}
            <div className="grid grid-cols-5 gap-2 px-3 py-2 text-[9px] uppercase tracking-widest text-industrial-400 border-b border-industrial-600">
              <span>SKU</span>
              <span>Warehouse</span>
              <span className="text-right">Inventory</span>
              <span className="text-right">ROP</span>
              <span className="text-right">Gap</span>
            </div>

            {topRisk.length === 0 && (
              <div className="text-xs text-industrial-400 text-center py-6">
                No at-risk SKUs detected 🎉
              </div>
            )}

            {topRisk.map((item, i) => (
              <div key={i} className="grid grid-cols-5 gap-2 px-3 py-2 text-xs rounded hover:bg-industrial-700/50 transition-colors border-b border-industrial-700/50">
                <span className="text-accent-cyan font-mono">{item.sku_id}</span>
                <span className="text-industrial-200">{item.warehouse_id}</span>
                <span className="text-right text-gray-100 font-mono">{item.inventory_level}</span>
                <span className="text-right text-accent-violet font-mono">{item.dynamic_rop}</span>
                <span className="text-right text-warning-red font-bold font-mono">-{item.risk_gap}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cost Comparison Panel */}
      {summary && (
        <div className="panel">
          <div className="panel-header">
            <svg className="w-4 h-4 text-safe-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Static vs Dynamic Reorder — Cost Analysis
          </div>

          <div className="grid grid-cols-3 gap-6 mt-4">
            <div className="bg-industrial-900 rounded-lg border border-industrial-600 p-4 text-center">
              <div className="text-[10px] uppercase tracking-widest text-industrial-400 mb-2">Static Total Cost</div>
              <div className="text-xl font-bold text-warning-red">₹{summary.static_total_cost.toLocaleString()}</div>
              <div className="text-[9px] text-industrial-400 mt-1">Fixed reorder point</div>
            </div>
            <div className="bg-industrial-900 rounded-lg border border-industrial-600 p-4 text-center">
              <div className="text-[10px] uppercase tracking-widest text-industrial-400 mb-2">Dynamic Total Cost</div>
              <div className="text-xl font-bold text-safe-green">₹{summary.dynamic_total_cost.toLocaleString()}</div>
              <div className="text-[9px] text-industrial-400 mt-1">ML-optimized ROP (k={summary.volatility_factor_k})</div>
            </div>
            <div className="bg-safe-green/5 rounded-lg border border-safe-green/20 p-4 text-center">
              <div className="text-[10px] uppercase tracking-widest text-safe-green/80 mb-2">Total Savings</div>
              <div className="text-xl font-bold text-safe-green">₹{summary.cost_savings.toLocaleString()}</div>
              <div className="text-[9px] text-safe-green/60 mt-1">
                {((summary.cost_savings / summary.static_total_cost) * 100).toFixed(1)}% cost reduction
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selling Intelligence Panel */}
      {sellingInsights && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fast Movers */}
          <div className="panel">
            <div className="panel-header">
              <svg className="w-4 h-4 text-warning-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              🔥 Fast Movers — Reorder Now
            </div>
            <div className="mt-3 space-y-3">
              {(sellingInsights.fast_movers || []).map((item, i) => (
                <div key={i} className="bg-warning-red/5 border border-warning-red/20 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-accent-cyan">{item.sku_id}</span>
                    <span className="text-[9px] font-mono text-warning-red">{item.days_of_stock_left}d stock left</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                    <div>
                      <div className="text-sm font-bold text-gray-100">{item.total_sold?.toLocaleString()}</div>
                      <div className="text-[8px] text-industrial-400 uppercase">Total Sold</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-accent-violet">{item.avg_daily_demand}</div>
                      <div className="text-[8px] text-industrial-400 uppercase">Units/Day</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-100">{item.current_stock?.toLocaleString()}</div>
                      <div className="text-[8px] text-industrial-400 uppercase">Current Stock</div>
                    </div>
                  </div>
                  <p className="text-[10px] text-industrial-300 mt-2 bg-black/20 rounded px-2 py-1.5">{item.recommendation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Slow Movers */}
          <div className="panel">
            <div className="panel-header">
              <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M20 12H4" />
              </svg>
              🐌 Slow Movers — Consider Promotion
            </div>
            <div className="mt-3 space-y-3">
              {(sellingInsights.slow_movers || []).map((item, i) => (
                <div key={i} className="bg-amber-400/5 border border-amber-400/20 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-accent-cyan">{item.sku_id}</span>
                    <span className="text-[9px] font-mono text-amber-400">{item.overstock_ratio}× overstock</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                    <div>
                      <div className="text-sm font-bold text-gray-100">{item.total_sold?.toLocaleString()}</div>
                      <div className="text-[8px] text-industrial-400 uppercase">Total Sold</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-accent-violet">{item.avg_daily_demand}</div>
                      <div className="text-[8px] text-industrial-400 uppercase">Units/Day</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-100">₹{item.unit_cost}</div>
                      <div className="text-[8px] text-industrial-400 uppercase">Unit Cost</div>
                    </div>
                  </div>
                  <p className="text-[10px] text-industrial-300 mt-2 bg-black/20 rounded px-2 py-1.5">{item.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  const colors = {
    cyan: 'border-accent-cyan/20 text-accent-cyan',
    violet: 'border-accent-violet/20 text-accent-violet',
    green: 'border-safe-green/20 text-safe-green',
    amber: 'border-amber-400/20 text-amber-400',
  };

  return (
    <div className={`panel flex flex-col items-center justify-center py-4 ${colors[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-industrial-300 mt-1">{label}</div>
      <div className="text-[9px] text-industrial-400 mt-0.5">{sub}</div>
    </div>
  );
}
