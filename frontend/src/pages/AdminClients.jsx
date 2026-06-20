import { useEffect, useState } from 'react';
import { adminService } from '../services/api';
import {
  User, ChevronDown, ChevronUp, Package, FileText,
  Pencil, Check, X, Search, ShoppingBag, UserPlus, Trash2, Plus, Minus,
} from 'lucide-react';

const TYPE_OPTIONS = ['normal', 'vip', 'professionnel'];
const STATUT_COMMANDE_OPTIONS = ['en_preparation', 'expediee', 'livree', 'annulee', 'retournee'];
const PRIORITE_COMMANDE_OPTIONS = ['faible', 'normale', 'elevee', 'urgente'];

const LABEL_STATUT_CMD = {
  en_preparation: 'En préparation', expediee: 'Expédiée',
  livree: 'Livrée', annulee: 'Annulée', retournee: 'Retournée',
};
const LABEL_PRIORITE = { faible: 'Faible', normale: 'Normale', elevee: 'Élevée', urgente: 'Urgente' };
const COLOR_STATUT_CMD = {
  en_preparation: '#667eea', expediee: '#4299e1',
  livree: '#48bb78', annulee: '#fc8181', retournee: '#f6ad55',
};
const LABEL_STATUT_REC = {
  en_attente: 'En attente', en_analyse: 'En analyse',
  affectee: 'Affectée', en_traitement: 'En traitement',
  resolue: 'Résolue', fermee: 'Fermée',
};

const EMPTY_CREATE = {
  nom: '', prenom: '', telephone: '', email: '',
  mot_de_passe: '', type_client: 'normal', est_prioritaire: false,
};

const makeEmptyCommande = (idClient) => ({
  numero_commande: `CMD-${idClient}-${Date.now().toString().slice(-5)}`,
  date_commande: new Date().toISOString().slice(0, 10),
  statut_commande: 'en_preparation',
  montant_total: '',
  priorite_commande: 'faible',
  transporteur: '',
  adresse_livraison: '',
  date_livraison_prevue: '',
});

