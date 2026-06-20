import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, Bell, FileText } from 'lucide-react';
import api from '../services/api';

export default function EspaceClient() {
  const { clientUser } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!clientUser?.id) return;
    const token = localStorage.getItem('client_token');
    api.get(`/notifications/client/${clientUser.id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => setNotifications(r.data.slice(0, 5)))
      .catch(() => {});
  }, [clientUser?.id]);

  return (
    <div className="container" style={{ paddingTop: '40px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1f2937' }}>
          Bonjour, {clientUser?.prenom} {clientUser?.nom} 👋
        </h1>
        <p style={{ color: '#6b7280', marginTop: '6px' }}>
          Que souhaitez-vous faire ?
        </p>
      </div>

      <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: 36 }}>
        <Link to="/mes-commandes" className="card card-primary" style={{ textDecoration: 'none' }}>
          <ShoppingBag size={44} />
          <h2>Mes Commandes</h2>
          <p>Consultez vos commandes et déposez une réclamation sur l'une d'elles</p>
          <span className="card-arrow">→</span>
        </Link>

        <Link to="/suivi" className="card" style={{ textDecoration: 'none' }}>
          <Bell size={44} />
          <h2>Suivre une réclamation</h2>
          <p>Consultez l'état d'avancement par numéro de dossier</p>
          <span className="card-arrow">→</span>
        </Link>

        <Link to="/mes-reclamations" className="card" style={{ textDecoration: 'none', borderLeft: '4px solid #667eea' }}>
          <FileText size={44} />
          <h2>Mes réclamations</h2>
          <p>Consultez toutes vos réclamations et les réponses des agents</p>
          <span className="card-arrow">→</span>
        </Link>
      </div>

      {/* Notifications récentes */}
      {notifications.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Bell size={18} color="#667eea" />
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#1f2937' }}>Notifications récentes</h3>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {notifications.map(n => (
              <li key={n.id_notification} style={{
                padding: '10px 0', borderBottom: '1px solid #f3f4f6',
                display: 'flex', gap: 12, alignItems: 'flex-start',
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', marginTop: 6, flexShrink: 0,
                  background: n.type_notification === 'resolution' ? '#48bb78' : '#667eea',
                }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, color: '#374151' }}>{n.message}</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                    {new Date(n.date_envoi).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
