# 📦 Smart Logistics & Inventory Dashboard

A high-performance, multi-page supply chain management platform built for the **Navonmesh 24hrs Hackathon**. This dashboard provides real-time visibility into warehouse operations, fleet logistics, and inventory health, powered by computer vision and machine learning.

![Dashboard Preview](public/vite.svg)

## 🚀 Key Features

### 🏢 Warehouse Operations

- **Interactive 2D Map**: Live visualization of warehouse zones using `react-leaflet` with pulsing alerts.
- **3D Digital Twin**: Integrated 3D visualization of the warehouse using Three.js, automatically simulating box movements when inventory is scanned.
- **Master Data Logs**: View, filter, and search through 10,000+ supply chain records effortlessly with instantaneous frontend filtering.
- **Advanced Analytics**: Real-time warehouse performance metrics, historical revenue comparisons, and dynamic color-coded heatmaps representing product demand.

### 👁️ Unified Vision Engine (OpenCV + PyZbar)

- **Live Video Streaming**: Real-time MJPEG camera stream bridging the physical and digital warehouse directly to the browser.
- **Virtual Barcode Scanner**: Advanced motion-triggered automated scanning system that synchronizes reads with video feeds and logs them directly to the frontend.
- **Shelf-Stock Log**: Intelligent detection log tracking physical locations ("Scan In", "Scan Out", "Return") of physical inventory.

### 🔮 ML Stockout Predictor

- **Risk Scoring Engine**: Custom trained machine learning model utilizing Pandas and Scikit-learn to forecast stockout risks based on historical lead times and shifting demand trends.
- **Automated Alerts**: Generates intelligent dashboard alerts highlighting critical low-stock items based on dynamically calculated reorder points.

### 🚛 Logistics

- **Fleet Tracking Map**: Real-time position tracking of trucks globally.
- **Predictive Delay Warnings**: Smart alerts for potential shipping delays based on route data.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, React-Leaflet, Recharts.
- **Backend**: Python 3.10+, FastAPI, Uvicorn, Pandas, OpenCV, PyZbar.
- **Deployment**: Vercel (Frontend SPA) + Render (Python API).

---

## 📂 Project Structure

```text
semicolons/
├── src/
│   ├── pages/         # React Views (Home, Inventory, Analytics, Vision, etc.)
│   ├── components/    # Reusable UI Modules (Sidebar, Charts, Maps)
│   └── data/          # API fetchers (api.js) connecting to FastAPI
├── public/
│   └── 3d/            # Three.js Digital Twin Engine
├── python/
│   ├── main.py        # FastAPI Backend Core
│   ├── engine.py      # OpenCV Vision & Barcode Engine
│   ├── ml_model.py    # Predictive Analytics Model
│   └── demo_scan.mp4  # Source Video for Vision Engine
└── vercel.json        # SPA Routing Config for Cloud Deployment
```

---

## 📥 Setup and Installation

### 1. Clone & Install Dependencies

```bash
# Install frontend packages
npm install

# Install backend packages
cd python
pip install -r requirements.txt
```

### 2. Run the Servers

**Python Backend** (Terminal 1)

```bash
cd python
python -m uvicorn main:app --reload --port 8000
```

**Vision Engine** (Terminal 2)

```bash
cd python
python engine.py
```

**React Frontend** (Terminal 3)

```bash
npm run dev
```

The frontend runs on `http://localhost:5173/` and the backend on `http://localhost:8000/`.

---

## ☁️ Cloud Deployment

- **Frontend:** Deployed to Vercel via GitHub continuous integration. Ensure the `VITE_API_BASE` environment variable is mapped to your backend URL.
- **Backend:** Deployed to Render. Make sure the Root Directory is set to `python/` and the Start Command is `uvicorn main:app --host 0.0.0.0 --port $PORT`.

---

Built with 🦾 for the **Navonmesh 24hrs Hackathon**.
