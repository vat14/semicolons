from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random
import csv
import os

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

_data_cache = []

def load_data():
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
# UPDATED ML FEATURES (Matches new dataset)
# ==========================================
class SupplyChainFeatures(BaseModel):
    inventory_levels: int
    supplier_lead_times: int
    units_sold: int
    forecasted_demand: int

@app.get("/api/inventory")
def get_inventory_status(limit: int = 50):
    try:
        data = load_data()[:limit]
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
        avg_inv = round(sum(inv_levels) / len(inv_levels), 2) if inv_levels else 0

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
    # Simple logic: If demand outpaces inventory + lead time is high = High Risk
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
            "confidence_score": round(random.uniform(0.75, 0.98), 2),
            "suggested_action": action
        }
    }