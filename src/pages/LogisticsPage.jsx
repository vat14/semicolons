import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { fleetTrucks, delayWarnings, dockThroughput } from '../data/mockFleet';

// Fix default Leaflet marker icons (broken in Vite builds)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom truck icons by status
const createTruckIcon = (status, isSelected) => {
  const colors = {
    'in-transit': '#22c55e',
    'delayed': '#ef4444',
    'at-dock': '#06b6d4',
  };
  const color = colors[status] || '#6b7280';
  const size = isSelected ? 18 : 12;
  const border = isSelected ? 3 : 2;
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px; height:${size}px;
      background:${color};
      border:${border}px solid white;
      border-radius:50%;
      box-shadow: 0 0 ${isSelected ? '12' : '6'}px ${color}${isSelected ? '' : '80'};
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

// Component to fly map to selected truck
function FlyToTruck({ truck }) {
  const map = useMap();
  useEffect(() => {
    if (truck) {
      map.flyTo([truck.lat, truck.lng], 7, { duration: 0.8 });
    }
  }, [truck, map]);
  return null;
}

const statusColor = {
  'in-transit': 'text-safe-green bg-safe-green/10 border-safe-green/30',
  'delayed': 'text-warning-red bg-warning-red/10 border-warning-red/30',
  'at-dock': 'text-accent-cyan bg-accent-cyan/10 border-accent-cyan/30',
};

const delayBadge = {
  high: 'bg-warning-red/20 text-warning-red border-warning-red/30',
  medium: 'bg-accent-amber/20 text-accent-amber border-accent-amber/30',
  low: 'bg-industrial-600/50 text-industrial-300 border-industrial-500/30',
};

const routeColors = {
  'in-transit': '#22c55e',
  'delayed': '#ef4444',
  'at-dock': '#06b6d4',
};

export default function LogisticsPage() {
  const center = [20.5937, 78.9629]; // India center
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [truckPositions, setTruckPositions] = useState(fleetTrucks);

  // Simulate live position updates every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setTruckPositions((prev) =>
        prev.map((t) =>
          t.status === 'in-transit'
            ? { ...t, lat: t.lat + (Math.random() - 0.5) * 0.05, lng: t.lng + (Math.random() - 0.5) * 0.05 }
            : t
        )
      );
    }, 5 * 60 * 1000); // 5 min
    return () => clearInterval(interval);
  }, []);

  // Search filtering
  const filteredTrucks = searchQuery.trim()
    ? truckPositions.filter((t) =>
        [t.id, t.driver, t.vehicleNumber, t.cargo, t.origin?.name, t.destination?.name]
          .join(' ')
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
    : truckPositions;

  return (
    <div className="p-6 flex flex-col gap-4 h-full">
      {/* Page Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-100">Logistics Fleet</h2>
        <p className="text-xs text-industrial-300 mt-0.5">
          Live fleet tracking with routes, truck search, delay forecasts, and dock metrics
        </p>
      </div>

      {/* Truck Search Bar */}
      <div className="panel">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-industrial-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search trucks by ID, driver, vehicle number, cargo..."
            className="w-full bg-industrial-900 border border-industrial-600 rounded-lg pl-10 pr-4 py-2.5
                       text-xs text-gray-100 placeholder:text-industrial-400
                       focus:outline-none focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan/20
                       transition-all duration-200"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-industrial-400 hover:text-gray-100 text-xs">
              ✕
            </button>
          )}
        </div>

        {/* Search Results — quick truck cards */}
        {searchQuery.trim() && (
          <div className="mt-3 space-y-2">
            {filteredTrucks.length === 0 && (
              <p className="text-xs text-industrial-400 text-center py-2">No trucks found for "{searchQuery}"</p>
            )}
            {filteredTrucks.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTruck(t)}
                className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                  selectedTruck?.id === t.id
                    ? 'bg-accent-cyan/10 border-accent-cyan/30'
                    : 'bg-industrial-900 border-industrial-700 hover:border-industrial-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-accent-cyan">{t.id}</span>
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${statusColor[t.status]}`}>{t.status}</span>
                  </div>
                  <span className="text-[10px] font-mono text-industrial-300">{t.vehicleNumber}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-4">
                  <span className="text-[10px] text-industrial-300">🧑 {t.driver}</span>
                  <span className="text-[10px] text-industrial-300">📦 {t.cargo}</span>
                  <span className="text-[10px] text-industrial-300">⏱ ETA: {t.eta}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fleet Map with Routes */}
      <div className="panel flex flex-col" style={{ minHeight: '380px' }}>
        <div className="panel-header">
          <svg className="w-4 h-4 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Fleet Tracking Map
          <span className="status-dot-live ml-auto" />
          <span className="text-[10px] text-industrial-300 ml-2">
            {truckPositions.filter((t) => t.status === 'in-transit').length} in transit
          </span>
        </div>
        <div className="flex-1 rounded-lg overflow-hidden" style={{ minHeight: '320px' }}>
          <MapContainer
            center={center}
            zoom={5}
            style={{ height: '100%', width: '100%', minHeight: '320px' }}
            className="rounded-lg"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <FlyToTruck truck={selectedTruck} />

            {/* Route Polylines (origin → current position → destination) */}
            {truckPositions.map((truck) => {
              if (!truck.origin || !truck.destination) return null;
              const isSelected = selectedTruck?.id === truck.id;
              const route = [
                [truck.origin.lat, truck.origin.lng],
                [truck.lat, truck.lng],
                [truck.destination.lat, truck.destination.lng],
              ];
              return (
                <Polyline
                  key={`route-${truck.id}`}
                  positions={route}
                  pathOptions={{
                    color: routeColors[truck.status] || '#6b7280',
                    weight: isSelected ? 4 : 2,
                    opacity: isSelected ? 1 : 0.4,
                    dashArray: truck.status === 'at-dock' ? '8 4' : undefined,
                  }}
                />
              );
            })}

            {/* Truck Markers */}
            {truckPositions.map((truck) => (
              <Marker
                key={truck.id}
                position={[truck.lat, truck.lng]}
                icon={createTruckIcon(truck.status, selectedTruck?.id === truck.id)}
                eventHandlers={{
                  click: () => setSelectedTruck(truck),
                }}
              >
                <Popup>
                  <div style={{ minWidth: '200px', fontFamily: 'system-ui', fontSize: '12px', lineHeight: '1.6' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
                      {truck.id} — {truck.vehicleNumber}
                    </div>
                    <div>🧑 Driver: {truck.driver}</div>
                    <div>📦 {truck.cargoDetails || truck.cargo}</div>
                    <div>🏭 From: {truck.origin?.name || '—'}</div>
                    <div>📍 To: {truck.destination?.name || '—'}</div>
                    <div>⏱ ETA: {truck.eta} | Departed: {truck.departedAt || '—'}</div>
                    <div>📏 Distance: {truck.estimatedKm || '—'} km</div>
                    <div>🌡 Temp: {truck.temp}°C</div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Selected Truck Detail Card */}
      {selectedTruck && (
        <div className={`panel border-2 ${statusColor[selectedTruck.status]}`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-gray-100">{selectedTruck.id}</span>
                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${statusColor[selectedTruck.status]}`}>
                  {selectedTruck.status}
                </span>
              </div>
              <p className="text-[10px] font-mono text-industrial-300">{selectedTruck.vehicleNumber}</p>
            </div>
            <button onClick={() => setSelectedTruck(null)}
              className="text-industrial-400 hover:text-gray-100 text-xs p-1">✕</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
            <DetailField label="Driver" value={selectedTruck.driver} />
            <DetailField label="Cargo" value={selectedTruck.cargoDetails || selectedTruck.cargo} />
            <DetailField label="Origin" value={selectedTruck.origin?.name} />
            <DetailField label="Destination" value={selectedTruck.destination?.name} />
            <DetailField label="ETA" value={selectedTruck.eta} />
            <DetailField label="Departed" value={selectedTruck.departedAt} />
            <DetailField label="Distance" value={`${selectedTruck.estimatedKm} km`} />
            <DetailField label="Temp" value={`${selectedTruck.temp}°C`} />
          </div>
        </div>
      )}

      {/* Bottom half — 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Predictive Delay Warnings */}
        <div className="panel flex flex-col">
          <div className="panel-header">
            <svg className="w-4 h-4 text-warning-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Predictive Delay Warnings
            <span className="ml-auto bg-warning-red/20 text-warning-red text-[10px] font-bold px-2 py-0.5 rounded-full">
              {delayWarnings.length} ACTIVE
            </span>
          </div>

          <div className="space-y-2">
            {delayWarnings.map((w) => (
              <div key={w.id}
                className={`animate-alert-slide p-3 rounded-lg border flex items-start gap-3 ${delayBadge[w.severity]}`}>
                <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                  w.severity === 'high' ? 'bg-warning-red animate-pulse' : w.severity === 'medium' ? 'bg-accent-amber' : 'bg-industrial-400'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-xs font-bold">{w.truckId}</span>
                    <span className="text-[10px] font-mono text-industrial-400">{w.timestamp}</span>
                  </div>
                  <p className="text-[11px] opacity-80">{w.reason}</p>
                  <span className="mt-1.5 inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-black/20">
                    +{w.predictedDelay} min delay
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dock Bottleneck Tracker */}
        <div className="panel flex flex-col">
          <div className="panel-header">
            <svg className="w-4 h-4 text-accent-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Dock Bottleneck Tracker
            <span className="text-[10px] text-industrial-300 ml-auto font-normal normal-case tracking-normal">
              Trucks/hr &amp; avg wait
            </span>
          </div>

          <div className="flex-1" style={{ minHeight: '200px' }}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={dockThroughput} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <defs>
                  <linearGradient id="truckGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="waitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#242a36" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#5a6882' }} />
                <YAxis tick={{ fontSize: 9, fill: '#5a6882' }} />
                <Tooltip
                  contentStyle={{
                    background: '#12151c',
                    border: '1px solid #242a36',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#b4c0d3',
                  }}
                />
                <Area type="monotone" dataKey="trucks" name="Trucks" stroke="#06b6d4"
                  strokeWidth={2} fill="url(#truckGrad)" dot={false} />
                <Area type="monotone" dataKey="avgWait" name="Avg Wait (min)" stroke="#8b5cf6"
                  strokeWidth={2} fill="url(#waitGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, value }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-widest text-industrial-400">{label}</div>
      <div className="text-xs text-gray-100 mt-0.5">{value || '—'}</div>
    </div>
  );
}
