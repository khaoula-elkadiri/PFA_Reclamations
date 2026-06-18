import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { clientService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const STATUT_LABELS = {
  en_attente: 'En attente',
  en_analyse: 'En analyse',
  affectee: 'Affectée',
  en_traitement: 'En traitement',
  resolue: 'Résolue',
  fermee: 'Fermée',
};

const STATUT_ICONS = {
  en_attente: <Clock size={14} color="#f59e0b" />,
  en_analyse: <Clock size={14} color="#3b82f6" />,
  affectee: <Clock size={14} color="#8b5cf6" />,
  en_traitement: <AlertCircle size={14} color="#f59e0b" />,
  resolue: <CheckCircle size={14} color="#22c55e" />,
  fermee: <CheckCircle size={14} color="#6b7280" />,
};

const PRIORITE_COLORS = {
  critique: '#ef4444',
  elevee: '#f59e0b',
  moyenne: '#3b82f6',
  faible: '#22c55e',
};

export default function MesReclamations() {
  const { clientUser } = useAuth();
  const [reclamations, setReclamations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    clientService.getMesReclamations()
      .then(data => setReclamations(data))
      .catch(() => setError('Impossible de charger vos réclamations'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container">
      <div style={{ marginBottom: '32px' }}>
        <h1>Mes réclamations</h1>
        {clientUser && (
          <p style={{ color: '#6b7280' }}>
            Bonjour, {clientUser.prenom} {clientUser.nom}
          </p>
        )}
      </div>

      {loading && <p>Chargement de vos réclamations...</p>}
      {error && <div className="error-box">{error}</div>}

      {!loading && reclamations.length === 0 && (
        <div className="empty-state">
          <p>Vous n'avez pas encore de réclamation.</p>
          <Link to="/rechercher" className="btn-primary" style={{ marginTop: '16px', display: 'inline-block' }}>
            Déposer une réclamation
          </Link>
        </div>
      )}

      <div className="mes-reclamations-list">
        {reclamations.map(rec => (
          <div key={rec.id_reclamation} className="mes-reclamations-card">
            <div className="card-header">
              <div>
                <h3>Réclamation #{rec.id_reclamation}</h3>
                <p style={{ color: '#6b7280', fontSize: '13px', margin: '2px 0 0' }}>
                  {new Date(rec.date_creation).toLocaleDateString('fr-FR', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                <span style={{
                  background: PRIORITE_COLORS[rec.priorite_detectee] || '#6b7280',
                  color: 'white', padding: '2px 10px', borderRadius: '12px', fontSize: '12px'
                }}>
                  {rec.priorite_detectee}
                </span>
                {rec.a_reponse && (
                  <span className="client-indicator">
                    <MessageSquare size={12} /> Réponse disponible
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', margin: '10px 0', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                {STATUT_ICONS[rec.statut_reclamation]}
                {STATUT_LABELS[rec.statut_reclamation] || rec.statut_reclamation}
              </span>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>
                Service : {rec.service_destinataire || '—'}
              </span>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>
                {rec.classification_detectee}
              </span>
            </div>

            <p className="description" style={{
              overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
            }}>
              {rec.description}
            </p>

            <div style={{ marginTop: '12px' }}>
              <Link
                to={`/suivi?id=${rec.id_reclamation}`}
                className="btn-secondary"
                style={{ fontSize: '14px', padding: '6px 16px' }}
                onClick={() => {}}
              >
                Voir le suivi {rec.a_reponse ? '& la réponse' : ''}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
