import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
import matplotlib.pyplot as plt

# ==============================
# 1️⃣ LOAD DATA
# ==============================

df = pd.read_csv(r"N:\Navonmesh\inventory_analysis.csv")

# ==============================
# 2️⃣ BASIC PREPROCESSING
# ==============================

df['Date'] = pd.to_datetime(df['Date'])
df = df.sort_values(['SKU_ID','Warehouse_ID','Date'])

# ==============================
# 3️⃣ FEATURE ENGINEERING
# ==============================

df['Month'] = df['Date'].dt.month
df['DayOfWeek'] = df['Date'].dt.weekday
df['Week'] = df['Date'].dt.isocalendar().week.astype(int)

# Rolling demand (7-day)
df['Rolling_7_Demand'] = (
    df.groupby(['SKU_ID','Warehouse_ID'])['Units_Sold']
      .transform(lambda x: x.rolling(7, min_periods=1).mean())
)

# Rolling std deviation
df['Demand_Std_7'] = (
    df.groupby(['SKU_ID','Warehouse_ID'])['Units_Sold']
      .transform(lambda x: x.rolling(7, min_periods=1).std())
)

df['Demand_Std_7'] = df['Demand_Std_7'].fillna(0)

# ==============================
# 4️⃣ ENCODING
# ==============================

le_sku = LabelEncoder()
le_wh = LabelEncoder()

df['SKU_Encoded'] = le_sku.fit_transform(df['SKU_ID'])
df['WH_Encoded'] = le_wh.fit_transform(df['Warehouse_ID'])

# ==============================
# 5️⃣ DEFINE FEATURES
# ==============================

features = [
    'SKU_Encoded',
    'WH_Encoded',
    'Month',
    'DayOfWeek',
    'Rolling_7_Demand',
    'Demand_Std_7',
    'Promotion_Flag',
    'Supplier_Lead_Time_Days'
]

X = df[features]
y = df['Units_Sold']

# ==============================
# 6️⃣ TIME-SERIES SPLIT
# ==============================

split_date = df['Date'].quantile(0.8)

train = df[df['Date'] <= split_date]
test = df[df['Date'] > split_date]

X_train = train[features]
y_train = train['Units_Sold']

X_test = test[features]
y_test = test['Units_Sold']

# ==============================
# 7️⃣ TRAIN MODEL
# ==============================

model = RandomForestRegressor(
    n_estimators=150,
    random_state=42,
    n_jobs=-1
)

model.fit(X_train, y_train)

pred = model.predict(X_test)

mae = mean_absolute_error(y_test, pred)
r2 = r2_score(y_test, pred)

# ==============================
# 8️⃣ ADAPTIVE INVENTORY OPTIMIZATION
# ==============================

# Try multiple volatility adjustment factors
print("\n===== SERVICE TUNING =====")

for k in [0.5, 1.0, 1.5]:

    df['Dynamic_ROP'] = (
        df['Reorder_Point'] +
        k * df['Demand_Std_7']
    )

    dynamic_under = (df['Inventory_Level'] < df['Dynamic_ROP']).sum()

    dynamic_cost = np.where(
        df['Inventory_Level'] > df['Dynamic_ROP'],
        (df['Inventory_Level'] - df['Dynamic_ROP']) *
        df['Unit_Cost'] * 0.02,
        0
    ).sum()

    print(f"\nVolatility Factor k = {k}")
    print("Understock Count:", dynamic_under)
    print("Holding Cost:", round(dynamic_cost,2))

# ==============================
# 9️⃣ FINAL SELECTED k
# ==============================

best_k = 1.0   # 👈 Adjust after checking output

df['Dynamic_ROP'] = (
    df['Reorder_Point'] +
    best_k * df['Demand_Std_7']
)

df['Static_Understock'] = df['Inventory_Level'] < df['Reorder_Point']
df['Dynamic_Understock'] = df['Inventory_Level'] < df['Dynamic_ROP']

holding_cost_rate = 0.02

df['Static_Overstock_Cost'] = np.where(
    df['Inventory_Level'] > df['Reorder_Point'],
    (df['Inventory_Level'] - df['Reorder_Point']) *
    df['Unit_Cost'] * holding_cost_rate,
    0
)

