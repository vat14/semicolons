import { useState, useCallback, useRef } from 'react';
import WarehouseMap from './WarehouseMap';
import CameraFeed from './CameraFeed';
import AlertsPanel from './AlertsPanel';
import ScanStation from './ScanStation';

export default function Dashboard() {
  const [inventory, setInventory] = useState([]);
  const [pulsingZone, setPulsingZone] = useState(null);
  const pulseTimer = useRef(null);

  const handleScan = useCallback((itemId, mode) => {
    // Update inventory
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const newStock = mode === 'add'
            ? item.stock + 1
            : Math.max(0, item.stock - 1);
          return { ...item, stock: newStock };
        }
        return item;
      })
    );

    // Find the zone for this item and trigger pulse
    const item = inventory.find((i) => i.id === itemId);
    if (item) {
      // Clear any existing pulse timer
      if (pulseTimer.current) clearTimeout(pulseTimer.current);

      setPulsingZone(item.zone);
      pulseTimer.current = setTimeout(() => {
        setPulsingZone(null);
      }, 3000);
    }
  }, [inventory]);

  return (
    <div className="min-h-screen bg-industrial-900 flex flex-col">
      {/* Top Bar */}
      <header className="bg-industrial-800 border-b border-industrial-600 px-6 py-3">
        <div className="flex items-center justify-between max-w-[1600px] mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent-cyan/20 rounded-lg flex items-center justify-center
                            border border-accent-cyan/30 animate-glow">
              <svg className="w-4 h-4 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wide text-gray-100">
                Smart Inventory Dashboard
              </h1>
              <p className="text-[10px] text-industrial-300 tracking-wider uppercase">
                Real-Time Warehouse Monitoring
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Stats badges */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="bg-industrial-700 border border-industrial-600 rounded-lg px-3 py-1.5
                              flex items-center gap-2">
                <span className="status-dot-live" />
                <span className="text-[10px] text-industrial-200 uppercase tracking-wider">System Online</span>
              </div>
              <div className="bg-industrial-700 border border-industrial-600 rounded-lg px-3 py-1.5
                              text-[10px] text-industrial-200 font-mono">
                Items: <span className="text-accent-cyan font-bold">{inventory.length}</span>
              </div>
              <div className="bg-industrial-700 border border-industrial-600 rounded-lg px-3 py-1.5
                              text-[10px] text-industrial-200 font-mono">
                Alerts: <span className="text-warning-red font-bold">
                  {inventory.filter((i) => i.stock < i.safetyStock).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main 3-Column Layout */}
      <main className="flex-1 p-4 max-w-[1600px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full"
             style={{ minHeight: 'calc(100vh - 80px)' }}>
          {/* Left Column — Warehouse Map */}
          <div className="lg:col-span-1">
            <WarehouseMap inventory={inventory} pulsingZone={pulsingZone} />
          </div>

          {/* Middle Column — Camera + Alerts */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <CameraFeed />
            <AlertsPanel inventory={inventory} />
          </div>

          {/* Right Column — Scan Station */}
          <div className="lg:col-span-1">
            <ScanStation inventory={inventory} onScan={handleScan} />
          </div>
        </div>
      </main>
    </div>
  );
}
