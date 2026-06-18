import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import SearchOrder from './pages/SearchOrder';
import SubmitReclamation from './pages/SubmitReclamation';
import TrackReclamation from './pages/TrackReclamation';
import Dashboard from './pages/Dashboard';
import ServiceDashboard from './pages/ServiceDashboard';
import EspaceClient from './pages/EspaceClient';
import LoginAgent from './pages/LoginAgent';
import LoginClient from './pages/LoginClient';
import RegisterClient from './pages/RegisterClient';
import MesReclamations from './pages/MesReclamations';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          {/* Landing gateway */}
          <Route path="/" element={<HomePage />} />

          {/* Auth */}
          <Route path="/login/agent" element={<LoginAgent />} />
          <Route path="/login/client" element={<LoginClient />} />
          <Route path="/register" element={<RegisterClient />} />

          {/* Interface client (protégée) */}
          <Route path="/espace-client" element={
            <ProtectedRoute type="client"><EspaceClient /></ProtectedRoute>
          } />
          <Route path="/mes-reclamations" element={
            <ProtectedRoute type="client"><MesReclamations /></ProtectedRoute>
          } />
          <Route path="/rechercher" element={
            <ProtectedRoute type="client"><SearchOrder /></ProtectedRoute>
          } />
          <Route path="/soumettre" element={
            <ProtectedRoute type="client"><SubmitReclamation /></ProtectedRoute>
          } />
          <Route path="/suivi" element={
            <ProtectedRoute type="client"><TrackReclamation /></ProtectedRoute>
          } />

          {/* Interface agent (protégée) */}
          <Route path="/dashboard" element={
            <ProtectedRoute type="agent"><Dashboard /></ProtectedRoute>
          } />
          <Route path="/service/:nomService" element={
            <ProtectedRoute type="agent"><ServiceDashboard /></ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
