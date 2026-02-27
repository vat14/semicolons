import ScanStation from '../components/ScanStation';
import WarehouseMap from '../components/WarehouseMap';
import { useState } from 'react';
import { initialInventory } from '../data/mockInventory';
import { scanInventoryItem } from '../data/api';

export default function ScanPage() {
  const [inventory, setInventory] = useState(initialInventory);
  const [pulsingZone, setPulsingZone] = useState(null);

  const handleScan = async (item, mode) => {
    try {
      // 1. Persist to Backend DB
      const result = await scanInventoryItem(item.id, mode);
      
      // Send scan data explicitly to 3D Iframe 
      const iframe = document.querySelector('iframe[title="3D Warehouse Map"]');
      if (iframe && iframe.contentWindow && iframe.contentWindow.handleExternalScan) {
          const locationStr = result.warehouse_id ? `${result.warehouse_id}-A-1-1` : 'WH_1-A-1-1';
          iframe.contentWindow.handleExternalScan({
              id: item.id,
              name: result.product_name || item.id,
              assigned_location: locationStr
          }, mode);
      }

      // 2. Update local UI state array so WarehouseMap actively animates
      setInventory((prev) => {
        const found = prev.find((z) => z.id === item.id || z.name === item.id);
        if (found) {
          return prev.map((z) => (z.id === item.id || z.name === item.id) ? { ...z, stock: Math.max(0, z.stock + (mode === 'add' ? 1 : -1)) } : z);
        } else if (mode === 'add') {
          return [...prev, { id: item.id, name: item.id, stock: 1, safetyStock: 5, zone: item.assigned_location }];
        }
        return prev;
      });
      setPulsingZone(item.assigned_location);
      setTimeout(() => setPulsingZone(null), 3000);
    } catch (err) {
      console.error('Scan Update Failed:', err);
      alert('Failed to update database. Check Product ID matches dataset.');
    }
  };

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-surface-900">QR Scan — In & Out</h2>
        <p className="text-sm text-surface-500 mt-0.5">Scan items in/out of inventory with real-time map updates</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ScanStation onScan={handleScan} />
        <WarehouseMap inventory={inventory} pulsingZone={pulsingZone} />
      </div>

      <div className="mt-8 panel overflow-hidden p-0 flex flex-col" style={{ height: '600px' }}>
        <div className="p-4 border-b border-surface-200 bg-white">
          <h3 className="font-semibold text-surface-800 flex items-center gap-2">
            <span className="text-brand-500">🏭</span> 3D Warehouse Digital Twin
          </h3>
          <p className="text-xs text-surface-500">Interactive live view of all 5 warehouse sites</p>
        </div>
        <iframe 
          src="/3d/index.html" 
          className="w-full flex-1 border-0" 
          title="3D Warehouse Map" 
        />
      </div>
    </div>
  );
}
