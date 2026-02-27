import { useState, useEffect } from 'react';
import { fetchMLSummary, predictDemand, fetchTopRisk, fetchAvailableInputs, fetchSellingInsights } from '../data/api';

export default function MLInsightsPage() {
  const [summary, setSummary] = useState(null);
  const [topRisk, setTopRisk] = useState([]);
  const [inputs, setInputs] = useState({ products: [], warehouses: [] });
  const [prediction, setPrediction] = useState(null);
  const [predLoading, setPredLoading] = useState(false);
  const [form, setForm] = useState({ product_id: '', warehouse_id: '', promotion: 0, lead_time: 14 });
  const [sellingInsights, setSellingInsights] = useState(null);

  useEffect(() => {
    fetchMLSummary().then(setSummary).catch(() => {});
    fetchTopRisk(10).then((r) => setTopRisk(r.data || [])).catch(() => {});
    fetchAvailableInputs().then(setInputs).catch(() => {});
    fetchSellingInsights().then(setSellingInsights).catch(() => {});
  }, []);

  useEffect(() => {
    if (inputs.products.length && !form.product_id) {
      setForm((f) => ({ ...f, product_id: inputs.products[0], warehouse_id: inputs.warehouses[0] }));
    }
  }, [inputs]);

  const handlePredict = async (e) => {
    e.preventDefault();
    setPredLoading(true);
    try { setPrediction(await predictDemand(form)); }
    catch (err) { setPrediction({ error: err.message }); }
    setPredLoading(false);
  };

  const riskBadge = (level) => {
    if (level === 'HIGH') return 'badge-danger';
    if (level === 'MODERATE') return 'badge-warning';
    return 'badge-success';
  };

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-surface-900">ML Demand Forecasting</h2>
        <p className="text-sm text-surface-500 mt-0.5">
          RandomForest model trained on {summary?.total_records?.toLocaleString() || '...'} inventory records
        </p>
      </div>

      {/* Model Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="panel text-center">
            <div className="text-2xl font-bold text-info-600">{summary.mae}</div>
            <div className="text-xs text-surface-500 mt-1">Model MAE</div>
          </div>
          <div className="panel text-center">
            <div className="text-2xl font-bold text-brand-600">{summary.r2}</div>
            <div className="text-xs text-surface-500 mt-1">R² Score</div>
          </div>
          <div className="panel text-center">
            <div className="text-2xl font-bold text-brand-600">₹{summary.cost_savings.toLocaleString()}</div>
            <div className="text-xs text-surface-500 mt-1">Cost Savings</div>
          </div>
          <div className="panel text-center">
            <div className="text-2xl font-bold text-warning-600">{summary.understock_reduction}</div>
            <div className="text-xs text-surface-500 mt-1">Understock Reduction</div>
          </div>
        </div>
      )}

      {/* Two columns: Predictor + Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Demand Predictor */}
        <div className="panel">
          <div className="panel-header">Demand Predictor</div>
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
                <span className={riskBadge(prediction.risk_level)}>{prediction.risk_level} Risk</span>
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

        {/* Top Risk Products */}
        <div className="panel">
          <div className="panel-header">Top Stockout Risk Products</div>
          <div className="mt-2 space-y-0.5">
            <div className="grid grid-cols-5 gap-2 px-3 py-2 text-[10px] uppercase tracking-wider text-surface-400 border-b border-surface-200 font-medium">
              <span>Product ID</span><span>Warehouse</span><span className="text-right">Inventory</span><span className="text-right">ROP</span><span className="text-right">Gap</span>
            </div>
            {topRisk.length === 0 && <div className="text-sm text-surface-400 text-center py-8">No at-risk Products 🎉</div>}
            {topRisk.map((item, i) => (
              <div key={i} className="grid grid-cols-5 gap-2 px-3 py-2.5 text-xs rounded hover:bg-surface-50 transition-colors border-b border-surface-100">
                <span className="text-info-600 font-medium">{item.product_id}</span>
                <span className="text-surface-600">{item.warehouse_id}</span>
                <span className="text-right text-surface-800 font-medium">{item.inventory_level}</span>
                <span className="text-right text-brand-600 font-medium">{item.dynamic_rop}</span>
                <span className="text-right text-danger-500 font-bold">-{item.risk_gap}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cost Comparison */}
      {summary && (
        <div className="panel">
          <div className="panel-header">Static vs Dynamic Reorder — Cost Analysis</div>
          <div className="grid grid-cols-3 gap-5 mt-3">
            <div className="bg-danger-50/50 rounded-xl border border-danger-100 p-4 text-center">
              <div className="text-xs text-surface-500 mb-2">Static Total Cost</div>
              <div className="text-xl font-bold text-danger-600">₹{summary.static_total_cost.toLocaleString()}</div>
              <div className="text-[10px] text-surface-400 mt-1">Fixed reorder point</div>
            </div>
            <div className="bg-brand-50 rounded-xl border border-brand-200 p-4 text-center">
              <div className="text-xs text-surface-500 mb-2">Dynamic Total Cost</div>
              <div className="text-xl font-bold text-brand-600">₹{summary.dynamic_total_cost.toLocaleString()}</div>
              <div className="text-[10px] text-surface-400 mt-1">ML-optimized ROP</div>
            </div>
            <div className="bg-brand-50 rounded-xl border border-brand-200 p-4 text-center">
              <div className="text-xs text-surface-500 mb-2">Total Savings</div>
              <div className="text-xl font-bold text-brand-600">₹{summary.cost_savings.toLocaleString()}</div>
              <div className="text-[10px] text-brand-500 mt-1 font-medium">
                {((summary.cost_savings / summary.static_total_cost) * 100).toFixed(1)}% reduction
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selling Intelligence */}
      {sellingInsights && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="panel">
            <div className="panel-header">🔥 Fast Movers — Reorder Now</div>
            <div className="mt-2 space-y-2.5">
              {(sellingInsights.fast_movers || []).map((item, i) => (
                <div key={i} className="bg-danger-50/40 border border-danger-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-surface-800">{item.product_id}</span>
                    <span className="badge-danger">{item.days_of_stock_left}d left</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                    <div><div className="text-sm font-bold text-surface-800">{item.total_sold?.toLocaleString()}</div>
                      <div className="text-[8px] text-surface-400 uppercase">Sold</div></div>
                    <div><div className="text-sm font-bold text-info-600">{item.avg_daily_demand}</div>
                      <div className="text-[8px] text-surface-400 uppercase">Units/Day</div></div>
                    <div><div className="text-sm font-bold text-surface-800">{item.current_stock?.toLocaleString()}</div>
                      <div className="text-[8px] text-surface-400 uppercase">Stock</div></div>
                  </div>
                  <p className="text-[10px] text-surface-500 mt-2 bg-white rounded px-2 py-1.5 border border-surface-100">{item.recommendation}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">🐌 Slow Movers — Promote</div>
            <div className="mt-2 space-y-2.5">
              {(sellingInsights.slow_movers || []).map((item, i) => (
                <div key={i} className="bg-warning-50/40 border border-warning-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-surface-800">{item.product_id}</span>
                    <span className="badge-warning">{item.overstock_ratio}× overstock</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                    <div><div className="text-sm font-bold text-surface-800">{item.total_sold?.toLocaleString()}</div>
                      <div className="text-[8px] text-surface-400 uppercase">Sold</div></div>
                    <div><div className="text-sm font-bold text-info-600">{item.avg_daily_demand}</div>
                      <div className="text-[8px] text-surface-400 uppercase">Units/Day</div></div>
                    <div><div className="text-sm font-bold text-surface-800">₹{item.unit_cost}</div>
                      <div className="text-[8px] text-surface-400 uppercase">Unit Cost</div></div>
                  </div>
                  <p className="text-[10px] text-surface-500 mt-2 bg-white rounded px-2 py-1.5 border border-surface-100">{item.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
