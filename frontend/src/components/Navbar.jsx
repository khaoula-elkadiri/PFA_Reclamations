import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, Package, User, LogOut, FileText, UserCheck, TrendingUp, LayoutDashboard, Users, Brain, ShoppingBag, BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { agentUser, clientUser, isAgentLoggedIn, isClientLoggedIn, isAdminLoggedIn, logoutAgent, logoutClient } = useAuth();
  const navigate = useNavigate();

  const handleLogoutAgent = () => {
    logoutAgent();
    navigate('/');
  };

  const handleLogoutClient = () => {
    logoutClient();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <Package size={28} />
        <h1>Réclamations Logistiques</h1>
      </Link>

      <div className="navbar-links">
        {isAdminLoggedIn() && (
          <>
            <Link to="/admin/dashboard">
              <LayoutDashboard size={18} /> Dashboard
            </Link>
            <Link to="/admin/agents">
              <Users size={18} /> Agents
            </Link>
            <Link to="/admin/ia">
              <Brain size={18} /> Monitoring IA
            </Link>
            <Link to="/admin/clients">
              <ShoppingBag size={18} /> Clients
            </Link>
            <span className="navbar-user">
              <User size={16} />
              {agentUser?.prenom} {agentUser?.nom}
              <span className="navbar-role">Admin</span>
            </span>
            <button className="navbar-logout" onClick={handleLogoutAgent} title="Se déconnecter">
              <LogOut size={16} /> Déconnexion
            </button>
          </>
        )}

        {isAgentLoggedIn() && (
          <>
            <Link to="/agent">
              <UserCheck size={18} /> Mes réclamations
            </Link>

            <Link to="/analytics">
              <TrendingUp size={18} /> Analytiques
            </Link>

            <span className="navbar-user">
              <User size={16} />
              {agentUser?.prenom} {agentUser?.nom}
              <span className="navbar-role">{agentUser?.role}</span>
            </span>

            <button className="navbar-logout" onClick={handleLogoutAgent} title="Se déconnecter">
              <LogOut size={16} /> Déconnexion
            </button>
          </>
        )}

        {isClientLoggedIn() && (
          <>
            <Link to="/mes-commandes">
              <Search size={18} /> Mes commandes
            </Link>

            <Link to="/suivi">
              <Bell size={18} /> Suivi
            </Link>

            <Link to="/mes-reclamations">
              <FileText size={18} /> Mes réclamations
            </Link>

            <span className="navbar-user">
              <User size={16} />
              {clientUser?.prenom} {clientUser?.nom}
            </span>

            <button className="navbar-logout" onClick={handleLogoutClient} title="Se déconnecter">
              <LogOut size={16} /> Déconnexion
            </button>
          </>
        )}

        {!isAgentLoggedIn() && !isClientLoggedIn() && (
          <>
            <Link to="/login/client" className="navbar-link-auth">
              <User size={18} /> Espace Client
            </Link>

            <Link to="/login/agent" className="navbar-link-auth navbar-link-agent">
              <BarChart3 size={18} /> Espace Agent
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}