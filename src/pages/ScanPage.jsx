import ScanStation from '../components/ScanStation';
import WarehouseMap from '../components/WarehouseMap';
import { useState, useEffect } from 'react';
import { scanInventoryItem, fetchWarehouseStats } from '../data/api';

export default function ScanPage() {
  const [inventory, setInventory] = useState([]);
  const [pulsingZone, setPulsingZone] = useState(null);
  const [scanError, setScanError] = useState(null);

  // Fetch real warehouse data on mount
  useEffect(() => {
    fetchWarehouseStats().then((res) => {
      const items = [];
      const warehouses = res.warehouses || {};
      Object.entries(warehouses).forEach(([zone, products]) => {
        products.forEach((p) => {
          items.push({ ...p, zone });
        });
      });
      setInventory(items);
    }).catch((err) => console.error('Failed to load warehouse stats:', err));
  }, []);

  const handleScan = async (item, mode) => {
    setScanError(null);
    try {
      // 1. Persist to Backend DB
      const result = await scanInventoryItem(item.id, mode);
      
      // Map WH_X to "WH X" for the 2D map zone format
      const warehouseId = result.warehouse_id || 'WH_1';
      const zoneKey = warehouseId.replace('_', ' '); // WH_1 → WH 1

      // 2. Send scan data to 3D Iframe for animation
      const iframe = document.querySelector('iframe[title="3D Warehouse Map"]');
      if (iframe && iframe.contentWindow && iframe.contentWindow.handleExternalScan) {
          const locationStr = `${warehouseId}-A-1-1`;
          iframe.contentWindow.handleExternalScan({
              id: item.id,
              name: result.product_name || item.id,
              assigned_location: locationStr
          }, mode);
      }

      // 3. Update local UI state so WarehouseMap reflects the change immediately
      setInventory((prev) => {
        const found = prev.find((z) => z.id === item.id || z.name === item.id);
        if (found) {
          const delta = mode === 'remove' ? -1 : 1;
          return prev.map((z) => (z.id === item.id || z.name === item.id) ? { ...z, stock: Math.max(0, z.stock + delta) } : z);
        } else if (mode === 'add' || mode === 'return') {
          return [...prev, { id: item.id, name: result.product_name || item.id, stock: 1, safetyStock: 5, zone: zoneKey }];
        }
        return prev;
      });
      setPulsingZone(zoneKey);
      setTimeout(() => setPulsingZone(null), 3000);
    } catch (err) {
      console.error('Scan Update Failed:', err);
      setScanError(`Product "${item.id}" not found. Try a valid SKU (e.g. SKU_1) or Product ID (e.g. PD00001).`);
      setTimeout(() => setScanError(null), 6000);
    }
  };

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-surface-900">QR Scan — In, Out & Returns</h2>
        <p className="text-sm text-surface-500 mt-0.5">Scan items in/out of inventory or process returns with real-time map updates</p>
      </div>

      {/* Non-blocking error toast */}
      {scanError && (
        <div className="animate-alert-slide bg-danger-50 border border-danger-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="text-danger-500 text-lg">⚠️</span>
          <div className="flex-1">
            <div className="text-sm font-medium text-danger-700">{scanError}</div>
          </div>
          <button onClick={() => setScanError(null)} className="text-danger-400 hover:text-danger-600 text-sm font-bold">✕</button>
        </div>
      )}

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
