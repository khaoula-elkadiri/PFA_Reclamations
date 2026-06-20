import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { clientService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Clock, CheckCircle, AlertCircle, Pencil, Trash2, Check, X } from 'lucide-react';

const STATUT_LABELS = {
  en_attente:    'En attente',
  en_analyse:    'En analyse',
  affectee:      'Affectée',
  en_traitement: 'En traitement',
  resolue:       'Résolue',
  fermee:        'Fermée',
};

const STATUT_ICONS = {
  en_attente:    <Clock size={14} color="#f59e0b" />,
  en_analyse:    <Clock size={14} color="#3b82f6" />,
  affectee:      <Clock size={14} color="#8b5cf6" />,
  en_traitement: <AlertCircle size={14} color="#f59e0b" />,
  resolue:       <CheckCircle size={14} color="#22c55e" />,
  fermee:        <CheckCircle size={14} color="#6b7280" />,
};

const MODIFIABLE_STATUTS = ['en_attente', 'en_analyse'];

export default function MesReclamations() {
  const { clientUser } = useAuth();
  const [reclamations, setReclamations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit state: { [id]: { open, text, saving, msg } }
  const [editState, setEditState] = useState({});
  const [deleting, setDeleting] = useState({});
  const [globalMsg, setGlobalMsg] = useState(null);

  const load = () => {
    setLoading(true);
    clientService.getMesReclamations()
      .then(data => setReclamations(data))
      .catch(() => setError('Impossible de charger vos réclamations'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openEdit = (rec) => {
    setEditState(prev => ({
      ...prev,
      [rec.id_reclamation]: { open: true, text: rec.description, saving: false, msg: null },
    }));
  };

  const closeEdit = (id) => {
    setEditState(prev => ({ ...prev, [id]: { ...prev[id], open: false } }));
  };

  const handleSaveEdit = async (id) => {
    const s = editState[id];
    if (!s?.text?.trim() || s.text.trim().length < 10) {
      setEditState(prev => ({ ...prev, [id]: { ...prev[id], msg: { type: 'error', text: 'La description doit contenir au moins 10 caractères.' } } }));
      return;
    }
    setEditState(prev => ({ ...prev, [id]: { ...prev[id], saving: true, msg: null } }));
    try {
      await clientService.updateReclamation(id, s.text.trim());
      setReclamations(prev =>
        prev.map(r => r.id_reclamation === id ? { ...r, description: s.text.trim() } : r)
      );
      setEditState(prev => ({ ...prev, [id]: { open: false, text: s.text.trim(), saving: false, msg: null } }));
      setGlobalMsg({ type: 'success', text: `Réclamation #${id} modifiée avec succès.` });
    } catch (err) {
      setEditState(prev => ({
        ...prev,
        [id]: { ...prev[id], saving: false, msg: { type: 'error', text: err.response?.data?.detail || 'Erreur lors de la modification.' } },
      }));
    }
  };

  const handleDelete = async (rec) => {
    if (!window.confirm(`Supprimer la réclamation #${rec.id_reclamation} ?\n\nCette action est irréversible.`)) return;
    setDeleting(prev => ({ ...prev, [rec.id_reclamation]: true }));
    setGlobalMsg(null);
    try {
      await clientService.deleteReclamation(rec.id_reclamation);
      setReclamations(prev => prev.filter(r => r.id_reclamation !== rec.id_reclamation));
      setGlobalMsg({ type: 'success', text: `Réclamation #${rec.id_reclamation} supprimée.` });
    } catch (err) {
      setGlobalMsg({ type: 'error', text: err.response?.data?.detail || 'Erreur lors de la suppression.' });
    } finally {
      setDeleting(prev => ({ ...prev, [rec.id_reclamation]: false }));
    }
  };

  return (
    <div className="container">
      <div style={{ marginBottom: '28px' }}>
        <h1>Mes réclamations</h1>
        {clientUser && (
          <p style={{ color: '#6b7280', margin: '4px 0 0' }}>
            Bonjour, {clientUser.prenom} {clientUser.nom}
          </p>
        )}
      </div>

      {/* Message global */}
      {globalMsg && (
        <div style={{
          background: globalMsg.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: globalMsg.type === 'success' ? '#166534' : '#991b1b',
          padding: '10px 16px', borderRadius: 8, marginBottom: 20,
          fontSize: 14, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {globalMsg.type === 'success' ? <Check size={15} /> : <X size={15} />}
          {globalMsg.text}
          <button onClick={() => setGlobalMsg(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {loading && <p style={{ color: '#6b7280' }}>Chargement de vos réclamations...</p>}
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
        {reclamations.map(rec => {
          const canEdit = MODIFIABLE_STATUTS.includes(rec.statut_reclamation);
          const es = editState[rec.id_reclamation] || {};

          return (
            <div key={rec.id_reclamation} className="mes-reclamations-card">
              {/* En-tête */}
              <div className="card-header">
                <div>
                  <h3>Réclamation #{rec.id_reclamation}</h3>
                  <p style={{ color: '#6b7280', fontSize: '13px', margin: '2px 0 0' }}>
                    {new Date(rec.date_creation).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {rec.a_reponse && (
                    <span className="client-indicator">
                      <MessageSquare size={12} /> Réponse disponible
                    </span>
                  )}
                  {/* Bouton modifier */}
                  <button
                    onClick={() => canEdit && openEdit(rec)}
                    title={canEdit ? 'Modifier la description' : 'Modification impossible : réclamation déjà prise en charge'}
                    style={{
                      background: canEdit ? '#f0f4ff' : '#f3f4f6',
                      border: 'none', borderRadius: 8, padding: '6px 8px',
                      cursor: canEdit ? 'pointer' : 'not-allowed',
                      color: canEdit ? '#667eea' : '#d1d5db',
                    }}
                  >
                    <Pencil size={14} />
                  </button>
                  {/* Bouton supprimer */}
                  <button
                    onClick={() => canEdit && handleDelete(rec)}
                    disabled={deleting[rec.id_reclamation]}
                    title={canEdit ? 'Supprimer la réclamation' : 'Suppression impossible : réclamation déjà prise en charge'}
                    style={{
                      background: canEdit ? '#fff0f0' : '#f3f4f6',
                      border: 'none', borderRadius: 8, padding: '6px 8px',
                      cursor: canEdit ? 'pointer' : 'not-allowed',
                      color: canEdit ? '#ef4444' : '#d1d5db',
                      opacity: deleting[rec.id_reclamation] ? 0.5 : 1,
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Statut + service */}
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

              {/* Description ou formulaire d'édition */}
              {es.open ? (
                <div style={{ marginBottom: 12 }}>
                  <textarea
                    value={es.text}
                    onChange={e => setEditState(prev => ({
                      ...prev,
                      [rec.id_reclamation]: { ...prev[rec.id_reclamation], text: e.target.value },
                    }))}
                    rows={4}
                    style={{
                      width: '100%', padding: '10px 12px',
                      border: '1px solid #c7d2fe', borderRadius: 8,
                      fontSize: 14, resize: 'vertical',
                      boxSizing: 'border-box', fontFamily: 'inherit',
                      lineHeight: 1.5, outline: 'none',
                    }}
                  />
                  {es.msg && (
                    <div style={{ fontSize: 12, color: es.msg.type === 'error' ? '#dc2626' : '#16a34a', marginTop: 4 }}>
                      {es.msg.text}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button
                      onClick={() => handleSaveEdit(rec.id_reclamation)}
                      disabled={es.saving}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '7px 16px',
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        color: '#fff', border: 'none', borderRadius: 7,
                        cursor: 'pointer', fontWeight: 600, fontSize: 13,
                      }}
                    >
                      <Check size={13} /> {es.saving ? 'Sauvegarde...' : 'Sauvegarder'}
                    </button>
                    <button
                      onClick={() => closeEdit(rec.id_reclamation)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '7px 14px',
                        background: '#f3f4f6', color: '#374151',
                        border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13,
                      }}
                    >
                      <X size={13} /> Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <p className="description" style={{
                  overflow: 'hidden', display: '-webkit-box',
                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>
                  {rec.description}
                </p>
              )}

              {/* Note d'information si non modifiable */}
              {!canEdit && (
                <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 8px', fontStyle: 'italic' }}>
                  Cette réclamation est en cours de traitement et ne peut plus être modifiée.
                </p>
              )}

              <div style={{ marginTop: '12px' }}>
                <Link
                  to={`/suivi?id=${rec.id_reclamation}`}
                  className="btn-secondary"
                  style={{ fontSize: '14px', padding: '6px 16px' }}
                >
                  Voir le suivi {rec.a_reponse ? '& la réponse' : ''}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
