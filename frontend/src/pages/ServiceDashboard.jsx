import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { dashboardService, reclamationService, reponseService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Send, CheckCircle } from 'lucide-react';

function ReponsePanel({ idReclamation }) {
  const [reponse, setReponse] = useState(undefined); // undefined = chargement
  const [contenu, setContenu] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    reponseService.getForAgent(idReclamation)
      .then(data => {
        setReponse(data);
        if (data) setContenu(data.contenu);
      })
      .catch(() => setReponse(null));
  }, [idReclamation]);

  const handleEnvoyer = async () => {
    if (!contenu.trim()) return;
    setSending(true);
    try {
      const data = await reponseService.creer(idReclamation, contenu);
      setReponse(data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert('Erreur lors de l\'envoi de la réponse');
    } finally {
      setSending(false);
    }
  };

  if (reponse === undefined) return <p className="response-loading">Chargement...</p>;

  if (reponse) {
    return (
      <div className="response-panel response-sent">
        <div className="response-panel-header">
          <CheckCircle size={16} color="#22c55e" />
          <span>Réponse envoyée le {new Date(reponse.date_envoi).toLocaleDateString('fr-FR')}</span>
          {reponse.nom_agent && <span className="response-agent">par {reponse.prenom_agent} {reponse.nom_agent}</span>}
        </div>
        <p className="response-content">{reponse.contenu}</p>
        <div style={{ marginTop: '8px' }}>
          <label style={{ fontSize: '13px', color: '#6b7280' }}>Modifier la réponse :</label>
          <textarea
            className="response-textarea"
            value={contenu}
            onChange={e => setContenu(e.target.value)}
            rows={3}
          />
          <button className="btn-secondary" onClick={handleEnvoyer} disabled={sending} style={{ marginTop: '6px' }}>
            {sending ? 'Mise à jour...' : 'Mettre à jour'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="response-panel response-draft">
      <div className="response-panel-header">
        <Send size={16} color="#667eea" />
        <span>Répondre au client</span>
      </div>
      <textarea
        className="response-textarea"
        placeholder="Rédigez votre réponse au client..."
        value={contenu}
        onChange={e => setContenu(e.target.value)}
        rows={4}
      />
      {success && <p className="response-success">Réponse envoyée avec succès !</p>}
      <button
        className="btn-primary"
        onClick={handleEnvoyer}
        disabled={sending || !contenu.trim()}
        style={{ marginTop: '8px' }}
      >
        <Send size={16} style={{ marginRight: '6px' }} />
        {sending ? 'Envoi...' : 'Envoyer la réponse'}
      </button>
    </div>
  );
}

export default function ServiceDashboard() {
  const { nomService } = useParams();
  const { agentUser } = useAuth();
  const [reclamations, setReclamations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [nomService]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await dashboardService.getByService(nomService);
      setReclamations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatut = async (id, statut) => {
    try {
      await reclamationService.updateStatut(id, statut);
      loadData();
    } catch (err) {
      alert('Erreur lors de la mise à jour');
    }
  };

  const prioriteBadge = (p) => {
    const colors = { critique: '#ef4444', elevee: '#f59e0b', moyenne: '#3b82f6', faible: '#22c55e' };
    return { backgroundColor: colors[p] || '#6b7280', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' };
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1>Service : {nomService}</h1>
          {agentUser && <p style={{ color: '#6b7280', marginTop: '4px' }}>Connecté : {agentUser.prenom} {agentUser.nom}</p>}
        </div>
        <span style={{ background: '#f3f4f6', padding: '6px 16px', borderRadius: '20px', fontSize: '14px' }}>
          {reclamations.length} réclamation{reclamations.length > 1 ? 's' : ''}
        </span>
      </div>

      {loading && <p>Chargement...</p>}

      <div className="reclamations-list">
        {reclamations.map(rec => (
          <div key={rec.id_reclamation} className="reclamation-card">
            <div className="card-header">
              <h3>Réclamation #{rec.id_reclamation}</h3>
              <span style={prioriteBadge(rec.priorite_detectee)}>{rec.priorite_detectee}</span>
            </div>
            <p><strong>Catégorie :</strong> {rec.classification_detectee}</p>
            <p><strong>Statut :</strong> <span className={`status status-${rec.statut_reclamation}`}>{rec.statut_reclamation}</span></p>
            <div className="description-box" style={{ marginTop: '10px' }}>
              <p>{rec.description}</p>
            </div>

            <ReponsePanel idReclamation={rec.id_reclamation} />

            <div className="card-actions" style={{ marginTop: '12px' }}>
              <button
                onClick={() => handleUpdateStatut(rec.id_reclamation, 'en_traitement')}
                className="btn-secondary"
                disabled={rec.statut_reclamation === 'en_traitement'}
              >
                En traitement
              </button>
              <button
                onClick={() => handleUpdateStatut(rec.id_reclamation, 'resolue')}
                className="btn-success"
                disabled={rec.statut_reclamation === 'resolue'}
              >
                Marquer résolue
              </button>
            </div>
          </div>
        ))}
        {!loading && reclamations.length === 0 && (
          <p style={{ textAlign: 'center', color: '#6b7280' }}>Aucune réclamation pour ce service.</p>
        )}
      </div>
    </div>
  );
}
