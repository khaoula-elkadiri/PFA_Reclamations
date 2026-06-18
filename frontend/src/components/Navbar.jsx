import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, BarChart3, Package, User, LogOut, FileText, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { agentUser, clientUser, isAgentLoggedIn, isClientLoggedIn, logoutAgent, logoutClient } = useAuth();
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
        {isAgentLoggedIn() && (
          <>
            <Link to="/agent">
              <UserCheck size={18} /> Agent
            </Link>

            <Link to={`/service/${agentUser?.service}`}>
              <BarChart3 size={18} /> {agentUser?.service}
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
            <Link to="/rechercher">
              <Search size={18} /> Nouvelle réclamation
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