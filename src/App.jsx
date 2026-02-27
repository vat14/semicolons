import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import AlertsPage from './pages/AlertsPage';
import InventoryPage from './pages/InventoryPage';
import ScanPage from './pages/ScanPage';
import AnalyticsPage from './pages/AnalyticsPage';
import VisionPage from './pages/VisionPage';
import MLInsightsPage from './pages/MLInsightsPage';
import LogisticsPage from './pages/LogisticsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/live-feed" element={<VisionPage />} />
          <Route path="/ml-insights" element={<MLInsightsPage />} />
          <Route path="/logistics" element={<LogisticsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
