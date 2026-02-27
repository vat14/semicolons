from fastapi import FastAPI, HTTPException, Request  # type: ignore
from fastapi.middleware.cors import CORSMiddleware  # type: ignore
from fastapi.responses import StreamingResponse, Response  # type: ignore
from pydantic import BaseModel  # type: ignore
from typing import Optional
import random
import csv
import os
import time
import asyncio
import ml_model  # type: ignore

app = FastAPI(title="Semicolons Inventory API v2", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# LOAD DATA FROM CSV (bypasses MongoDB SSL issues on Python 3.14)
# ==========================================
CSV_PATH = os.path.join(os.path.dirname(__file__), "inventory_control_tower_master.csv")

_data_cache: list[dict] = []

def load_data() -> list[dict]:
    global _data_cache
    if _data_cache:
        return _data_cache
    with open(CSV_PATH, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        _data_cache = []
        for i, row in enumerate(reader):
            # Convert numeric fields
            for key in row:
                try:
                    if '.' in row[key]:
                        row[key] = float(row[key])
                    else:
                        row[key] = int(row[key])
                except (ValueError, TypeError):
                    pass
            _data_cache.append(row)
            if i >= 4999:  # Limit to 5000 records like upload_data.py
                break
    return _data_cache

# Pre-load on startup
@app.on_event("startup")
def startup():
    load_data()
    print(f"✅ Loaded {len(_data_cache)} records from CSV")
    try:
        ml_model.train_model()
    except Exception as e:
        print(f"⚠️ ML Model training failed: {e}")

# ==========================================
# PYDANTIC MODELS
# ==========================================
class SupplyChainFeatures(BaseModel):
    inventory_levels: int
    supplier_lead_times: int
    units_sold: int
    forecasted_demand: int

class ScanItem(BaseModel):
    part_id: str
    assigned_location: str
    physical_location: str
    status: str
    detected_shape: Optional[str] = "UNKNOWN"

class DemandPredictRequest(BaseModel):
    product_id: str
    warehouse_id: str
    promotion: int = 0
    lead_time: int = 14

# ==========================================
# VISION ENGINE STATE (in-memory)
# ==========================================
scan_log: list[dict] = []
last_engine_heartbeat: float = 0
latest_frame: bytes = b""  # Latest JPEG frame from engine.py

# ==========================================
# SUPPLY CHAIN ENDPOINTS
# ==========================================
@app.get("/api/inventory")
def get_inventory_status(limit: int = 50):
    try:
        data = load_data()[:limit]  # type: ignore
        return {"count": len(data), "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/kpis")
def get_dashboard_kpis():
    """KPIs computed from CSV data"""
    try:
        data = load_data()
        total_records = len(data)
        
        # Count stockout events
        stockout_count = sum(1 for row in data if row.get("Stockout_Flag") == 1)
        
        # Average Inventory Level
        inv_levels = [row.get("Inventory_Level", 0) for row in data if isinstance(row.get("Inventory_Level"), (int, float))]
        avg_inv = round(sum(inv_levels) / len(inv_levels), 2) if inv_levels else 0  # type: ignore

        return {
            "total_items_tracked": total_records,
            "stockout_events": stockout_count,
            "average_inventory_level": avg_inv
        }
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/predict-stockout")
def predict_stockout_risk(features: SupplyChainFeatures):
    """
    DUMMY ML ENDPOINT FOR THE NEW DATASET:
    Calculates a fake risk based on Lead Times and Inventory vs Demand.
    Swap this for your PyTorch/XGBoost model when it's ready.
    """
    risk_factor = (features.forecasted_demand - features.inventory_levels) * features.supplier_lead_times
    
    if risk_factor > 100:
        risk_class = "High Risk of Stockout"
        action = "Initiate Emergency Reorder"
    elif risk_factor > 0:
        risk_class = "Moderate Risk"
        action = "Monitor Closely"
    else:
        risk_class = "Low Risk / Overstocked"
        action = "Delay Next Order"

    return {
        "status": "success",
        "prediction": {
            "risk_classification": risk_class,
            "confidence_score": round(random.uniform(0.75, 0.98), 2),  # type: ignore
            "suggested_action": action
        }
    }

@app.get("/api/inventory/search")
def search_inventory(q: str = ""):
    """Fuzzy search across all inventory columns."""
    if not q.strip():
        return {"count": 0, "data": []}
    query = q.strip().lower()
    data = load_data()
    results = []
    for row in data:
        for val in row.values():
            if query in str(val).lower():
                results.append(row)
                break
    return {"count": len(results), "data": results[:100]}

@app.get("/api/alerts")
def get_alerts():
    """Returns stock alerts (low stock / high stock) from the ML dataset."""
    alerts = []
    try:
        if ml_model._df is not None:
            df = ml_model._df
            # Get latest row per SKU+Warehouse
            latest = df.sort_values('Date').groupby(['Product_ID', 'Warehouse_ID']).last().reset_index()

            # Low stock alerts: inventory below dynamic reorder point
            low_stock = latest[latest['Inventory_Level'] < latest['Dynamic_ROP']].sort_values('Inventory_Level')
            for _, row in low_stock.head(5).iterrows():
                alerts.append({
                    "id": f"LS-{row['Product_ID']}-{row['Warehouse_ID']}",
                    "type": "low_stock",
                    "severity": "critical",
                    "title": f"{row['Product_ID']} @ {row['Warehouse_ID']}",
                    "detail": f"Stock: {int(row['Inventory_Level'])} units — below reorder point ({round(float(row['Dynamic_ROP']), 0)}). High demand item, reorder immediately.",
                    "tag": "Low Stock",
                })

            # High stock alerts: inventory way above demand (overstock)
            latest['Overstock_Ratio'] = latest['Inventory_Level'] / (latest['Units_Sold'].clip(lower=1))
            high_stock = latest[latest['Overstock_Ratio'] > 50].sort_values('Overstock_Ratio', ascending=False)
            for _, row in high_stock.head(5).iterrows():
                alerts.append({
                    "id": f"HS-{row['Product_ID']}-{row['Warehouse_ID']}",
                    "type": "high_stock",
                    "severity": "warning",
                    "title": f"{row['Product_ID']} @ {row['Warehouse_ID']}",
                    "detail": f"Stock: {int(row['Inventory_Level'])} units — {round(float(row['Overstock_Ratio']), 0)}× daily sales. Capital stuck, consider promotion.",
                    "tag": "Overstock",
                })
    except Exception as e:
        print(f"Alert generation error: {e}")

    return {"alerts": alerts}

@app.get("/api/ml/selling-insights")
def get_selling_insights():
    """Returns fast-selling and slow-selling SKU analysis with recommendations."""
    result = ml_model.get_selling_insights() if hasattr(ml_model, 'get_selling_insights') else {"fast_movers": [], "slow_movers": []}
    return result

@app.get("/api/inventory/chart-data")
def get_chart_data():
    """Pre-aggregated data for all 6 inventory charts."""
    if ml_model._df is None:
        raise HTTPException(status_code=503, detail="ML model not trained yet")
    df = ml_model._df

    # 1. Inventory Level vs Reorder Point (latest per SKU, top 15)
    latest = df.sort_values('Date').groupby('Product_ID').last().reset_index()
    top_products = latest.sort_values('Inventory_Level', ascending=False).head(15)
    inv_vs_rop = [
        {"product_id": row['Product_ID'], "inventory": int(row['Inventory_Level']),
         "reorder_point": round(float(row['Dynamic_ROP']), 0)}
        for _, row in top_products.iterrows()
    ]

    # 2. Units Sold over time (daily aggregate)
    daily = df.groupby(df['Date'].dt.strftime('%Y-%m-%d')).agg(
        total_sold=('Units_Sold', 'sum'),
        avg_inventory=('Inventory_Level', 'mean'),
    ).reset_index().rename(columns={'Date': 'date'})
    daily = daily.tail(30)  # last 30 days
    time_series = [
        {"date": row['date'], "sold": int(row['total_sold']),
         "avg_inv": round(float(row['avg_inventory']), 0)}
        for _, row in daily.iterrows()
    ]

    # 3. Stock Health Donut
    low = int((latest['Inventory_Level'] < latest['Dynamic_ROP']).sum())
    healthy = int(((latest['Inventory_Level'] >= latest['Dynamic_ROP']) &
                   (latest['Inventory_Level'] <= latest['Dynamic_ROP'] * 3)).sum())
    over = int((latest['Inventory_Level'] > latest['Dynamic_ROP'] * 3).sum())
    stockout = int((latest['Inventory_Level'] <= 0).sum())
    stock_health = [
        {"name": "Low Stock", "value": low, "color": "#ef4444"},
        {"name": "Healthy", "value": healthy, "color": "#22c55e"},
        {"name": "Overstocked", "value": over, "color": "#f59e0b"},
        {"name": "Stockout", "value": stockout, "color": "#dc2626"},
    ]

    # 4. Top 10 Revenue SKUs
    latest['Revenue'] = latest['Units_Sold'] * latest['Unit_Cost']
    top_rev = latest.sort_values('Revenue', ascending=False).head(10)
    revenue = [
        {"product_id": row['Product_ID'], "revenue": round(float(row['Revenue']), 2),
         "units": int(row['Units_Sold'])}
        for _, row in top_rev.iterrows()
    ]

    # 5. Warehouse Comparison
    wh_stats = df.groupby('Warehouse_ID').agg(
        avg_inv=('Inventory_Level', 'mean'),
        total_sold=('Units_Sold', 'sum'),
        stockouts=('Stockout_Flag', 'sum'),
        avg_lead=('Supplier_Lead_Time_Days', 'mean'),
        fill_rate=('Inventory_Level', lambda x: (x > 0).mean() * 100),
    ).reset_index()
    warehouse = [
        {"warehouse": row['Warehouse_ID'],
         "avg_inventory": round(float(row['avg_inv']), 0),
         "total_sold": int(row['total_sold']),
         "stockouts": int(row['stockouts']),
         "avg_lead_time": round(float(row['avg_lead']), 1),
         "fill_rate": round(float(row['fill_rate']), 1)}
        for _, row in wh_stats.iterrows()
    ]

    # 6. Heatmap (SKU × Warehouse grid) — top 10 SKUs × all warehouses
    top_10_products = latest.sort_values('Units_Sold', ascending=False).head(10)['Product_ID'].tolist()
    heatmap_df = df[df['Product_ID'].isin(top_10_products)]
    heat = heatmap_df.groupby(['Product_ID', 'Warehouse_ID'])['Inventory_Level'].mean().reset_index()
    heatmap = [
        {"product_id": row['Product_ID'], "warehouse": row['Warehouse_ID'],
         "level": round(float(row['Inventory_Level']), 0)}
        for _, row in heat.iterrows()
    ]

    return {
        "inv_vs_rop": inv_vs_rop,
        "time_series": time_series,
        "stock_health": stock_health,
        "revenue": revenue,
        "warehouse": warehouse,
        "heatmap": heatmap,
    }


# ==========================================
# VISION ENGINE ENDPOINTS
# ==========================================
@app.post("/api/scan-item")
def receive_scan(item: ScanItem):
    """Receives a scanned part from engine.py and logs it."""
    global last_engine_heartbeat
    last_engine_heartbeat = time.time()

    entry = {
        "part_id": item.part_id,
        "assigned_location": item.assigned_location,
        "physical_location": item.physical_location,
        "status": item.status,
        "detected_shape": item.detected_shape,
        "timestamp": time.strftime("%H:%M:%S"),
    }
    scan_log.insert(0, entry)  # newest first

    # Keep log capped at 100 entries
    if len(scan_log) > 100:
        scan_log.pop()

    return {"status": "ok", "total_scans": len(scan_log)}

@app.get("/api/scan-log")
def get_scan_log():
    """Returns all scanned items for the frontend Vision page."""
    return {"count": len(scan_log), "data": scan_log}

@app.get("/api/engine-status")
def get_engine_status():
    """Returns whether the vision engine has posted recently."""
    now = time.time()
    is_online = (now - last_engine_heartbeat) < 10  # consider online if heartbeat within 10s
    return {
        "online": is_online,
        "total_scans": len(scan_log),
        "last_heartbeat": last_engine_heartbeat
    }

# ==========================================
# VIDEO STREAMING ENDPOINTS
# ==========================================
@app.post("/api/video-frame")
async def receive_frame(request: Request):
    """Receives a JPEG frame from engine.py."""
    global latest_frame, last_engine_heartbeat
    latest_frame = await request.body()
    last_engine_heartbeat = time.time()
    return {"status": "ok"}

@app.get("/api/video-feed")
async def video_feed():
    """Serves an MJPEG stream for the browser."""
    async def frame_generator():
        while True:
            if latest_frame:
                yield (b"--frame\r\n"
                       b"Content-Type: image/jpeg\r\n\r\n" + latest_frame + b"\r\n")
            await asyncio.sleep(0.05)  # ~20 FPS
    return StreamingResponse(frame_generator(), media_type="multipart/x-mixed-replace; boundary=frame")

# ==========================================
# ML MODEL ENDPOINTS
# ==========================================
@app.get("/api/ml/summary")
def get_ml_summary():
    """Returns model accuracy, cost comparison, and feature importance."""
    if ml_model._summary is None:
        raise HTTPException(status_code=503, detail="ML model not trained yet")
    return ml_model._summary

@app.post("/api/ml/predict-demand")
def predict_demand(req: DemandPredictRequest):
    """Predict demand for a given Product + Warehouse combo."""
    result = ml_model.predict_demand(
        product_id=req.product_id,
        warehouse_id=req.warehouse_id,
        promotion=req.promotion,
        lead_time=req.lead_time,
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@app.get("/api/ml/top-risk")
def get_top_risk(limit: int = 10):
    """Returns top N SKU+Warehouse combos most at risk of stockout."""
    return {"data": ml_model.get_risk_rankings(top_n=limit)}

@app.get("/api/ml/available-inputs")
def get_available_inputs():
    """Returns available Product_IDs and Warehouse_IDs for the frontend."""
    return ml_model.get_available_products()
