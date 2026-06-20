import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Package, BarChart3, User, Brain, Zap, Shield } from 'lucide-react';

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
        <p style={{ color: '#6b7280', fontSize: '15px', maxWidth: '520px', lineHeight: 1.6 }}>
          Système intelligent basé sur le <strong>Machine Learning</strong> pour la classification automatique
          et le routing des réclamations logistiques.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#667eea', fontSize: 13 }}>
            <Brain size={16} /> Classification IA automatique
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#764ba2', fontSize: 13 }}>
            <Zap size={16} /> Routing intelligent par service
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#48bb78', fontSize: 13 }}>
            <Shield size={16} /> Détection des cas complexes
          </div>
        </div>
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