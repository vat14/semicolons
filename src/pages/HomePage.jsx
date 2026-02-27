import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchKPIs, fetchChartData } from '../data/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const globalPages = [
  { title: 'Home', path: '/', tags: ['dashboard', 'kpi', 'overview', 'quick access'] },
  { title: 'Alerts', path: '/alerts', tags: ['notifications', 'warnings', 'stockout', 'recent alerts'] },
  { title: 'Inventory', path: '/inventory', tags: ['stock', 'items', 'products', 'search', 'map', 'inventory & predictions', 'warehouse locations', 'demand predictor'] },
  { title: 'QR Scan', path: '/scan', tags: ['barcode', 'scanner', 'camera', 'check-in', 'scan item', 'scan new item', 'return', 'returns'] },
  { title: 'Analytics', path: '/analytics', tags: ['charts', 'graphs', 'revenue', 'sku comparison', 'heatmap', 'supply chain kpis', 'warehouse comparison', 'top products by revenue', 'stock health overview', 'units sold vs inventory'] },
  { title: 'Live Feed', path: '/live-feed', tags: ['camera', 'vision', 'engine', 'detection', 'live computer vision', 'recent scan log'] },
  { title: 'ML Insights', path: '/ml-insights', tags: ['predictions', 'demand forecasting', 'risk', 'machine learning demand predictor', 'top stockout risk products'] },
  { title: 'Logistics', path: '/logistics', tags: ['trucks', 'shipments', 'fleet', 'routes', 'fleet tracking overview', 'active map'] },
];

export default function HomePage() {
  const [kpis, setKpis] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchKPIs().then(setKpis).catch(() => {});
    fetchChartData().then(d => setChartData(d?.inv_vs_rop)).catch(() => {});
  }, []);

  const handleSearch = (val) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }
    const q = val.toLowerCase();
    const matches = globalPages.filter(p => 
      p.title.toLowerCase().includes(q) || 
      p.tags.some(t => t.toLowerCase().includes(q))
    );
    setSearchResults(matches);
  };

  const metrics = kpis ? [
    { label: 'Items Tracked', value: kpis.total_items_tracked?.toLocaleString(), change: '+12%', up: true, color: 'text-brand-600' },
    { label: 'Stockout Events', value: kpis.stockout_events, change: kpis.stockout_events > 0 ? 'Needs attention' : '0', up: false, color: 'text-danger-500' },
    { label: 'Avg Inventory Level', value: kpis.average_inventory_level?.toLocaleString(), change: 'Stable', up: true, color: 'text-info-500' },
    { label: 'Returns Today', value: kpis.returns_today || 0, change: kpis.returns_today > 0 ? `${kpis.returns_today} processed` : 'None', up: true, color: 'text-amber-500' },
  ] : [];

  const quickLinks = [
    { label: 'View Alerts', path: '/alerts', icon: '🔔', desc: 'Stock & fleet warnings' },
    { label: 'Inventory', path: '/inventory', icon: '📦', desc: 'Search & predict' },
    { label: 'Analytics', path: '/analytics', icon: '📊', desc: 'Charts & trends' },
    { label: 'ML Insights', path: '/ml-insights', icon: '🔮', desc: 'Demand forecasting' },
    { label: 'Logistics', path: '/logistics', icon: '🚛', desc: 'Fleet tracking' },
    { label: 'Live Feed', path: '/live-feed', icon: '📷', desc: 'Camera & scans' },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between z-50 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Welcome Back 👋</h1>
          <p className="text-sm text-surface-500 mt-1">Your logistics control room — monitoring inventory, fleet, and forecasts</p>
        </div>
        <div className="relative w-full md:w-96 z-50">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            placeholder="Search for pages & features (e.g. Demand Predictor)..."
            onChange={(e) => handleSearch(e.target.value)}
            className="input-field w-full pl-10"
          />
          {searchQuery && (
            <button onClick={() => handleSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 text-sm">✕</button>
          )}
          {searchQuery && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl border border-surface-200 shadow-elevated overflow-hidden z-[60]">
              <div className="max-h-60 overflow-y-auto">
                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-sm text-surface-500">No matching pages</div>
                ) : (
                  searchResults.map((r, i) => (
                    <div key={i} className="px-4 py-3 hover:bg-surface-50 cursor-pointer border-b border-surface-100 last:border-0"
                      onClick={() => { handleSearch(''); navigate(r.path); }}>
                      <div className="font-medium text-surface-800 text-sm">{r.title}</div>
                      <div className="text-[10px] text-surface-400 mt-0.5">{r.tags.join(', ')}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m, i) => (
            <div key={i} className="panel">
              <div className="text-xs text-surface-500 font-medium mb-1">{m.label}</div>
              <div className="flex items-end gap-3">
                <span className={`text-3xl font-bold ${m.color}`}>{m.value}</span>
                <span className={`text-xs font-medium mb-1 ${m.up ? 'text-brand-600' : 'text-danger-500'}`}>
                  {m.up ? '↑' : '↓'} {m.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Links */}
      <div>
        <h3 className="text-sm font-semibold text-surface-700 mb-3">Quick Access</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickLinks.map((link) => (
            <button key={link.path} onClick={() => navigate(link.path)}
              className="panel text-center py-5 hover:shadow-card-hover hover:border-brand-200 transition-all duration-200 cursor-pointer group">
              <div className="text-2xl mb-2">{link.icon}</div>
              <div className="text-sm font-semibold text-surface-800 group-hover:text-brand-600 transition-colors">{link.label}</div>
              <div className="text-[10px] text-surface-400 mt-0.5">{link.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Demand Bar Chart */}
      {chartData && (
        <div className="panel">
          <div className="panel-header mb-4">Inventory vs Reorder Point (Top 10 by Demand)</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="product_id" tick={{ fontSize: 9, fill: '#9ca3af' }} angle={-30} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} />
              <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '11px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Bar dataKey="inventory" name="Inventory" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="reorder_point" name="Reorder Point" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* System Status */}
      <div className="panel">
        <div className="panel-header">System Status</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
          <StatusItem label="Backend API" status="online" />
          <StatusItem label="ML Model" status="trained" />
          <StatusItem label="Vision Engine" status="standby" />
          <StatusItem label="Fleet Tracking" status="active" />
        </div>
      </div>
    </div>
  );
}

function StatusItem({ label, status }) {
  const styles = {
    online: 'bg-brand-500',
    trained: 'bg-brand-500',
    active: 'bg-brand-500',
    standby: 'bg-warning-400',
    offline: 'bg-danger-500',
  };
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${styles[status] || 'bg-surface-400'} ${status !== 'standby' ? 'animate-pulse' : ''}`} />
      <div>
        <div className="text-xs font-medium text-surface-700">{label}</div>
        <div className="text-[10px] text-surface-400 capitalize">{status}</div>
      </div>
    </div>
  );
}
