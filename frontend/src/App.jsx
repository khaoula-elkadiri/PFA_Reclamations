import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import SearchOrder from './pages/SearchOrder';
import SubmitReclamation from './pages/SubmitReclamation';
import TrackReclamation from './pages/TrackReclamation';
import AgentReclamations from './pages/AgentReclamations';
import Analytics from './pages/Analytics';
import MesCommandes from './pages/MesCommandes';
import AdminDashboard from './pages/AdminDashboard';
import AdminAgents from './pages/AdminAgents';
import AdminMonitoringIA from './pages/AdminMonitoringIA';
import AdminClients from './pages/AdminClients';

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
          <Route path="/" element={<HomePage />} />

          <Route path="/login/agent" element={<LoginAgent />} />
          <Route path="/login/client" element={<LoginClient />} />
          <Route path="/register" element={<RegisterClient />} />

          <Route
            path="/espace-client"
            element={
              <ProtectedRoute type="client">
                <EspaceClient />
              </ProtectedRoute>
            }
          />

          <Route
            path="/mes-reclamations"
            element={
              <ProtectedRoute type="client">
                <MesReclamations />
              </ProtectedRoute>
            }
          />

          <Route
            path="/mes-commandes"
            element={
              <ProtectedRoute type="client">
                <MesCommandes />
              </ProtectedRoute>
            }
          />

          <Route
            path="/rechercher"
            element={
              <ProtectedRoute type="client">
                <SearchOrder />
              </ProtectedRoute>
            }
          />

          <Route
            path="/soumettre"
            element={
              <ProtectedRoute type="client">
                <SubmitReclamation />
              </ProtectedRoute>
            }
          />

          <Route
            path="/suivi"
            element={
              <ProtectedRoute type="client">
                <TrackReclamation />
              </ProtectedRoute>
            }
          />

          <Route
            path="/agent"
            element={
              <ProtectedRoute type="agent">
                <AgentReclamations />
              </ProtectedRoute>
            }
          />

          <Route
            path="/analytics"
            element={
              <ProtectedRoute type="agent">
                <Analytics />
              </ProtectedRoute>
            }
          />

          {/* Routes administrateur */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute type="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/agents"
            element={
              <ProtectedRoute type="admin">
                <AdminAgents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/ia"
            element={
              <ProtectedRoute type="admin">
                <AdminMonitoringIA />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/clients"
            element={
              <ProtectedRoute type="admin">
                <AdminClients />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;