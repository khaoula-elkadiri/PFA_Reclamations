import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { reclamationService, reponseService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Search, MessageSquare, Lock } from 'lucide-react';

export default function TrackReclamation() {
  const [searchParams] = useSearchParams();
  const [id, setId] = useState(searchParams.get('id') || '');
  const [reclamation, setReclamation] = useState(null);
  const [reponse, setReponse] = useState(undefined);
  const [error, setError] = useState(null);
  const { isClientLoggedIn } = useAuth();

  const fetchReclamation = async (recId) => {
    setError(null);
    setReponse(undefined);
    try {
      const data = await reclamationService.getById(recId);
      setReclamation(data);
      if (isClientLoggedIn()) {
        reponseService.getForClient(recId)
          .then(r => setReponse(r))
          .catch(() => setReponse(null));
      } else {
        setReponse(null);
      }
    } catch {
      setError('Réclamation introuvable');
      setReclamation(null);
    }
  };

  useEffect(() => {
    const paramId = searchParams.get('id');
    if (paramId) fetchReclamation(paramId);
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    fetchReclamation(id);
  };

  return (
    <div className="container">
      <h1>Suivre ma réclamation</h1>

      <form onSubmit={handleSearch} className="search-form">
        <input
          type="number"
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="Numéro de réclamation"
          required
        />
        <button type="submit" className="btn-primary">
          <Search size={18} /> Rechercher
        </button>
      </form>

      {error && <div className="error-box">{error}</div>}

      {reclamation && (
        <div className="reclamation-detail">
          <h2>Réclamation #{reclamation.id_reclamation}</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Statut</label>
              <span className={`status status-${reclamation.statut_reclamation}`}>
                {reclamation.statut_reclamation}
              </span>
            </div>
            <div className="detail-item">
              <label>Catégorie</label>
              <span>{reclamation.classification_detectee}</span>
            </div>
            <div className="detail-item">
              <label>Priorité</label>
              <span className={`badge badge-${reclamation.priorite_detectee}`}>
                {reclamation.priorite_detectee}
              </span>
            </div>
            <div className="detail-item">
              <label>Service en charge</label>
              <span>{reclamation.service_destinataire}</span>
            </div>
          </div>
          <div className="description-box">
            <h3>Description</h3>
            <p>{reclamation.description}</p>
          </div>

          <div style={{ marginTop: '24px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <MessageSquare size={20} color="#667eea" />
              Réponse du service
            </h3>

            {!isClientLoggedIn() ? (
              <div className="response-login-prompt">
                <Lock size={18} />
                <span>
                  <Link to="/login/client" className="auth-link">Connectez-vous</Link> pour voir la réponse du service
                </span>
              </div>
            ) : reponse === undefined ? (
              <p style={{ color: '#6b7280' }}>Chargement...</p>
            ) : reponse ? (
              <div className="response-panel response-sent">
                <div className="response-panel-header">
                  <span>Réponse de {reponse.prenom_agent} {reponse.nom_agent}</span>
                  <span style={{ color: '#6b7280', fontSize: '13px' }}>
                    le {new Date(reponse.date_envoi).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <p className="response-content">{reponse.contenu}</p>
              </div>
            ) : (
              <div className="response-panel" style={{ borderLeft: '3px solid #e5e7eb' }}>
                <p style={{ color: '#6b7280', margin: 0 }}>
                  Votre réclamation est en cours de traitement. Un agent vous répondra prochainement.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
