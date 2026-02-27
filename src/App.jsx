import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import InventoryPage from './pages/InventoryPage';
import VisionPage from './pages/VisionPage';
import LogisticsPage from './pages/LogisticsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/vision" element={<VisionPage />} />
          <Route path="/logistics" element={<LogisticsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
