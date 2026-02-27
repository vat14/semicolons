import { useState, useEffect } from 'react';
import { fetchAlerts, fetchReturns } from '../data/api';
import { delayWarnings, fleetTrucks } from '../data/mockFleet';

export default function AlertsPage() {
  const [stockAlerts, setStockAlerts] = useState([]);
  const [returnAlerts, setReturnAlerts] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchAlerts().then((res) => setStockAlerts(res.alerts || [])).catch(() => {});
    fetchReturns().then((res) => {
      const returns = (res.data || []).map((r, i) => ({
        id: `return-${i}`,
        type: 'return',
        severity: 'low',
        title: `${r.product_id} — ${r.sku_id}`,
        detail: `Returned to ${r.warehouse_id}. Stock: ${r.previous_level} → ${r.new_level}`,
        tag: 'Return',
        timestamp: r.timestamp ? new Date(r.timestamp).toLocaleTimeString() : '',
      }));
      setReturnAlerts(returns);
    }).catch(() => {});
  }, []);

  const fleetAlerts = delayWarnings.map((w) => {
    const truck = fleetTrucks.find((t) => t.id === w.truckId);
    return {
      id: w.id, type: 'fleet',
      severity: w.severity === 'high' ? 'critical' : w.severity,
      title: `${w.truckId} — ${truck?.driver ?? ''}`,
      detail: w.reason,
      tag: 'Fleet Delay',
      timestamp: w.timestamp,
    };
  });

  const mlAlerts = stockAlerts.map((a) => ({
    id: a.id, type: a.type, severity: a.severity,
    title: a.title, detail: a.detail, tag: a.tag, timestamp: '',
  }));

  const allAlerts = [...mlAlerts, ...returnAlerts, ...fleetAlerts].sort((a) => a.severity === 'critical' ? -1 : 1);
  const filtered = filter === 'all' ? allAlerts
    : filter === 'stock' ? allAlerts.filter((a) => a.type !== 'fleet' && a.type !== 'return')
    : filter === 'fleet' ? allAlerts.filter((a) => a.type === 'fleet')
    : filter === 'returns' ? allAlerts.filter((a) => a.type === 'return')
    : allAlerts;

  const severityStyle = {
    critical: 'border-l-4 border-l-danger-500 bg-danger-50/50',
    warning: 'border-l-4 border-l-warning-500 bg-warning-50/50',
    medium: 'border-l-4 border-l-warning-400 bg-warning-50/30',
    low: 'border-l-4 border-l-surface-300 bg-surface-50',
  };

  const tagStyle = {
    'Low Stock': 'badge-danger',
    'Overstock': 'badge-warning',
    'Fleet Delay': 'badge-info',
    'Return': '',
  };

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-surface-900">Alerts Center</h2>
          <p className="text-sm text-surface-500 mt-0.5">Stock warnings, fleet delays, returns & ML recommendations</p>
        </div>
        <div className="flex gap-2">
          {['all', 'stock', 'returns', 'fleet'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f ? 'bg-brand-500 text-white' : 'bg-white border border-surface-200 text-surface-600 hover:bg-surface-50'
              }`}>
              {f === 'all' ? `All (${allAlerts.length})`
                : f === 'stock' ? 'Stock'
                : f === 'returns' ? `Returns (${returnAlerts.length})`
                : 'Fleet'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="panel text-center py-12 text-surface-400 text-sm">No alerts found 🎉</div>
        )}
        {filtered.map((alert) => (
          <div key={alert.id}
            className={`panel animate-alert-slide flex items-start gap-4 ${severityStyle[alert.severity] || severityStyle.low}`}>
            <div className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
              alert.severity === 'critical' ? 'bg-danger-500 animate-pulse'
                : alert.type === 'return' ? 'bg-amber-500'
                : 'bg-warning-500'
            }`} style={alert.type === 'return' ? { backgroundColor: '#f59e0b' } : {}} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className="text-sm font-semibold text-surface-900">{alert.title}</span>
                <span className={tagStyle[alert.tag] || 'badge-neutral'}
                  style={alert.tag === 'Return' ? { backgroundColor: '#fef3c7', color: '#b45309', fontSize: '10px', padding: '2px 8px', borderRadius: '999px', fontWeight: 600 } : {}}>
                  {alert.tag}
                </span>
                {alert.timestamp && (
                  <span className="ml-auto text-[10px] text-surface-400">{alert.timestamp}</span>
                )}
              </div>
              <p className="text-xs text-surface-600 mt-1">{alert.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
