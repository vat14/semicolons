"""
ml_model.py — Demand Forecasting & Dynamic Reorder Point Optimization
Refactored from set2.py for use as a FastAPI-importable module.
"""

import pandas as pd  # type: ignore
import numpy as np  # type: ignore
from sklearn.preprocessing import LabelEncoder  # type: ignore
from sklearn.ensemble import RandomForestRegressor  # type: ignore
from sklearn.metrics import mean_absolute_error, r2_score  # type: ignore
import os

# ==========================================
# GLOBAL STATE (populated by train_model)
# ==========================================
_model = None
_le_sku = None
_le_wh = None
_df = None
_summary = None
_features = [
    'SKU_Encoded', 'WH_Encoded', 'Month', 'DayOfWeek',
    'Rolling_7_Demand', 'Demand_Std_7',
    'Promotion_Flag', 'Supplier_Lead_Time_Days'
]

CSV_PATH = os.path.join(os.path.dirname(__file__), "inventory_analysis.csv")


def train_model(best_k: float = 1.0):
    """
    Loads inventory_analysis.csv, engineers features, trains a RandomForest,
    computes static vs dynamic reorder point comparison, and stores everything
    in module-level globals for the API to use.
    """
    global _model, _le_sku, _le_wh, _df, _summary

    # 1. Load
    df = pd.read_csv(CSV_PATH)
    df['Date'] = pd.to_datetime(df['Date'])
    df = df.sort_values(['SKU_ID', 'Warehouse_ID', 'Date'])

    # 2. Feature Engineering
    df['Month'] = df['Date'].dt.month
    df['DayOfWeek'] = df['Date'].dt.weekday
    df['Week'] = df['Date'].dt.isocalendar().week.astype(int)

    df['Rolling_7_Demand'] = (
        df.groupby(['SKU_ID', 'Warehouse_ID'])['Units_Sold']
          .transform(lambda x: x.rolling(7, min_periods=1).mean())
    )
    df['Demand_Std_7'] = (
        df.groupby(['SKU_ID', 'Warehouse_ID'])['Units_Sold']
          .transform(lambda x: x.rolling(7, min_periods=1).std())
    )
    df['Demand_Std_7'] = df['Demand_Std_7'].fillna(0)

    # 3. Encoding
    _le_sku = LabelEncoder()
    _le_wh = LabelEncoder()
    df['SKU_Encoded'] = _le_sku.fit_transform(df['SKU_ID'])
    df['WH_Encoded'] = _le_wh.fit_transform(df['Warehouse_ID'])

    # 4. Train/Test Split (time-series aware)
    split_date = df['Date'].quantile(0.8)
    train = df[df['Date'] <= split_date]
    test = df[df['Date'] > split_date]

    X_train = train[_features]
    y_train = train['Units_Sold']
    X_test = test[_features]
    y_test = test['Units_Sold']

    # 5. Train
    _model = RandomForestRegressor(n_estimators=150, random_state=42, n_jobs=-1)
    _model.fit(X_train, y_train)

    pred = _model.predict(X_test)
    mae = mean_absolute_error(y_test, pred)
    r2 = r2_score(y_test, pred)

    # 6. Dynamic Reorder Point Analysis
    df['Dynamic_ROP'] = df['Reorder_Point'] + best_k * df['Demand_Std_7']

    df['Static_Understock'] = df['Inventory_Level'] < df['Reorder_Point']
    df['Dynamic_Understock'] = df['Inventory_Level'] < df['Dynamic_ROP']

    holding_cost_rate = 0.02
    stockout_penalty = 10

    df['Static_Overstock_Cost'] = np.where(
        df['Inventory_Level'] > df['Reorder_Point'],
        (df['Inventory_Level'] - df['Reorder_Point']) * df['Unit_Cost'] * holding_cost_rate,
        0
    )
    df['Dynamic_Overstock_Cost'] = np.where(
        df['Inventory_Level'] > df['Dynamic_ROP'],
        (df['Inventory_Level'] - df['Dynamic_ROP']) * df['Unit_Cost'] * holding_cost_rate,
        0
    )
    df['Static_Stockout_Cost'] = np.where(
        df['Inventory_Level'] < df['Reorder_Point'],
        (df['Reorder_Point'] - df['Inventory_Level']) * stockout_penalty,
        0
    )
    df['Dynamic_Stockout_Cost'] = np.where(
        df['Inventory_Level'] < df['Dynamic_ROP'],
        (df['Dynamic_ROP'] - df['Inventory_Level']) * stockout_penalty,
        0
    )

    static_total = df['Static_Overstock_Cost'].sum() + df['Static_Stockout_Cost'].sum()
    dynamic_total = df['Dynamic_Overstock_Cost'].sum() + df['Dynamic_Stockout_Cost'].sum()

    # 7. Feature Importance
    importances = dict(zip(_features, [round(float(x), 4) for x in _model.feature_importances_]))

    # 8. Store
    _df = df
    _summary = {
        "mae": round(float(mae), 2),
        "r2": round(float(r2), 4),
        "static_understock": int(df['Static_Understock'].sum()),
        "dynamic_understock": int(df['Dynamic_Understock'].sum()),
        "understock_reduction": int(df['Static_Understock'].sum() - df['Dynamic_Understock'].sum()),
        "static_total_cost": round(float(static_total), 2),
        "dynamic_total_cost": round(float(dynamic_total), 2),
        "cost_savings": round(float(static_total - dynamic_total), 2),
        "volatility_factor_k": best_k,
        "feature_importance": importances,
        "total_records": len(df),
    }

    print(f"✅ ML Model trained | MAE: {mae:.2f} | R²: {r2:.4f} | Records: {len(df)}")
    return _summary


