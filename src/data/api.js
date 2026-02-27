const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export async function fetchKPIs() {
  const res = await fetch(`${API_BASE}/api/kpis`);
  if (!res.ok) throw new Error(`KPI fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchReturns() {
  const res = await fetch(`${API_BASE}/api/returns`);
  if (!res.ok) throw new Error(`Returns fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchInventory(limit = 50) {
  const res = await fetch(`${API_BASE}/api/inventory?limit=${limit}`);
  if (!res.ok) throw new Error(`Inventory fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchWarehouseStats() {
  const res = await fetch(`${API_BASE}/api/inventory/warehouse-stats`);
  if (!res.ok) throw new Error(`Warehouse stats fetch failed: ${res.status}`);
  return res.json();
}

export async function predictStockout(features) {
  const res = await fetch(`${API_BASE}/api/predict-stockout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(features),
  });
  if (!res.ok) throw new Error(`Prediction failed: ${res.status}`);
  return res.json();
}

export async function fetchScanLog() {
  const res = await fetch(`${API_BASE}/api/scan-log`);
  if (!res.ok) throw new Error(`Scan log fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchEngineStatus() {
  const res = await fetch(`${API_BASE}/api/engine-status`);
  if (!res.ok) throw new Error(`Engine status fetch failed: ${res.status}`);
  return res.json();
}
export async function scanInventoryItem(product_id, mode) {
  const res = await fetch(`${API_BASE}/api/inventory/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_id, mode }),
  });
  if (!res.ok) throw new Error(`Scan update failed: ${res.status}`);
  return res.json();
}

// ==========================================
// ML MODEL API HELPERS
// ==========================================
export async function fetchMLSummary() {
  const res = await fetch(`${API_BASE}/api/ml/summary`);
  if (!res.ok) throw new Error(`ML summary fetch failed: ${res.status}`);
  return res.json();
}

export async function predictDemand(data) {
  const res = await fetch(`${API_BASE}/api/ml/predict-demand`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Demand prediction failed: ${res.status}`);
  return res.json();
}

export async function fetchTopRisk(limit = 10) {
  const res = await fetch(`${API_BASE}/api/ml/top-risk?limit=${limit}`);
  if (!res.ok) throw new Error(`Top risk fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchAvailableInputs() {
  const res = await fetch(`${API_BASE}/api/ml/available-inputs`);
  if (!res.ok) throw new Error(`Available inputs fetch failed: ${res.status}`);
  return res.json();
}

export async function searchInventory(query) {
  const res = await fetch(`${API_BASE}/api/inventory/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  return res.json();
}

export async function fetchAlerts() {
  const res = await fetch(`${API_BASE}/api/alerts`);
  if (!res.ok) throw new Error(`Alerts fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchSellingInsights() {
  const res = await fetch(`${API_BASE}/api/ml/selling-insights`);
  if (!res.ok) throw new Error(`Selling insights fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchChartData() {
  const res = await fetch(`${API_BASE}/api/inventory/chart-data`);
  if (!res.ok) throw new Error(`Chart data fetch failed: ${res.status}`);
  return res.json();
}
