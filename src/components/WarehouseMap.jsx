import { useState } from 'react';
import { zoneConfig } from '../data/mockInventory';

export default function WarehouseMap({ inventory, pulsingZone }) {
  const zones = Object.keys(zoneConfig);

  const zoneBelowSafety = {};
  inventory.forEach((item) => {
    if (item.stock < item.safetyStock) {
      zoneBelowSafety[item.zone] = true;
    }
  });

  const itemsByZone = {};
  inventory.forEach((item) => {
    if (!itemsByZone[item.zone]) itemsByZone[item.zone] = [];
    itemsByZone[item.zone].push(item);
  });

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        Live Warehouse Map
        <span className="status-dot-live ml-auto" />
      </div>

      <div className="flex-1 grid grid-cols-3 gap-3 mt-2">
        {zones.map((zone) => {
          const config = zoneConfig[zone];
          const isBelowSafety = zoneBelowSafety[zone];
          const isPulsing = pulsingZone === zone;
          const items = itemsByZone[zone] || [];

          return (
            <div key={zone}
              className={`rounded-xl border-2 p-3 flex flex-col justify-between transition-all duration-300
                ${isPulsing ? 'animate-zone-pulse' : ''}
                ${isBelowSafety
                  ? 'border-danger-300 bg-danger-50'
                  : 'border-surface-200 bg-surface-50 hover:border-brand-200'
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold" style={{ color: config.color }}>{zone}</span>
                <span className="text-lg">{config.icon}</span>
              </div>

              <div className="text-[10px] text-surface-500 mb-1">{config.label}</div>

              <div className="space-y-1 mt-auto">
                {items.map((item) => (
                  <div key={item.id}
                    className={`flex justify-between items-center text-[10px] px-2 py-1 rounded
                      ${item.stock < item.safetyStock ? 'bg-danger-50 text-danger-600' : 'text-surface-600'}`}
                  >
                    <span className="truncate mr-2">{item.name}</span>
                    <span className="font-bold whitespace-nowrap">
                      {item.stock}/{item.safetyStock}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