def predict_demand(sku_id: str, warehouse_id: str, promotion: int = 0, lead_time: int = 14):
    """
    Predict demand for a given SKU + Warehouse combo using the trained model.
    Returns predicted demand, dynamic reorder point, and risk assessment.
    """
    if _model is None or _le_sku is None or _le_wh is None or _df is None:
        return {"error": "Model not trained yet. Call train_model() first."}

    # Encode inputs (handle unseen SKU/WH gracefully)
    try:
        sku_enc = _le_sku.transform([sku_id])[0]
    except ValueError:
        return {"error": f"Unknown SKU_ID: {sku_id}. Available: {list(_le_sku.classes_[:10])}..."}

    try:
        wh_enc = _le_wh.transform([warehouse_id])[0]
    except ValueError:
        return {"error": f"Unknown Warehouse_ID: {warehouse_id}. Available: {list(_le_wh.classes_)}"}

    # Get latest stats for this SKU+WH pair
    subset = _df[(_df['SKU_ID'] == sku_id) & (_df['Warehouse_ID'] == warehouse_id)]

    if subset.empty:
        rolling_demand = 0.0
        demand_std = 0.0
    else:
        latest = subset.iloc[-1]
        rolling_demand = float(latest.get('Rolling_7_Demand', 0))
        demand_std = float(latest.get('Demand_Std_7', 0))

    # Build feature vector
    import datetime
    now = datetime.datetime.now()
    feature_vector = pd.DataFrame([{
        'SKU_Encoded': sku_enc,
        'WH_Encoded': wh_enc,
        'Month': now.month,
        'DayOfWeek': now.weekday(),
        'Rolling_7_Demand': rolling_demand,
        'Demand_Std_7': demand_std,
        'Promotion_Flag': promotion,
        'Supplier_Lead_Time_Days': lead_time,
    }])

    predicted_demand = float(_model.predict(feature_vector)[0])
    dynamic_rop = rolling_demand * lead_time + 1.0 * demand_std

    # Risk classification
    if not subset.empty:
        current_inv = float(subset.iloc[-1]['Inventory_Level'])
    else:
        current_inv = 0

    if current_inv < dynamic_rop:
        risk = "HIGH"
        action = "Initiate Emergency Reorder"
    elif current_inv < dynamic_rop * 1.2:
        risk = "MODERATE"
        action = "Monitor Closely, Schedule Reorder"
    else:
        risk = "LOW"
        action = "No Action Needed"

    return {
        "sku_id": sku_id,
        "warehouse_id": warehouse_id,
        "predicted_daily_demand": round(predicted_demand, 2),
        "dynamic_reorder_point": round(dynamic_rop, 2),
        "current_inventory": round(current_inv, 2),
        "risk_level": risk,
        "suggested_action": action,
    }


