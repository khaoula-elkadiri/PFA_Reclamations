import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import SearchOrder from './pages/SearchOrder';
import SubmitReclamation from './pages/SubmitReclamation';
import TrackReclamation from './pages/TrackReclamation';
import Dashboard from './pages/Dashboard';
import ServiceDashboard from './pages/ServiceDashboard';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/rechercher" element={<SearchOrder />} />
        <Route path="/soumettre" element={<SubmitReclamation />} />
        <Route path="/suivi" element={<TrackReclamation />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/service/:nomService" element={<ServiceDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;