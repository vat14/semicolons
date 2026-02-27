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
CSV_PATH = os.path.join(os.path.dirname(__file__), "supply_chain_dataset1.csv")

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