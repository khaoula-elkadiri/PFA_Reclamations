import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Package, BarChart3, User } from 'lucide-react';

export default function HomePage() {
  const { agentToken, clientToken, agentUser, clientUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (agentToken && agentUser) {
      navigate(`/service/${agentUser.service}`, { replace: true });
    } else if (clientToken && clientUser) {
      navigate('/espace-client', { replace: true });
    }
  }, [agentUser, clientUser, agentToken, clientToken, navigate]);

  // Tokens present but user not loaded yet → attendre
  if ((agentToken && !agentUser) || (clientToken && !clientUser)) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <p style={{ color: '#6b7280', fontSize: '16px' }}>Connexion en cours...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <Package size={56} color="#667eea" />
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', marginBottom: '12px' }}>
          Système de Gestion des Réclamations
        </h1>
        <p style={{ color: '#6b7280', fontSize: '16px', maxWidth: '480px' }}>
          Bienvenue. Sélectionnez votre espace pour continuer.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', maxWidth: '600px', width: '100%' }}>
        <Link to="/login/client" style={{ textDecoration: 'none' }}>
          <div className="gateway-card gateway-client">
            <div className="gateway-icon">
              <User size={40} />
            </div>
            <h2>Espace Client</h2>
            <p>Déposez et suivez vos réclamations</p>
            <span className="gateway-arrow">Accéder →</span>
          </div>
        </Link>

        <Link to="/login/agent" style={{ textDecoration: 'none' }}>
          <div className="gateway-card gateway-agent">
            <div className="gateway-icon">
              <BarChart3 size={40} />
            </div>
            <h2>Espace Agent</h2>
            <p>Gérez et traitez les réclamations</p>
            <span className="gateway-arrow">Accéder →</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