df['Dynamic_Overstock_Cost'] = np.where(
    df['Inventory_Level'] > df['Dynamic_ROP'],
    (df['Inventory_Level'] - df['Dynamic_ROP']) *
    df['Unit_Cost'] * holding_cost_rate,
    0
)

static_under = df['Static_Understock'].sum()
dynamic_under = df['Dynamic_Understock'].sum()

static_cost = df['Static_Overstock_Cost'].sum()
dynamic_cost = df['Dynamic_Overstock_Cost'].sum()

# ==============================
# 🔟 FINAL SUMMARY
# ==============================

print("\n===== FINAL SUMMARY =====")
print(f"MAE: {round(mae,2)}")
print(f"R2: {round(r2,4)}")
print(f"Static Understock: {static_under}")
print(f"Dynamic Understock: {dynamic_under}")
print(f"Understock Change: {static_under - dynamic_under}")
print(f"Static Holding Cost: {round(static_cost,2)}")
print(f"Dynamic Holding Cost: {round(dynamic_cost,2)}")
print(f"Holding Cost Change: {round(static_cost - dynamic_cost,2)}")

# ==============================
# 1️⃣1️⃣ FEATURE IMPORTANCE
# ==============================

importances = model.feature_importances_

plt.figure(figsize=(8,5))
plt.barh(features, importances)
plt.title("Feature Importance")
plt.show()

stockout_penalty_per_unit = 5  # assume penalty per unit lost

df['Stockout_Cost'] = np.where(
    df['Inventory_Level'] < df['Dynamic_ROP'],
    (df['Dynamic_ROP'] - df['Inventory_Level']) *
    stockout_penalty_per_unit,
    0
)

total_stockout_cost = df['Stockout_Cost'].sum()
print("Static Holding Cost:", round(static_cost,2))
print("Dynamic Holding Cost:", round(dynamic_cost,2))
stockout_penalty_per_unit = 10  # assume penalty per unit

df['Static_Stockout_Cost'] = np.where(
    df['Inventory_Level'] < df['Reorder_Point'],
    (df['Reorder_Point'] - df['Inventory_Level']) *
    stockout_penalty_per_unit,
    0
)

df['Dynamic_Stockout_Cost'] = np.where(
    df['Inventory_Level'] < df['Dynamic_ROP'],
    (df['Dynamic_ROP'] - df['Inventory_Level']) *
    stockout_penalty_per_unit,
    0
)

static_total_cost = df['Static_Overstock_Cost'].sum() + df['Static_Stockout_Cost'].sum()
dynamic_total_cost = df['Dynamic_Overstock_Cost'].sum() + df['Dynamic_Stockout_Cost'].sum()

print("\n===== TOTAL COST COMPARISON =====")
print("Static Total Cost:", round(static_total_cost,2))
print("Dynamic Total Cost:", round(dynamic_total_cost,2))
print("Total Cost Change:", round(static_total_cost - dynamic_total_cost,2))
stockout_penalty_per_unit = 10   # tune if needed

print("\n===== TOTAL COST ANALYSIS =====")

for k in [0.5, 1.0, 1.5]:

    df['Dynamic_ROP'] = (
        df['Reorder_Point'] +
        k * df['Demand_Std_7']
    )

    holding_cost = np.where(
        df['Inventory_Level'] > df['Dynamic_ROP'],
        (df['Inventory_Level'] - df['Dynamic_ROP']) *
        df['Unit_Cost'] * 0.02,
        0
    ).sum()

    stockout_cost = np.where(
        df['Inventory_Level'] < df['Dynamic_ROP'],
        (df['Dynamic_ROP'] - df['Inventory_Level']) *
        stockout_penalty_per_unit,
        0
    ).sum()

    total_cost = holding_cost + stockout_cost

    print(f"\nVolatility Factor k = {k}")
    print("Holding Cost:", round(holding_cost,2))
    print("Stockout Cost:", round(stockout_cost,2))
    print("Total Cost:", round(total_cost,2))