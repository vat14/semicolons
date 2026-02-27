import ScanStation from '../components/ScanStation';
import WarehouseMap from '../components/WarehouseMap';
import { useState } from 'react';
import { initialInventory } from '../data/mockInventory';

export default function ScanPage() {
  const [inventory, setInventory] = useState(initialInventory);
  const [pulsingZone, setPulsingZone] = useState(null);

  const handleScan = (item) => {
    setInventory((prev) =>
      prev.map((z) => (z.zone === item.assigned_location ? { ...z, count: z.count + 1 } : z))
    );
    setPulsingZone(item.assigned_location);
    setTimeout(() => setPulsingZone(null), 3000);
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
