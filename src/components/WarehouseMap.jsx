import { useState } from 'react';
import { zoneConfig } from '../data/mockInventory';

export default function WarehouseMap({ inventory, pulsingZone }) {
  const zones = Object.keys(zoneConfig);

  // Determine which zones are below safety stock
  const zoneBelowSafety = {};
  inventory.forEach((item) => {
    if (item.stock < item.safetyStock) {
      zoneBelowSafety[item.zone] = true;
    }
  });

  // Items grouped by zone
  const itemsByZone = {};
  inventory.forEach((item) => {
    if (!itemsByZone[item.zone]) itemsByZone[item.zone] = [];
    itemsByZone[item.zone].push(item);
  });

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <svg className="w-4 h-4 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        Live Warehouse Map
        <span className="status-dot-live ml-auto" />
      </div>

      <div className="grid grid-cols-2 grid-rows-2 gap-3 flex-1">
        {zones.map((zoneKey) => {
          const zone = zoneConfig[zoneKey];
          const isCritical = zoneBelowSafety[zoneKey];
          const isPulsing = pulsingZone === zoneKey;
          const items = itemsByZone[zoneKey] || [];

          return (
            <div
              key={zoneKey}
              className={`
                relative rounded-lg border-2 p-3 flex flex-col justify-between
                transition-all duration-300
                ${isCritical
                  ? 'border-warning-red/70 bg-warning-red/10 shadow-lg shadow-warning-red/5'
                  : 'border-industrial-500 bg-industrial-700/50 hover:border-industrial-400'}
                ${isPulsing ? 'animate-zone-pulse border-accent-cyan !bg-accent-cyan/15' : ''}
              `}
            >
              {/* Zone label badge */}
              <div className="flex items-center justify-between mb-2">
                <span className={`
                  text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded
                  ${isCritical ? 'bg-warning-red/20 text-warning-red' : 'bg-accent-cyan/10 text-accent-cyan'}
                `}>
                  {zone.label}
                </span>
                {isCritical && (
                  <span className="text-warning-red text-xs animate-pulse">⚠</span>
                )}
              </div>

              <span className="text-[10px] text-industrial-200 mb-2">{zone.subtitle}</span>

              {/* Items list */}
              <div className="space-y-1.5 flex-1">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`
                      flex items-center justify-between text-xs rounded px-2 py-1
                      ${item.stock < item.safetyStock
                        ? 'bg-warning-red/10 text-warning-red'
                        : 'bg-industrial-600/50 text-industrial-100'}
                    `}
                  >
                    <span className="font-mono text-[10px] opacity-70">{item.id}</span>
                    <span className="font-semibold">
                      {item.stock}
                      <span className="opacity-50">/{item.safetyStock}</span>
                    </span>
                  </div>
                ))}
              </div>

              {/* Corner decoration */}
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 rounded-tr-lg opacity-30
                             border-current" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 rounded-bl-lg opacity-30
                             border-current" />
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-industrial-600">
        <div className="flex items-center gap-1.5 text-[10px] text-industrial-200">
          <span className="w-3 h-2 rounded-sm bg-warning-red/40 border border-warning-red/50" />
          Below Safety Stock
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-industrial-200">
          <span className="w-3 h-2 rounded-sm bg-accent-cyan/30 border border-accent-cyan/50" />
          Scanned / Active
        </div>
      </div>
    </div>
  );
}
