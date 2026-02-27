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
      await scanInventoryItem(item.id, mode);
      
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
    </div>
  );
}
