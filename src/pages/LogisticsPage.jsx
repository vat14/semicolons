import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { fleetTrucks, delayWarnings, dockThroughput } from '../data/mockFleet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const createTruckIcon = (status, isSelected) => {
  const colors = { 'in-transit': '#10b981', 'delayed': '#ef4444', 'at-dock': '#3b82f6' };
  const color = colors[status] || '#9ca3af';
  const size = isSelected ? 18 : 12;
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 2px 8px ${color}60;"></div>`,
    iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -size / 2],
  });
};

function FlyToTruck({ truck }) {
  const map = useMap();
  useEffect(() => { if (truck) map.flyTo([truck.lat, truck.lng], 7, { duration: 0.8 }); }, [truck, map]);
  return null;
}

const statusBadge = { 'in-transit': 'badge-success', 'delayed': 'badge-danger', 'at-dock': 'badge-info' };
const routeColors = { 'in-transit': '#10b981', 'delayed': '#ef4444', 'at-dock': '#3b82f6' };
const tooltipStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '11px', color: '#374151', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' };

export default function LogisticsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [truckPositions, setTruckPositions] = useState(fleetTrucks);

  useEffect(() => {
    const interval = setInterval(() => {
      setTruckPositions((prev) =>
        prev.map((t) => t.status === 'in-transit'
          ? { ...t, lat: t.lat + (Math.random() - 0.5) * 0.05, lng: t.lng + (Math.random() - 0.5) * 0.05 } : t)
      );
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredTrucks = searchQuery.trim()
    ? truckPositions.filter((t) =>
        [t.id, t.driver, t.vehicleNumber, t.cargo, t.origin?.name, t.destination?.name]
          .join(' ').toLowerCase().includes(searchQuery.toLowerCase()))
    : truckPositions;

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-surface-900">Logistics Fleet</h2>
        <p className="text-sm text-surface-500 mt-0.5">Live fleet tracking, routes, delays & dock metrics</p>
      </div>

      {/* Truck Search */}
      <div className="panel">
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search trucks by ID, driver, vehicle number, cargo..."
            className="input-field w-full pl-11" />
          {searchQuery && <button onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 text-sm">✕</button>}
        </div>

        {searchQuery.trim() && (
          <div className="mt-3 space-y-2">
            {filteredTrucks.length === 0 && <p className="text-sm text-surface-400 text-center py-3">No trucks found</p>}
            {filteredTrucks.map((t) => (
              <button key={t.id} onClick={() => setSelectedTruck(t)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedTruck?.id === t.id ? 'bg-brand-50 border-brand-200' : 'bg-surface-50 border-surface-200 hover:border-surface-300'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-surface-800">{t.id}</span>
                    <span className={statusBadge[t.status]}>{t.status}</span>
                  </div>
                  <span className="text-[10px] text-surface-400 font-mono">{t.vehicleNumber}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-4 text-[11px] text-surface-500">
                  <span>🧑 {t.driver}</span><span>📦 {t.cargo}</span><span>⏱ {t.eta}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="panel" style={{ minHeight: '380px' }}>
        <div className="panel-header">
          Fleet Tracking Map
          <span className="ml-auto flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
            <span className="text-[10px] text-surface-400">{truckPositions.filter((t) => t.status === 'in-transit').length} in transit</span>
          </span>
        </div>
        <div className="rounded-lg overflow-hidden border border-surface-200" style={{ height: '320px' }}>
          <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
            <FlyToTruck truck={selectedTruck} />
            {truckPositions.map((truck) => {
              if (!truck.origin || !truck.destination) return null;
              return (
                <Polyline key={`r-${truck.id}`}
                  positions={[[truck.origin.lat, truck.origin.lng], [truck.lat, truck.lng], [truck.destination.lat, truck.destination.lng]]}
                  pathOptions={{ color: routeColors[truck.status] || '#9ca3af', weight: selectedTruck?.id === truck.id ? 4 : 2,
                    opacity: selectedTruck?.id === truck.id ? 1 : 0.4, dashArray: truck.status === 'at-dock' ? '8 4' : undefined }} />
              );
            })}
            {truckPositions.map((truck) => (
              <Marker key={truck.id} position={[truck.lat, truck.lng]}
                icon={createTruckIcon(truck.status, selectedTruck?.id === truck.id)}
                eventHandlers={{ click: () => setSelectedTruck(truck) }}>
                <Popup>
                  <div style={{ minWidth: '200px', fontSize: '12px', lineHeight: '1.6' }}>
                    <b>{truck.id} — {truck.vehicleNumber}</b><br />
                    🧑 {truck.driver}<br />📦 {truck.cargo}<br />
                    🏭 {truck.origin?.name} → 📍 {truck.destination?.name}<br />
                    ⏱ ETA: {truck.eta} | 📏 {truck.estimatedKm} km
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Selected Truck Detail */}
      {selectedTruck && (
        <div className="panel border-2 border-brand-200">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-surface-900">{selectedTruck.id}</span>
                <span className={statusBadge[selectedTruck.status]}>{selectedTruck.status}</span>
              </div>
              <p className="text-[10px] text-surface-400 font-mono">{selectedTruck.vehicleNumber}</p>
            </div>
            <button onClick={() => setSelectedTruck(null)} className="text-surface-400 hover:text-surface-600 text-sm p-1">✕</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
            <Field label="Driver" value={selectedTruck.driver} />
            <Field label="Cargo" value={selectedTruck.cargoDetails || selectedTruck.cargo} />
            <Field label="Origin" value={selectedTruck.origin?.name} />
            <Field label="Destination" value={selectedTruck.destination?.name} />
            <Field label="ETA" value={selectedTruck.eta} />
            <Field label="Departed" value={selectedTruck.departedAt} />
            <Field label="Distance" value={`${selectedTruck.estimatedKm} km`} />
            <Field label="Temp" value={`${selectedTruck.temp}°C`} />
          </div>
        </div>
      )}

      {/* Bottom: Delays + Dock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="panel">
          <div className="panel-header">
            Predictive Delay Warnings
            <span className="ml-auto badge-danger">{delayWarnings.length} ACTIVE</span>
          </div>
          <div className="space-y-2 mt-2">
            {delayWarnings.map((w) => (
              <div key={w.id} className={`animate-alert-slide p-3 rounded-lg border flex items-start gap-3 ${
                w.severity === 'high' ? 'bg-danger-50/50 border-danger-100' : 'bg-warning-50/50 border-warning-100'}`}>
                <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                  w.severity === 'high' ? 'bg-danger-500 animate-pulse' : 'bg-warning-500'}`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-xs font-bold text-surface-800">{w.truckId}</span>
                    <span className="text-[10px] text-surface-400">{w.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-surface-600">{w.reason}</p>
                  <span className="mt-1.5 inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-surface-100 text-surface-600">
                    +{w.predictedDelay} min delay
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">Dock Bottleneck Tracker</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dockThroughput} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="truckG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="waitG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="trucks" name="Trucks" stroke="#3b82f6" strokeWidth={2} fill="url(#truckG)" dot={false} />
              <Area type="monotone" dataKey="avgWait" name="Avg Wait" stroke="#8b5cf6" strokeWidth={2} fill="url(#waitG)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-surface-400 font-medium">{label}</div>
      <div className="text-xs text-surface-800 mt-0.5 font-medium">{value || '—'}</div>
    </div>
  );
}
