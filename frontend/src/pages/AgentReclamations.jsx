import { useCallback, useEffect, useState } from 'react';
import {
  RefreshCw, ChevronDown, ChevronUp, User, Package,
  Brain, CheckCircle, MessageSquare, Clock, Send,
} from 'lucide-react';
import { agentService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const PRIORITE_ORDER = { critique: 0, elevee: 1, moyenne: 2, faible: 3 };

const sortByPriority = (list) =>
  [...list].sort((a, b) =>
    (PRIORITE_ORDER[a.priorite_detectee] ?? 9) - (PRIORITE_ORDER[b.priorite_detectee] ?? 9)
  );

const STATUT_OPTIONS = [
  { value: 'en_traitement', label: 'En traitement' },
  { value: 'resolue',       label: 'Résolue'       },
  { value: 'fermee',        label: 'Fermée'        },
];

const LABEL_STATUT = {
  en_attente:    'En attente',
  en_analyse:    'En analyse',
  affectee:      'Affectée',
  en_traitement: 'En traitement',
  resolue:       'Résolue',
  fermee:        'Fermée',
};

const COLOR_STATUT = {
  en_attente:    { bg: '#fef3c7', text: '#92400e' },
  en_analyse:    { bg: '#ede9fe', text: '#5b21b6' },
  affectee:      { bg: '#dbeafe', text: '#1e40af' },
  en_traitement: { bg: '#e0f2fe', text: '#0369a1' },
  resolue:       { bg: '#dcfce7', text: '#166534' },
  fermee:        { bg: '#f3f4f6', text: '#374151' },
};

const COLOR_PRIORITE = {
  critique: '#dc2626',
  elevee:   '#f97316',
  moyenne:  '#eab308',
  faible:   '#22c55e',
};

function StatutBadge({ statut }) {
  const c = COLOR_STATUT[statut] || { bg: '#f3f4f6', text: '#374151' };
  return (
    <span style={{
      background: c.bg, color: c.text,
      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
    }}>
      {LABEL_STATUT[statut] || statut}
    </span>
  );
}

function PrioriteBadge({ priorite }) {
  const color = COLOR_PRIORITE[priorite] || '#9ca3af';
  return (
    <span style={{
      background: color + '20', color,
      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
    }}>
      {priorite}
    </span>
  );
}

export default function AgentReclamations() {
  const { agentUser } = useAuth();
  const [reclamations, setReclamations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);

  // Per-reclamation state: { [id]: { statut, reponse, savingStatut, savingReponse, statutMsg, reponseMsg } }
  const [state, setState] = useState({});

  const loadReclamations = useCallback(async () => {
    if (!agentUser?.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await agentService.getReclamations(agentUser.id);
      setReclamations(sortByPriority(data));
      // Initialize per-reclamation state from loaded data
      const init = {};
      data.forEach(r => {
        init[r.id_reclamation] = {
          statut: r.statut_reclamation,
          reponse: r.reponse?.contenu || '',
          existingReponse: r.reponse || null,
          savingStatut: false,
          savingReponse: false,
          statutMsg: null,
          reponseMsg: null,
        };
      });
      setState(init);
    } catch (err) {
      console.error(err);
      setError('Impossible de charger vos réclamations affectées.');
    } finally {
      setLoading(false);
    }
  }, [agentUser?.id]);

  useEffect(() => { loadReclamations(); }, [loadReclamations]);

  const toggleExpand = (id) => {
    setExpanded(prev => prev === id ? null : id);
  };

  const setField = (id, field, value) => {
    setState(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const handleSaveStatut = async (rec) => {
    const s = state[rec.id_reclamation];
    if (!s || s.statut === rec.statut_reclamation) return;
    setField(rec.id_reclamation, 'savingStatut', true);
    setField(rec.id_reclamation, 'statutMsg', null);
    try {
      await agentService.updateStatut(rec.id_reclamation, s.statut);
      // Update local reclamation statut
      setReclamations(prev =>
        sortByPriority(prev.map(r => r.id_reclamation === rec.id_reclamation
          ? { ...r, statut_reclamation: s.statut }
          : r
        ))
      );
      setField(rec.id_reclamation, 'statutMsg', { type: 'success', text: 'Statut mis à jour.' });
    } catch (err) {
      setField(rec.id_reclamation, 'statutMsg', {
        type: 'error',
        text: err.response?.data?.detail || 'Erreur lors de la mise à jour du statut.',
      });
    } finally {
      setField(rec.id_reclamation, 'savingStatut', false);
    }
  };

  const handleSendReponse = async (rec) => {
    const s = state[rec.id_reclamation];
    if (!s?.reponse?.trim()) return;
    setField(rec.id_reclamation, 'savingReponse', true);
    setField(rec.id_reclamation, 'reponseMsg', null);
    try {
      const result = await agentService.creerReponse(rec.id_reclamation, s.reponse);
      setField(rec.id_reclamation, 'existingReponse', {
        contenu: result.contenu,
        date_envoi: result.date_envoi,
        nom_agent: result.nom_agent,
        prenom_agent: result.prenom_agent,
      });
      // Also update statut locally if backend moved it to en_traitement
      setReclamations(prev =>
        prev.map(r => r.id_reclamation === rec.id_reclamation && r.statut_reclamation === 'affectee'
          ? { ...r, statut_reclamation: 'en_traitement' }
          : r
        )
      );
      setField(rec.id_reclamation, 'reponseMsg', { type: 'success', text: 'Réponse envoyée avec succès.' });
    } catch (err) {
      setField(rec.id_reclamation, 'reponseMsg', {
        type: 'error',
        text: err.response?.data?.detail || 'Erreur lors de l\'envoi de la réponse.',
      });
    } finally {
      setField(rec.id_reclamation, 'savingReponse', false);
    }
  };

  const enAttente = reclamations.filter(r => ['en_attente', 'en_analyse', 'affectee'].includes(r.statut_reclamation));
  const enTraitement = reclamations.filter(r => r.statut_reclamation === 'en_traitement');
  const terminees = reclamations.filter(r => ['resolue', 'fermee'].includes(r.statut_reclamation));

  return (
    <div className="container" style={{ paddingTop: 28 }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' }}>
            Mes réclamations affectées
          </h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>
            {agentUser?.prenom} {agentUser?.nom} — {agentUser?.service}
          </p>
        </div>
        <button
          onClick={loadReclamations}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 8,
            border: '1px solid #e5e7eb', background: '#fff',
            cursor: 'pointer', fontSize: 14,
          }}
        >
          <RefreshCw size={15} /> Actualiser
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total', value: reclamations.length, color: '#667eea', icon: <Package size={18} /> },
          { label: 'À traiter', value: enAttente.length, color: '#f59e0b', icon: <Clock size={18} /> },
          { label: 'En traitement', value: enTraitement.length, color: '#3b82f6', icon: <MessageSquare size={18} /> },
          { label: 'Terminées', value: terminees.length, color: '#10b981', icon: <CheckCircle size={18} /> },
        ].map(k => (
          <div key={k.label} style={{
            background: '#fff', borderRadius: 10, padding: '14px 18px',
            boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
            borderLeft: `3px solid ${k.color}`,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ color: k.color }}>{k.icon}</div>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1f2937', lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 14 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', color: '#9ca3af', paddingTop: 40 }}>Chargement...</div>
      ) : reclamations.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#9ca3af', paddingTop: 40, fontSize: 15 }}>
          Aucune réclamation affectée pour le moment.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reclamations.map(rec => {
            const isOpen = expanded === rec.id_reclamation;
            const s = state[rec.id_reclamation] || {};
            const confColor = rec.score_confiance >= 70 ? '#10b981' : rec.score_confiance >= 40 ? '#f59e0b' : '#ef4444';

            return (
              <div
                key={rec.id_reclamation}
                style={{
                  background: '#fff', borderRadius: 12,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                  border: isOpen ? '1px solid #667eea40' : '1px solid #f3f4f6',
                  overflow: 'hidden',
                }}
              >
                {/* Ligne résumé — cliquable */}
                <div
                  onClick={() => toggleExpand(rec.id_reclamation)}
                  style={{
                    display: 'flex', alignItems: 'center', padding: '14px 20px',
                    gap: 16, cursor: 'pointer',
                    background: isOpen ? '#fafbff' : '#fff',
                  }}
                >
                  {/* ID */}
                  <div style={{ minWidth: 50, fontWeight: 700, color: '#9ca3af', fontSize: 13 }}>
                    #{rec.id_reclamation}
                  </div>

                  {/* Client */}
                  <div style={{ minWidth: 140 }}>
                    <div style={{ fontWeight: 600, color: '#1f2937', fontSize: 14 }}>
                      {rec.client ? `${rec.client.prenom} ${rec.client.nom}` : 'Inconnu'}
                    </div>
                    {rec.numero_commande && (
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>Cmd #{rec.numero_commande}</div>
                    )}
                  </div>

                  {/* Description (tronquée) */}
                  <div style={{ flex: 1, fontSize: 13, color: '#374151', overflow: 'hidden' }}>
                    <span style={{
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {rec.description}
                    </span>
                  </div>

                  {/* Catégorie */}
                  <div style={{ minWidth: 120, fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
                    {rec.classification_detectee}
                  </div>

                  {/* Priorité */}
                  <div style={{ minWidth: 80 }}>
                    <PrioriteBadge priorite={rec.priorite_detectee} />
                  </div>

                  {/* Statut */}
                  <div style={{ minWidth: 110 }}>
                    <StatutBadge statut={rec.statut_reclamation} />
                  </div>

                  {/* Complexe */}
                  {rec.est_complexe && (
                    <span style={{
                      fontSize: 11, background: '#fef3c7', color: '#92400e',
                      padding: '2px 8px', borderRadius: 8, fontWeight: 600,
                    }}>
                      complexe
                    </span>
                  )}

                  {/* Chevron */}
                  <div style={{ color: '#9ca3af', flexShrink: 0 }}>
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>

                {/* Panneau détails expandé */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid #f3f4f6', padding: '20px 24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>

                      {/* Colonne 1 — Infos client + commande + description */}
                      <div>
                        <p style={{ margin: '0 0 14px', fontWeight: 700, color: '#374151', fontSize: 13, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                          Détails
                        </p>

                        {/* Client */}
                        <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px', marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                            <User size={13} color="#667eea" />
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Client</span>
                          </div>
                          {rec.client ? (
                            <>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>
                                {rec.client.prenom} {rec.client.nom}
                              </div>
                              {rec.client.telephone && (
                                <div style={{ fontSize: 12, color: '#6b7280' }}>{rec.client.telephone}</div>
                              )}
                              {rec.client.email && (
                                <div style={{ fontSize: 12, color: '#6b7280' }}>{rec.client.email}</div>
                              )}
                            </>
                          ) : (
                            <span style={{ fontSize: 12, color: '#9ca3af' }}>Inconnu</span>
                          )}
                        </div>

                        {/* Commande */}
                        {rec.numero_commande && (
                          <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px', marginBottom: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                              <Package size={13} color="#667eea" />
                              <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Commande</span>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>
                              #{rec.numero_commande}
                            </div>
                          </div>
                        )}

                        {/* Description complète */}
                        <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px' }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Description</div>
                          <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{rec.description}</p>
                        </div>
                      </div>

                      {/* Colonne 2 — Analyse IA + changement de statut */}
                      <div>
                        {/* Analyse IA */}
                        <p style={{ margin: '0 0 14px', fontWeight: 700, color: '#374151', fontSize: 13, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                          <Brain size={13} style={{ verticalAlign: 'middle', marginRight: 5, color: '#667eea' }} />
                          Analyse IA
                        </p>

                        <div style={{ background: '#f9fafb', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div>
                              <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>Catégorie</div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{rec.classification_detectee}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>Priorité</div>
                              <PrioriteBadge priorite={rec.priorite_detectee} />
                            </div>
                            <div>
                              <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>Confiance</div>
                              <span style={{ fontSize: 13, fontWeight: 700, color: confColor }}>
                                {Number(rec.score_confiance).toFixed(1)}%
                              </span>
                            </div>
                            <div>
                              <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>Complexité</div>
                              {rec.est_complexe ? (
                                <span style={{ fontSize: 12, background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 8, fontWeight: 600 }}>
                                  Complexe
                                </span>
                              ) : (
                                <span style={{ fontSize: 12, background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 8, fontWeight: 600 }}>
                                  Simple
                                </span>
                              )}
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                              <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>Service destinataire</div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{rec.service_destinataire || '—'}</div>
                            </div>
                          </div>
                        </div>

                        {/* Changement de statut */}
                        <p style={{ margin: '0 0 10px', fontWeight: 700, color: '#374151', fontSize: 13, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                          Changer le statut
                        </p>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <select
                            value={s.statut || rec.statut_reclamation}
                            onChange={e => setField(rec.id_reclamation, 'statut', e.target.value)}
                            style={{
                              flex: 1, padding: '8px 10px',
                              border: '1px solid #d1d5db', borderRadius: 8,
                              fontSize: 13, cursor: 'pointer',
                            }}
                          >
                            {/* Afficher le statut actuel s'il n'est pas dans les options agent */}
                            {!STATUT_OPTIONS.find(o => o.value === rec.statut_reclamation) && (
                              <option value={rec.statut_reclamation} disabled>
                                {LABEL_STATUT[rec.statut_reclamation] || rec.statut_reclamation}
                              </option>
                            )}
                            {STATUT_OPTIONS.map(o => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleSaveStatut(rec)}
                            disabled={s.savingStatut || s.statut === rec.statut_reclamation}
                            style={{
                              padding: '8px 14px',
                              background: s.statut !== rec.statut_reclamation ? '#667eea' : '#e5e7eb',
                              color: s.statut !== rec.statut_reclamation ? '#fff' : '#9ca3af',
                              border: 'none', borderRadius: 8,
                              cursor: s.statut !== rec.statut_reclamation ? 'pointer' : 'not-allowed',
                              fontWeight: 600, fontSize: 13,
                            }}
                          >
                            {s.savingStatut ? '...' : 'Sauvegarder'}
                          </button>
                        </div>
                        {s.statutMsg && (
                          <div style={{
                            marginTop: 8, fontSize: 12,
                            color: s.statutMsg.type === 'success' ? '#166534' : '#991b1b',
                          }}>
                            {s.statutMsg.text}
                          </div>
                        )}
                      </div>

                      {/* Colonne 3 — Réponse */}
                      <div>
                        <p style={{ margin: '0 0 14px', fontWeight: 700, color: '#374151', fontSize: 13, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                          <MessageSquare size={13} style={{ verticalAlign: 'middle', marginRight: 5, color: '#667eea' }} />
                          Réponse au client
                        </p>

                        {/* Réponse existante */}
                        {s.existingReponse && (
                          <div style={{
                            background: '#f0fdf4', border: '1px solid #bbf7d0',
                            borderRadius: 8, padding: '10px 14px', marginBottom: 12,
                          }}>
                            <div style={{ fontSize: 11, color: '#166534', fontWeight: 600, marginBottom: 4 }}>
                              <CheckCircle size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                              Réponse envoyée — {s.existingReponse.prenom_agent} {s.existingReponse.nom_agent}
                            </div>
                            <p style={{ margin: 0, fontSize: 12, color: '#374151', lineHeight: 1.5 }}>
                              {s.existingReponse.contenu}
                            </p>
                          </div>
                        )}

                        {/* Formulaire de réponse */}
                        <textarea
                          value={s.reponse || ''}
                          onChange={e => setField(rec.id_reclamation, 'reponse', e.target.value)}
                          placeholder={s.existingReponse
                            ? 'Modifier la réponse...'
                            : 'Rédiger une réponse pour le client...'}
                          rows={5}
                          style={{
                            width: '100%', padding: '10px 12px',
                            border: '1px solid #d1d5db', borderRadius: 8,
                            fontSize: 13, resize: 'vertical',
                            boxSizing: 'border-box', fontFamily: 'inherit',
                            lineHeight: 1.5, outline: 'none',
                          }}
                        />
                        <button
                          onClick={() => handleSendReponse(rec)}
                          disabled={s.savingReponse || !s.reponse?.trim()}
                          style={{
                            marginTop: 8, width: '100%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            padding: '9px 0',
                            background: s.reponse?.trim() ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#e5e7eb',
                            color: s.reponse?.trim() ? '#fff' : '#9ca3af',
                            border: 'none', borderRadius: 8,
                            cursor: s.reponse?.trim() ? 'pointer' : 'not-allowed',
                            fontWeight: 600, fontSize: 13,
                          }}
                        >
                          <Send size={14} />
                          {s.savingReponse
                            ? 'Envoi en cours...'
                            : s.existingReponse
                              ? 'Mettre à jour la réponse'
                              : 'Envoyer la réponse'}
                        </button>
                        {s.reponseMsg && (
                          <div style={{
                            marginTop: 8, fontSize: 12,
                            color: s.reponseMsg.type === 'success' ? '#166534' : '#991b1b',
                          }}>
                            {s.reponseMsg.text}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer : date d'affectation */}
                    <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #f3f4f6', fontSize: 12, color: '#9ca3af' }}>
                      Réclamation créée le {new Date(rec.date_creation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
