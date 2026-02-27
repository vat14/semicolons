const API_BASE = 'http://localhost:8000';

export async function fetchKPIs() {
  const res = await fetch(`${API_BASE}/api/kpis`);
  if (!res.ok) throw new Error(`KPI fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchInventory(limit = 50) {
  const res = await fetch(`${API_BASE}/api/inventory?limit=${limit}`);
  if (!res.ok) throw new Error(`Inventory fetch failed: ${res.status}`);
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