def get_risk_rankings(top_n: int = 10):
    """
    Returns the top N SKU+Warehouse combinations most at risk of stockout,
    ranked by (Dynamic_ROP - Inventory_Level).
    """
    if _df is None:
        return []

    # Get the latest row per SKU+Warehouse
    latest = _df.sort_values('Date').groupby(['SKU_ID', 'Warehouse_ID']).last().reset_index()

    latest['Risk_Gap'] = latest['Dynamic_ROP'] - latest['Inventory_Level']
    at_risk = latest[latest['Risk_Gap'] > 0].sort_values('Risk_Gap', ascending=False)

    results = []
    for _, row in at_risk.head(top_n).iterrows():
        results.append({
            "sku_id": row['SKU_ID'],
            "warehouse_id": row['Warehouse_ID'],
            "inventory_level": round(float(row['Inventory_Level']), 2),
            "dynamic_rop": round(float(row['Dynamic_ROP']), 2),
            "risk_gap": round(float(row['Risk_Gap']), 2),
            "unit_cost": round(float(row.get('Unit_Cost', 0)), 2),
        })

    return results


def get_available_skus():
    """Returns lists of available SKU_IDs and Warehouse_IDs for the frontend dropdown."""
    if _le_sku is None or _le_wh is None:
        return {"skus": [], "warehouses": []}
    return {
        "skus": list(_le_sku.classes_),
        "warehouses": list(_le_wh.classes_),
    }


def get_selling_insights():
    """
    Analyzes the dataset to identify fast-selling and slow-selling SKUs
    with actionable recommendations.
    """
    if _df is None:
        return {"fast_movers": [], "slow_movers": []}

    # Aggregate by SKU across all warehouses and dates
    sku_stats = _df.groupby('SKU_ID').agg(
        total_sold=('Units_Sold', 'sum'),
        avg_daily_sold=('Units_Sold', 'mean'),
        latest_inventory=('Inventory_Level', 'last'),
        avg_inventory=('Inventory_Level', 'mean'),
        reorder_point=('Reorder_Point', 'mean'),
        unit_cost=('Unit_Cost', 'mean'),
        stockout_count=('Stockout_Flag', 'sum'),
    ).reset_index()

    # Fast movers: high sales, potentially low inventory
    fast = sku_stats.sort_values('total_sold', ascending=False).head(5)
    fast_movers = []
    for _, row in fast.iterrows():
        days_of_stock = int(row['latest_inventory'] / max(row['avg_daily_sold'], 0.1))  # type: ignore
        fast_movers.append({
            "sku_id": row['SKU_ID'],
            "total_sold": int(row['total_sold']),
            "avg_daily_demand": round(float(row['avg_daily_sold']), 1),  # type: ignore
            "current_stock": int(row['latest_inventory']),
            "days_of_stock_left": days_of_stock,
            "stockout_events": int(row['stockout_count']),
            "recommendation": f"🔴 High demand ({round(float(row['avg_daily_sold']), 1)} units/day). "  # type: ignore
                            + (f"Only {days_of_stock} days of stock left — reorder urgently!"
                               if days_of_stock < 14
                               else f"{days_of_stock} days of stock. Schedule next reorder within {max(1, days_of_stock - 7)} days."),
        })

    # Slow movers: low sales, high inventory
    slow = sku_stats.sort_values('total_sold', ascending=True).head(5)
    slow_movers = []
    for _, row in slow.iterrows():
        overstock_ratio = round(float(row['avg_inventory'] / max(row['avg_daily_sold'], 0.1)), 0)  # type: ignore
        slow_movers.append({
            "sku_id": row['SKU_ID'],
            "total_sold": int(row['total_sold']),
            "avg_daily_demand": round(float(row['avg_daily_sold']), 1),  # type: ignore
            "current_stock": int(row['latest_inventory']),
            "overstock_ratio": overstock_ratio,
            "unit_cost": round(float(row['unit_cost']), 2),  # type: ignore
            "recommendation": f"🟡 Low demand ({round(float(row['avg_daily_sold']), 1)} units/day) "  # type: ignore
                            + f"with {overstock_ratio}× daily stock. "
                            + "Run a promotion or bundle deal to clear inventory and free capital.",
        })

    return {"fast_movers": fast_movers, "slow_movers": slow_movers}
