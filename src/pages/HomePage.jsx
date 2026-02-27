import { useState, useEffect } from 'react';
import { fetchKPIs, fetchAlerts } from '../data/api';
import { delayWarnings, fleetTrucks } from '../data/mockFleet';

const MetricCard = ({ metric }) => {
  const isWarning = metric.status === 'warning';

  const icons = {
    items: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    stockout: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
    inventory: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  };

  return (
    <div className={`panel flex-1 flex items-center gap-4 ${
      isWarning ? 'border-accent-amber/30 bg-accent-amber/5' : ''
    }`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
        isWarning
          ? 'bg-accent-amber/20 text-accent-amber border border-accent-amber/30'
          : 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20'
      }`}>
        {icons[metric.icon]}
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-widest text-industrial-300 mb-0.5">{metric.label}</p>
        <p className={`text-2xl font-bold ${isWarning ? 'text-accent-amber' : 'text-gray-100'}`}>
          {metric.value}
        </p>
        <p className="text-[10px] text-industrial-400 mt-0.5">{metric.detail}</p>
      </div>
    </div>
  );
};

export default function HomePage() {
  const [kpis, setKpis] = useState(null);
  const [kpiError, setKpiError] = useState(null);
  const [stockAlerts, setStockAlerts] = useState([]);

  useEffect(() => {
    fetchKPIs()
      .then(setKpis)
      .catch((err) => setKpiError(err.message));
    fetchAlerts()
      .then((res) => setStockAlerts(res.alerts || []))
      .catch(() => {});
  }, []);

  // Build KPI cards from live API data
  const liveMetrics = kpis
    ? [
        {
          id: 'metric-items',
          label: 'Total Items Tracked',
          value: kpis.total_items_tracked.toLocaleString(),
          status: 'nominal',
          icon: 'items',
          detail: 'Records in MongoDB',
        },
        {
          id: 'metric-stockout',
          label: 'Stockout Events',
          value: kpis.stockout_events.toLocaleString(),
          status: kpis.stockout_events > 0 ? 'warning' : 'nominal',
          icon: 'stockout',
          detail: 'Items with stockout flag',
        },
        {
          id: 'metric-avg',
          label: 'Avg Inventory Level',
          value: kpis.average_inventory_level.toLocaleString(),
          status: 'nominal',
          icon: 'inventory',
          detail: 'Across all tracked items',
        },
      ]
    : [];

  // Stock alerts from ML model
  const mlAlerts = stockAlerts.map((a) => ({
    id: a.id,
    type: a.type,
    severity: a.severity === 'critical' ? 'critical' : 'warning',
    title: a.title,
    detail: a.detail,
    tag: a.tag,
    timestamp: '',
  }));

  // Fleet delay alerts
  const fleetAlerts = delayWarnings.map((w) => {
    const truck = fleetTrucks.find((t) => t.id === w.truckId);
    return {
      id: w.id,
      type: 'fleet',
      severity: w.severity === 'high' ? 'critical' : w.severity,
      title: `${w.truckId} — ${truck?.driver ?? ''}`,
      detail: w.reason,
      tag: 'Fleet',
      timestamp: w.timestamp,
    };
  });

  const allAlerts = [...mlAlerts, ...fleetAlerts].sort(
    (a, b) => (a.severity === 'critical' ? -1 : 1)
  );

  const severityColor = {
    critical: { bg: 'bg-warning-red/10 border-warning-red/30', dot: 'bg-warning-red', text: 'text-warning-red', tag: 'bg-warning-red/20 text-warning-red' },
    warning: { bg: 'bg-accent-amber/10 border-accent-amber/30', dot: 'bg-accent-amber', text: 'text-accent-amber', tag: 'bg-accent-amber/20 text-accent-amber' },
    medium: { bg: 'bg-accent-amber/10 border-accent-amber/30', dot: 'bg-accent-amber', text: 'text-accent-amber', tag: 'bg-accent-amber/20 text-accent-amber' },
    low: { bg: 'bg-industrial-600/30 border-industrial-500/30', dot: 'bg-industrial-400', text: 'text-industrial-300', tag: 'bg-industrial-600/50 text-industrial-200' },
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-100">System Overview</h2>
        <p className="text-xs text-industrial-300 mt-0.5">Live status from MongoDB + fleet operations</p>
      </div>

      {/* Top Metrics Ribbon */}
      <div className="flex gap-4">
        {kpiError && (
          <div className="panel flex-1 flex items-center justify-center text-warning-red text-xs">
            ⚠️ Backend offline — {kpiError}
          </div>
        )}
        {!kpis && !kpiError && (
          <div className="panel flex-1 flex items-center justify-center text-industrial-300 text-xs animate-pulse py-6">
            Loading KPIs from backend…
          </div>
        )}
        {liveMetrics.map((m) => (
          <MetricCard key={m.id} metric={m} />
        ))}
      </div>

      {/* Active Alerts Feed */}
      <div className="panel">
        <div className="panel-header">
          <svg className="w-4 h-4 text-accent-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          Active Alerts
          <span className="ml-auto bg-warning-red/20 text-warning-red text-[10px] font-bold px-2 py-0.5 rounded-full">
            {allAlerts.length} ACTIVE
          </span>
        </div>

        <div className="space-y-2">
          {allAlerts.map((alert) => {
            const c = severityColor[alert.severity] ?? severityColor.low;
            return (
              <div key={alert.id}
                className={`animate-alert-slide rounded-lg p-3 flex items-start gap-3 border ${c.bg}`}>
                <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${c.dot} ${
                  alert.severity === 'critical' ? 'animate-pulse' : ''
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-xs font-semibold text-gray-100">{alert.title}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${c.tag}`}>
                      {alert.tag}
                    </span>
                  </div>
                  <p className="text-[11px] text-industrial-300">{alert.detail}</p>
                </div>
                {alert.timestamp && (
                  <span className="text-[10px] font-mono text-industrial-400 flex-shrink-0">{alert.timestamp}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
