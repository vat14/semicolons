# 📦 Smart Logistics & Inventory Dashboard

A high-performance, multi-page supply chain management platform built for the **Navonmesh 24hrs Hackathon**. This dashboard provides real-time visibility into warehouse operations, fleet logistics, and inventory health, powered by Google Gemini 2.0 AI.

## 🚀 Features

### 🏢 Warehouse Operations

- **Interactive 2D Map**: Live visualization of warehouse zones with pulsing animations for scanned items.
- **Manual Scan Station**: Digital inventory intake interface with "Add/Remove" modes.
- **Live Data Table**: Real-time view of 5,000+ supply chain records fetched directly from a high-dimensional dataset.

### 🚛 Logistics & Fleet

- **Fleet Tracking Map**: Real-time position tracking of trucks using `react-leaflet`.
- **Predictive Delay Warnings**: Smart alerts for potential shipping delays based on route and driver data.
- **Dock Throughput Analytics**: Visual bottleneck tracking using `recharts` to optimize warehouse loading.

### 👁️ Vision Engine

- **Camera Stream Platform**: Placeholder for real-time OpenCV video feeds.
- **Shelf-Stock Log**: Intelligent detection log of shelf additions and removals.

### 🤖 LogisAI: Gemini Assistant

- **Google Gemini 2.0 Integration**: A floating intelligent assistant that analyzes your real dashboard data.
- **Data-Driven Insights**: Ask about stock levels, reorder priorities, or warehouse layout optimizations.
- **Context Injection**: The AI automatically reads live KPIs and inventory samples to provide precise answers.

### 🔮 ML Stockout Predictor

- **Risk Scoring**: Integrated form that predicts stockout risk using a custom algorithm based on lead times and demand forecasting.

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6.
- **Backend**: Python 3.14, FastAPI, Uvicorn.
- **AI**: Google Gemini 2.0 Flash (via `@google/generative-ai`).
- **Maps & Charts**: Leaflet (React-Leaflet), Recharts.
- **Icons**: Heroicons (Inline SVGs).

## 📥 Setup and Installation

### 1. Clone & Install Dependencies

```bash
# Install frontend packages
npm install

# Install backend packages
pip install fastapi uvicorn pymongo certifi
```

### 2. Environment Variables

Create a `.env` file in the root directory and add your Google Gemini API key:

```bash
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Run the Servers

#### **Python Backend**

```bash
cd python
python -m uvicorn main:app --reload --port 8000
```

#### **React Frontend**

```bash
npm run dev
```

The frontend will likely run on `http://localhost:5174/` and the backend on `http://localhost:8000/`.

## 📂 Project Structure

- `src/pages`: Individual page components (Home, Inventory, Vision, Logistics).
- `src/components`: Reusable UI modules (Sidebar, Chatbox, Metrics Cards).
- `src/data`: Mock data and API fetching logic.
- `python/main.py`: FastAPI server handling live CSV data and ML predictions.

---

Built with 🦾 for **Navonmesh 24hrs Hackathon**.