function TypeBadge({ type }) {
  const colors = {
    vip: ['#fef3c7', '#92400e'],
    professionnel: ['#ede9fe', '#5b21b6'],
    normal: ['#f3f4f6', '#374151'],
  };
  const [bg, col] = colors[type] || colors.normal;
  return (
    <span style={{ background: bg, color: col, padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
      {type?.toUpperCase()}
    </span>
  );
}

function StatutBadge({ statut }) {
  const col = COLOR_STATUT_CMD[statut] || '#9ca3af';
  return (
    <span style={{ background: col + '20', color: col, padding: '2px 10px', borderRadius: 10, fontSize: 12, fontWeight: 600 }}>
      {LABEL_STATUT_CMD[statut] || statut}
    </span>
  );
}

export default function AdminClients() {
  const [clients, setClients] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [detail, setDetail] = useState({});
  const [loadingDetail, setLoadingDetail] = useState({});
  const [editClient, setEditClient] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [updatingStatut, setUpdatingStatut] = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState({});

  // Commande creation state
  const [showCommandeForm, setShowCommandeForm] = useState(null); // client id
  const [commandeForm, setCommandeForm] = useState({});
  const [commandeLines, setCommandeLines] = useState([{ id_article: '', quantite: 1 }]);
  const [creatingCommande, setCreatingCommande] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setClients(await adminService.getClients()); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    adminService.getArticles().then(setArticles).catch(() => {});
  }, []);

  const toggleExpand = async (id) => {
    if (expanded === id) { setExpanded(null); setShowCommandeForm(null); return; }
    setExpanded(id);
    setShowCommandeForm(null);
    if (!detail[id]) {
      setLoadingDetail(p => ({ ...p, [id]: true }));
      try {
        const d = await adminService.getClientDetail(id);
        setDetail(p => ({ ...p, [id]: d }));
      } finally {
        setLoadingDetail(p => ({ ...p, [id]: false }));
      }
    }
  };

  const refreshDetail = async (id) => {
    const d = await adminService.getClientDetail(id);
    setDetail(p => ({ ...p, [id]: d }));
  };

  const openEdit = (c) => {
    setEditClient(c.id_client);
    setEditForm({
      nom: c.nom, prenom: c.prenom, telephone: c.telephone,
      email: c.email || '', type_client: c.type_client || 'normal',
      est_prioritaire: c.est_prioritaire,
    });
    setShowCreate(false);
    setMsg(null);
  };

  const handleSaveClient = async () => {
    setSaving(true);
    try {
      await adminService.updateClient(editClient, editForm);
      setMsg({ type: 'success', text: 'Client mis à jour.' });
      setEditClient(null);
      load();
      if (detail[editClient]) await refreshDetail(editClient);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Erreur lors de la sauvegarde' });
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setMsg(null);
    try {
      const payload = { ...createForm };
      if (!payload.email) delete payload.email;
      if (!payload.mot_de_passe) delete payload.mot_de_passe;
      await adminService.createClient(payload);
      setMsg({ type: 'success', text: `Client ${createForm.prenom} ${createForm.nom} créé avec succès.` });
      setShowCreate(false);
      setCreateForm(EMPTY_CREATE);
      load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Erreur lors de la création' });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`Supprimer définitivement ${c.prenom} ${c.nom} ?\n\nCette action est irréversible.`)) return;
    setDeleting(p => ({ ...p, [c.id_client]: true }));
    setMsg(null);
    try {
      await adminService.deleteClient(c.id_client);
      setMsg({ type: 'success', text: `Client ${c.prenom} ${c.nom} supprimé.` });
      if (expanded === c.id_client) setExpanded(null);
      load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Erreur lors de la suppression' });
    } finally {
      setDeleting(p => ({ ...p, [c.id_client]: false }));
    }
  };

  const handleUpdateStatut = async (idCommande, nouveauStatut) => {
    setUpdatingStatut(p => ({ ...p, [idCommande]: true }));
    try {
      await adminService.updateCommandeStatut(idCommande, nouveauStatut);
      if (expanded) await refreshDetail(expanded);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Erreur mise à jour statut' });
    } finally {
      setUpdatingStatut(p => ({ ...p, [idCommande]: false }));
    }
  };

  const openCommandeForm = (idClient) => {
    setShowCommandeForm(idClient);
    setCommandeForm(makeEmptyCommande(idClient));
    setCommandeLines([{ id_article: '', quantite: 1 }]);
  };

  const addLine = () => setCommandeLines(p => [...p, { id_article: '', quantite: 1 }]);
  const removeLine = (i) => setCommandeLines(p => p.filter((_, idx) => idx !== i));
  const updateLine = (i, field, val) => setCommandeLines(p => p.map((l, idx) => idx === i ? { ...l, [field]: val } : l));

  const handleCreateCommande = async (e, idClient) => {
    e.preventDefault();
    setCreatingCommande(true);
    setMsg(null);
    try {
      const validLines = commandeLines
        .filter(l => l.id_article)
        .map(l => ({ id_article: parseInt(l.id_article), quantite: parseInt(l.quantite) || 1 }));

      const payload = {
        id_client: idClient,
        numero_commande: commandeForm.numero_commande,
        date_commande: commandeForm.date_commande,
        statut_commande: commandeForm.statut_commande,
        montant_total: parseFloat(commandeForm.montant_total) || 0,
        priorite_commande: commandeForm.priorite_commande,
        lignes: validLines,
      };
      if (commandeForm.transporteur) payload.transporteur = commandeForm.transporteur;
      if (commandeForm.adresse_livraison) payload.adresse_livraison = commandeForm.adresse_livraison;
      if (commandeForm.date_livraison_prevue) payload.date_livraison_prevue = commandeForm.date_livraison_prevue;

      const res = await adminService.createCommande(payload);
      setMsg({ type: 'success', text: `Commande ${commandeForm.numero_commande} créée. Suivi : ${res.numero_suivi}` });
      setShowCommandeForm(null);
      load();
      await refreshDetail(idClient);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Erreur lors de la création de la commande' });
    } finally {
      setCreatingCommande(false);
    }
  };

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    return (
      c.nom.toLowerCase().includes(q) ||
      c.prenom.toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      c.telephone.includes(q)
    );
  });

  if (loading) return <div className="container"><p style={{ color: '#6b7280', paddingTop: 40 }}>Chargement...</p></div>;

  return (
    <div className="container" style={{ paddingTop: 32 }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' }}>
            <ShoppingBag size={22} style={{ verticalAlign: 'middle', marginRight: 8, color: '#667eea' }} />
            Gestion des clients
          </h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>{clients.length} client(s) dans le système</p>
        </div>
        <button
          onClick={() => { setShowCreate(v => !v); setEditClient(null); setMsg(null); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 18px',
            background: showCreate ? '#f3f4f6' : 'linear-gradient(135deg, #667eea, #764ba2)',
            color: showCreate ? '#374151' : '#fff',
            border: 'none', borderRadius: 9, cursor: 'pointer', fontWeight: 600, fontSize: 14,
          }}
        >
          {showCreate ? <X size={16} /> : <UserPlus size={16} />}
          {showCreate ? 'Annuler' : 'Nouveau client'}
        </button>
      </div>

      {/* Message global */}
      {msg && (
        <div style={{
          background: msg.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: msg.type === 'success' ? '#166534' : '#991b1b',
          padding: '10px 16px', borderRadius: 8, marginBottom: 20,
          fontSize: 14, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {msg.type === 'success' ? <Check size={15} /> : <X size={15} />}
          {msg.text}
          <button onClick={() => setMsg(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Formulaire de création client */}
      {showCreate && (
        <div style={{
          background: '#fff', borderRadius: 12, padding: 24,
          boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
          marginBottom: 24, border: '2px solid #667eea30',
        }}>
          <h3 style={{ margin: '0 0 20px', color: '#1f2937', fontSize: '1rem' }}>
            <UserPlus size={16} style={{ verticalAlign: 'middle', marginRight: 6, color: '#667eea' }} />
            Créer un nouveau client
          </h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 14 }}>
              {[
                ['Nom *', 'nom', 'text', true],
                ['Prénom *', 'prenom', 'text', true],
                ['Téléphone *', 'telephone', 'tel', true],
                ['Email', 'email', 'email', false],
                ['Mot de passe (pour espace client)', 'mot_de_passe', 'password', false],
              ].map(([label, key, type, required]) => (
                <div key={key}>
                  <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>{label}</label>
                  <input
                    type={type}
                    value={createForm[key]}
                    onChange={e => setCreateForm(p => ({ ...p, [key]: e.target.value }))}
                    required={required}
                    style={{
                      width: '100%', padding: '8px 12px',
                      border: '1px solid #d1d5db', borderRadius: 8,
                      fontSize: 14, boxSizing: 'border-box',
                    }}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>Type client</label>
                <select
                  value={createForm.type_client}
                  onChange={e => setCreateForm(p => ({ ...p, type_client: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
                >
                  {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 18 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#374151', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={createForm.est_prioritaire}
                  onChange={e => setCreateForm(p => ({ ...p, est_prioritaire: e.target.checked }))}
                />
                Client prioritaire
              </label>
              {createForm.mot_de_passe && (
                <span style={{ fontSize: 12, color: '#48bb78', fontWeight: 500 }}>
                  <Check size={13} style={{ verticalAlign: 'middle' }} /> Le client pourra se connecter à l'espace client
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="submit"
                disabled={creating}
                style={{
                  padding: '9px 20px',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: '#fff', border: 'none', borderRadius: 8,
                  cursor: 'pointer', fontWeight: 600, fontSize: 14,
                }}
              >
                {creating ? 'Création...' : 'Créer le client'}
              </button>
              <button
                type="button"
                onClick={() => { setShowCreate(false); setCreateForm(EMPTY_CREATE); }}
                style={{ padding: '9px 16px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Barre de recherche */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom, email ou téléphone..."
          style={{
            width: '100%', padding: '10px 12px 10px 38px',
            border: '1px solid #e5e7eb', borderRadius: 10,
            fontSize: 14, boxSizing: 'border-box', outline: 'none',
          }}
        />
      </div>

      {/* Liste des clients */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.length === 0 && (
          <p style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center', paddingTop: 20 }}>Aucun client trouvé.</p>
        )}
        {filtered.map(c => {
          const isOpen = expanded === c.id_client;
          const isEditing = editClient === c.id_client;
          const d = detail[c.id_client];
          const isLoadingD = loadingDetail[c.id_client];
          const showCmdForm = showCommandeForm === c.id_client;

          return (
            <div key={c.id_client} style={{
              background: '#fff', borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden',
              border: isOpen ? '1px solid #667eea30' : '1px solid transparent',
            }}>
              {/* En-tête client */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', gap: 14 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <User size={18} color="#fff" />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: '#1f2937', fontSize: 15 }}>{c.prenom} {c.nom}</span>
                    <TypeBadge type={c.type_client} />
                    {c.est_prioritaire && (
                      <span style={{ background: '#fee2e2', color: '#991b1b', padding: '1px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>PRIORITAIRE</span>
                    )}
                    {!c.est_inscrit && (
                      <span style={{ background: '#f3f4f6', color: '#6b7280', padding: '1px 8px', borderRadius: 20, fontSize: 11 }}>non inscrit</span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                    {c.email || '—'} · {c.telephone}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, color: '#667eea', fontSize: 18 }}>{c.nb_commandes}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>commandes</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, color: '#f6ad55', fontSize: 18 }}>{c.nb_reclamations}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>réclamations</div>
                  </div>

                  <button
                    onClick={() => openEdit(c)}
                    title="Modifier"
                    style={{ background: '#f0f0ff', border: 'none', borderRadius: 8, padding: '7px 9px', cursor: 'pointer', color: '#667eea' }}
                  >
                    <Pencil size={15} />
                  </button>

                  <button
                    onClick={() => handleDelete(c)}
                    disabled={deleting[c.id_client]}
                    title={c.nb_commandes > 0 || c.nb_reclamations > 0 ? 'Impossible : le client a des données liées' : 'Supprimer'}
                    style={{
                      background: (c.nb_commandes > 0 || c.nb_reclamations > 0) ? '#f9f9f9' : '#fff0f0',
                      border: 'none', borderRadius: 8, padding: '7px 9px', cursor: 'pointer',
                      color: (c.nb_commandes > 0 || c.nb_reclamations > 0) ? '#d1d5db' : '#fc8181',
                      opacity: deleting[c.id_client] ? 0.5 : 1,
                    }}
                  >
                    <Trash2 size={15} />
                  </button>

                  <button
                    onClick={() => toggleExpand(c.id_client)}
                    style={{
                      background: isOpen ? '#667eea' : '#f3f4f6',
                      border: 'none', borderRadius: 8, padding: '7px 12px', cursor: 'pointer',
                      color: isOpen ? '#fff' : '#374151',
                      display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 500,
                    }}
                  >
                    {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    {isOpen ? 'Fermer' : 'Détails'}
                  </button>
                </div>
              </div>

              {/* Formulaire édition client */}
              {isEditing && (
                <div style={{ borderTop: '1px solid #f3f4f6', padding: '16px 20px', background: '#f9fafb' }}>
                  <h4 style={{ margin: '0 0 14px', color: '#374151', fontSize: 14 }}>Modifier le client</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
                    {[['Nom', 'nom'], ['Prénom', 'prenom'], ['Téléphone', 'telephone'], ['Email', 'email']].map(([label, key]) => (
                      <div key={key}>
                        <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>{label}</label>
                        <input
                          type="text"
                          value={editForm[key]}
                          onChange={e => setEditForm(p => ({ ...p, [key]: e.target.value }))}
                          style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 13, boxSizing: 'border-box' }}
                        />
                      </div>
                    ))}
                    <div>
                      <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>Type client</label>
                      <select
                        value={editForm.type_client}
                        onChange={e => setEditForm(p => ({ ...p, type_client: e.target.value }))}
                        style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 13 }}
                      >
                        {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 20 }}>
                      <input
                        type="checkbox"
                        id={`prio-${c.id_client}`}
                        checked={editForm.est_prioritaire}
                        onChange={e => setEditForm(p => ({ ...p, est_prioritaire: e.target.checked }))}
                      />
                      <label htmlFor={`prio-${c.id_client}`} style={{ fontSize: 13, color: '#374151' }}>Prioritaire</label>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={handleSaveClient}
                      disabled={saving}
                      style={{ padding: '7px 16px', background: '#667eea', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                    >
                      {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                    </button>
                    <button
                      onClick={() => setEditClient(null)}
                      style={{ padding: '7px 14px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13 }}
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              {/* Détails expandés */}
              {isOpen && (
                <div style={{ borderTop: '1px solid #f3f4f6', padding: '0 20px 20px' }}>
                  {isLoadingD ? (
                    <p style={{ color: '#9ca3af', fontSize: 14, paddingTop: 16 }}>Chargement des détails...</p>
                  ) : d ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, paddingTop: 20 }}>

                      {/* Colonne Commandes */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <Package size={15} color="#667eea" />
                            <span style={{ fontWeight: 600, color: '#374151', fontSize: 14 }}>Commandes ({d.commandes.length})</span>
                          </div>
                          <button
                            onClick={() => showCmdForm ? setShowCommandeForm(null) : openCommandeForm(c.id_client)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              padding: '5px 12px',
                              background: showCmdForm ? '#f3f4f6' : '#667eea',
                              color: showCmdForm ? '#374151' : '#fff',
                              border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                            }}
                          >
                            {showCmdForm ? <><X size={12} /> Annuler</> : <><Plus size={12} /> Nouvelle commande</>}
                          </button>
                        </div>

                        {/* Formulaire nouvelle commande */}
                        {showCmdForm && (
                          <form
                            onSubmit={(e) => handleCreateCommande(e, c.id_client)}
                            style={{
                              background: '#f0f4ff', border: '1px solid #c7d2fe',
                              borderRadius: 10, padding: 16, marginBottom: 14,
                            }}
                          >
                            <p style={{ margin: '0 0 12px', fontWeight: 600, color: '#3730a3', fontSize: 13 }}>
                              Créer une commande pour {c.prenom} {c.nom}
                            </p>

                            {/* Champs commande */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                              <div>
                                <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 3 }}>N° commande *</label>
                                <input
                                  required
                                  value={commandeForm.numero_commande}
                                  onChange={e => setCommandeForm(p => ({ ...p, numero_commande: e.target.value }))}
                                  style={{ width: '100%', padding: '6px 10px', border: '1px solid #c7d2fe', borderRadius: 6, fontSize: 12, boxSizing: 'border-box' }}
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 3 }}>Date commande *</label>
                                <input
                                  required
                                  type="date"
                                  value={commandeForm.date_commande}
                                  onChange={e => setCommandeForm(p => ({ ...p, date_commande: e.target.value }))}
                                  style={{ width: '100%', padding: '6px 10px', border: '1px solid #c7d2fe', borderRadius: 6, fontSize: 12, boxSizing: 'border-box' }}
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 3 }}>Montant total (DA) *</label>
                                <input
                                  required
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={commandeForm.montant_total}
                                  onChange={e => setCommandeForm(p => ({ ...p, montant_total: e.target.value }))}
                                  style={{ width: '100%', padding: '6px 10px', border: '1px solid #c7d2fe', borderRadius: 6, fontSize: 12, boxSizing: 'border-box' }}
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 3 }}>Statut</label>
                                <select
                                  value={commandeForm.statut_commande}
                                  onChange={e => setCommandeForm(p => ({ ...p, statut_commande: e.target.value }))}
                                  style={{ width: '100%', padding: '6px 10px', border: '1px solid #c7d2fe', borderRadius: 6, fontSize: 12 }}
                                >
                                  {STATUT_COMMANDE_OPTIONS.map(s => <option key={s} value={s}>{LABEL_STATUT_CMD[s]}</option>)}
                                </select>
                              </div>
                              <div>
                                <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 3 }}>Priorité</label>
                                <select
                                  value={commandeForm.priorite_commande}
                                  onChange={e => setCommandeForm(p => ({ ...p, priorite_commande: e.target.value }))}
                                  style={{ width: '100%', padding: '6px 10px', border: '1px solid #c7d2fe', borderRadius: 6, fontSize: 12 }}
                                >
                                  {PRIORITE_COMMANDE_OPTIONS.map(s => <option key={s} value={s}>{LABEL_PRIORITE[s]}</option>)}
                                </select>
                              </div>
                              <div>
                                <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 3 }}>Transporteur</label>
                                <input
                                  value={commandeForm.transporteur}
                                  onChange={e => setCommandeForm(p => ({ ...p, transporteur: e.target.value }))}
                                  placeholder="ex: DHL, Yalidine..."
                                  style={{ width: '100%', padding: '6px 10px', border: '1px solid #c7d2fe', borderRadius: 6, fontSize: 12, boxSizing: 'border-box' }}
                                />
                              </div>
                              <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 3 }}>Adresse de livraison</label>
                                <input
                                  value={commandeForm.adresse_livraison}
                                  onChange={e => setCommandeForm(p => ({ ...p, adresse_livraison: e.target.value }))}
                                  placeholder="ex: 12 rue Didouche Mourad, Alger..."
                                  style={{ width: '100%', padding: '6px 10px', border: '1px solid #c7d2fe', borderRadius: 6, fontSize: 12, boxSizing: 'border-box' }}
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 3 }}>Date livraison prévue</label>
                                <input
                                  type="date"
                                  value={commandeForm.date_livraison_prevue}
                                  onChange={e => setCommandeForm(p => ({ ...p, date_livraison_prevue: e.target.value }))}
                                  style={{ width: '100%', padding: '6px 10px', border: '1px solid #c7d2fe', borderRadius: 6, fontSize: 12, boxSizing: 'border-box' }}
                                />
                              </div>
                            </div>

                            {/* Lignes articles */}
                            <div style={{ marginBottom: 12 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Articles</label>
                                <button
                                  type="button"
                                  onClick={addLine}
                                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: '#e0e7ff', color: '#3730a3', border: 'none', borderRadius: 5, cursor: 'pointer', fontSize: 11 }}
                                >
                                  <Plus size={11} /> Ajouter un article
                                </button>
                              </div>
                              {commandeLines.map((line, i) => (
                                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                                  <select
                                    value={line.id_article}
                                    onChange={e => updateLine(i, 'id_article', e.target.value)}
                                    style={{ flex: 1, padding: '5px 8px', border: '1px solid #c7d2fe', borderRadius: 6, fontSize: 12 }}
                                  >
                                    <option value="">— Choisir un article —</option>
                                    {articles.map(a => (
                                      <option key={a.id_article} value={a.id_article}>
                                        {a.nom_article} ({a.categorie_article})
                                      </option>
                                    ))}
                                  </select>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <button
                                      type="button"
                                      onClick={() => updateLine(i, 'quantite', Math.max(1, line.quantite - 1))}
                                      style={{ background: '#e5e7eb', border: 'none', borderRadius: 4, width: 22, height: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                      <Minus size={10} />
                                    </button>
                                    <span style={{ fontSize: 12, fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{line.quantite}</span>
                                    <button
                                      type="button"
                                      onClick={() => updateLine(i, 'quantite', line.quantite + 1)}
                                      style={{ background: '#e5e7eb', border: 'none', borderRadius: 4, width: 22, height: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                      <Plus size={10} />
                                    </button>
                                  </div>
                                  {commandeLines.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeLine(i)}
                                      style={{ background: '#fee2e2', border: 'none', borderRadius: 4, width: 22, height: 22, cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                      <X size={10} />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>

                            <button
                              type="submit"
                              disabled={creatingCommande}
                              style={{
                                padding: '8px 20px',
                                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                color: '#fff', border: 'none', borderRadius: 7,
                                cursor: 'pointer', fontWeight: 600, fontSize: 13,
                              }}
                            >
                              {creatingCommande ? 'Création...' : 'Créer la commande'}
                            </button>
                          </form>
                        )}

                        {/* Liste commandes existantes */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {d.commandes.length === 0 && !showCmdForm && (
                            <p style={{ color: '#9ca3af', fontSize: 13 }}>Aucune commande. Créez-en une pour permettre au client de soumettre une réclamation.</p>
                          )}
                          {d.commandes.map(cmd => (
                            <div key={cmd.id_commande} style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 14px', border: '1px solid #f3f4f6' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <span style={{ fontWeight: 600, color: '#1f2937', fontSize: 13 }}>#{cmd.numero_commande}</span>
                                <StatutBadge statut={cmd.statut_commande} />
                              </div>
                              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
                                {new Date(cmd.date_commande).toLocaleDateString('fr-FR')} · {Number(cmd.montant_total).toFixed(2)} DA
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                                {cmd.articles.map((a, i) => (
                                  <span key={i} style={{ background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: 8, fontSize: 11 }}>
                                    {a.nom_article} ×{a.quantite}
                                  </span>
                                ))}
                              </div>
                              {cmd.livraison && (
                                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
                                  {cmd.livraison.transporteur && <span style={{ fontWeight: 500 }}>{cmd.livraison.transporteur}</span>}
                                  {cmd.livraison.statut_livraison && <> · {cmd.livraison.statut_livraison}</>}
                                  {cmd.livraison.date_livraison_prevue && <> · Prévu : {cmd.livraison.date_livraison_prevue}</>}
                                </div>
                              )}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <label style={{ fontSize: 12, color: '#9ca3af' }}>Statut :</label>
                                <select
                                  value={cmd.statut_commande}
                                  onChange={e => handleUpdateStatut(cmd.id_commande, e.target.value)}
                                  disabled={updatingStatut[cmd.id_commande]}
                                  style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}
                                >
                                  {STATUT_COMMANDE_OPTIONS.map(s => <option key={s} value={s}>{LABEL_STATUT_CMD[s]}</option>)}
                                </select>
                                {updatingStatut[cmd.id_commande] && <span style={{ fontSize: 12, color: '#9ca3af' }}>...</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Colonne Réclamations */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                          <FileText size={15} color="#f6ad55" />
                          <span style={{ fontWeight: 600, color: '#374151', fontSize: 14 }}>Réclamations ({d.reclamations.length})</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {d.reclamations.length === 0 && <p style={{ color: '#9ca3af', fontSize: 13 }}>Aucune réclamation.</p>}
                          {d.reclamations.map(r => {
                            const confCol = r.score_confiance >= 70 ? '#48bb78' : r.score_confiance >= 40 ? '#f6ad55' : '#fc8181';
                            return (
                              <div key={r.id_reclamation} style={{ background: '#f9fafb', borderRadius: 10, padding: '10px 14px', border: '1px solid #f3f4f6' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                  <span style={{ fontSize: 12, color: '#9ca3af' }}>#{r.id_reclamation}</span>
                                  <span style={{ fontSize: 11, background: '#f3f4f6', color: '#374151', padding: '1px 8px', borderRadius: 8 }}>
                                    {LABEL_STATUT_REC[r.statut_reclamation] || r.statut_reclamation}
                                  </span>
                                </div>
                                <p style={{ margin: '0 0 8px', fontSize: 12, color: '#374151', lineHeight: 1.4 }}>{r.description}</p>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                                  <span className={`badge badge-${r.priorite_detectee}`} style={{ fontSize: 11 }}>{r.priorite_detectee}</span>
                                  <span style={{ fontSize: 11, color: '#6b7280' }}>{r.classification_detectee}</span>
                                  <span style={{ fontSize: 11, color: confCol, fontWeight: 600 }}>{Number(r.score_confiance).toFixed(0)}%</span>
                                  {r.est_complexe && (
                                    <span style={{ fontSize: 11, background: '#fef3c7', color: '#92400e', padding: '1px 6px', borderRadius: 8 }}>complexe</span>
                                  )}
                                </div>
                                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
                                  {new Date(r.date_creation).toLocaleDateString('fr-FR')} · {r.service_destinataire}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
