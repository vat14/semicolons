export default function AlertsPanel({ inventory }) {
  // Filter items below safety stock for EOQ reorder warnings
  const alerts = inventory
    .filter((item) => item.stock < item.safetyStock)
    .map((item) => ({
      ...item,
      deficit: item.safetyStock - item.stock,
      severity: item.stock <= item.safetyStock * 0.3 ? 'critical' : 'warning',
    }));

  return (
    <div className="panel flex flex-col flex-1">
      <div className="panel-header">
        <svg className="w-4 h-4 text-accent-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        EOQ Reorder Alerts
        {alerts.length > 0 && (
          <span className="ml-auto bg-warning-red/20 text-warning-red text-[10px] font-bold px-2 py-0.5 rounded-full">
            {alerts.length} ACTIVE
          </span>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-industrial-300 py-6">
          <svg className="w-8 h-8 mb-2 text-safe-green/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs">All stock levels nominal</span>
        </div>
      ) : (
        <div className="space-y-2 overflow-y-auto flex-1">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`
                animate-alert-slide rounded-lg p-3 flex items-start gap-3
                ${alert.severity === 'critical'
                  ? 'bg-warning-red/10 border border-warning-red/30'
                  : 'bg-accent-amber/10 border border-accent-amber/30'}
              `}
            >
              <div className={`
                mt-0.5 w-2 h-2 rounded-full flex-shrink-0
                ${alert.severity === 'critical' ? 'bg-warning-red animate-pulse' : 'bg-accent-amber'}
              `} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-100 truncate">
                    {alert.name}
                  </span>
                  <span className="text-[10px] font-mono text-industrial-300 flex-shrink-0 ml-2">
                    {alert.id}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className={alert.severity === 'critical' ? 'text-warning-red' : 'text-accent-amber'}>
                    Stock: <strong>{alert.stock}</strong>
                  </span>
                  <span className="text-industrial-300">
                    Safety: {alert.safetyStock}
                  </span>
                  <span className="text-industrial-300">
                    Zone {alert.zone}
                  </span>
                </div>
                <div className="mt-1.5 text-[10px] font-medium">
                  <span className={`
                    px-2 py-0.5 rounded
                    ${alert.severity === 'critical'
                      ? 'bg-warning-red/20 text-warning-red'
                      : 'bg-accent-amber/20 text-accent-amber'}
                  `}>
                    ↑ Reorder {alert.deficit} units (EOQ trigger)
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
