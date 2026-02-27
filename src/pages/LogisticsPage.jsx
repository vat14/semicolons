import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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

export default function LogisticsPage() {
  const center = [20.5937, 78.9629]; // India center

  return (
    <div className="p-6 flex flex-col gap-4 h-full">
      {/* Page Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-100">Logistics Fleet</h2>
        <p className="text-xs text-industrial-300 mt-0.5">
          Predictive supply chain — live fleet tracking, delay forecasts, and dock metrics
        </p>
      </div>

      {/* Fleet Map — top half */}
      <div className="panel flex flex-col" style={{ minHeight: '340px' }}>
        <div className="panel-header">
          <svg className="w-4 h-4 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Fleet Tracking Map
          <span className="status-dot-live ml-auto" />
        </div>
        <div className="flex-1 rounded-lg overflow-hidden" style={{ minHeight: '280px' }}>
          <MapContainer
            center={center}
            zoom={5}
            style={{ height: '100%', width: '100%', minHeight: '280px' }}
            className="rounded-lg"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {fleetTrucks.map((truck) => (
              <Marker key={truck.id} position={[truck.lat, truck.lng]}>
                <Popup>
                  <div className="text-xs">
                    <strong>{truck.id}</strong> — {truck.driver}<br />
                    Cargo: {truck.cargo}<br />
                    ETA: {truck.eta}<br />
                    Temp: {truck.temp}°C
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

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
              Trucks/hr & avg wait
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
