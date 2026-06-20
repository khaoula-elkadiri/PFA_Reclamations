import { useEffect, useState } from 'react';
import { adminService } from '../services/api';
import { UserPlus, Pencil, UserX, Check, X, User, ChevronDown } from 'lucide-react';

const ROLES = ['agent_service_client', 'superviseur', 'administrateur'];

function Badge({ disponible }) {
  return (
    <span style={{
      background: disponible ? '#dcfce7' : '#fee2e2',
      color: disponible ? '#166534' : '#991b1b',
      padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
    }}>
      {disponible ? 'Actif' : 'Désactivé'}
    </span>
  );
}

export default function AdminAgents() {
  const [agents, setAgents] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editAgent, setEditAgent] = useState(null);
  const [formData, setFormData] = useState({ nom: '', prenom: '', email: '', mot_de_passe: '', id_service: '', role: 'agent_service_client' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [reassignTarget, setReassignTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [a, s] = await Promise.all([adminService.getAgents(), adminService.getServices()]);
      setAgents(a);
      setServices(s);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditAgent(null);
    setFormData({ nom: '', prenom: '', email: '', mot_de_passe: '', id_service: services[0]?.id || '', role: 'agent_service_client' });
    setShowForm(true);
  };

  const openEdit = (agent) => {
    setEditAgent(agent);
    setFormData({
      nom: agent.nom, prenom: agent.prenom, email: agent.email,
      mot_de_passe: '', id_service: agent.service?.id || '',
      role: agent.role,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      if (editAgent) {
        const payload = {
          nom: formData.nom, prenom: formData.prenom, email: formData.email,
          id_service: parseInt(formData.id_service), role: formData.role,
        };
        if (formData.mot_de_passe) payload.nouveau_mot_de_passe = formData.mot_de_passe;
        await adminService.updateAgent(editAgent.id, payload);
        setMsg({ type: 'success', text: 'Agent mis à jour avec succès.' });
      } else {
        await adminService.createAgent({
          ...formData,
          id_service: parseInt(formData.id_service),
        });
        setMsg({ type: 'success', text: 'Agent créé avec succès.' });
      }
      setShowForm(false);
      load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Erreur lors de la sauvegarde' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (agent) => {
    if (!window.confirm(`Désactiver ${agent.prenom} ${agent.nom} ?`)) return;
    try {
      await adminService.deactivateAgent(agent.id);
      setMsg({ type: 'success', text: `${agent.prenom} ${agent.nom} désactivé.` });
      load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Erreur' });
    }
  };

  if (loading) return <div className="container"><p style={{ color: '#6b7280', paddingTop: 40 }}>Chargement...</p></div>;

  return (
    <div className="container" style={{ paddingTop: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' }}>Gestion des agents</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>{agents.length} agent(s) dans le système</p>
        </div>
        <button onClick={openCreate} style={{
          display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px',
          background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff',
          border: 'none', borderRadius: 9, cursor: 'pointer', fontWeight: 600, fontSize: 14,
        }}>
          <UserPlus size={16} /> Nouvel agent
        </button>
      </div>

      {msg && (
        <div style={{
          background: msg.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: msg.type === 'success' ? '#166534' : '#991b1b',
          padding: '10px 16px', borderRadius: 8, marginBottom: 20, fontSize: 14,
        }}>
          {msg.type === 'success' ? <Check size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} /> : <X size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />}
          {msg.text}
        </div>
      )}

      {/* Formulaire création/édition */}
      {showForm && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', marginBottom: 24, border: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: '0 0 20px', color: '#1f2937' }}>
            {editAgent ? `Modifier : ${editAgent.prenom} ${editAgent.nom}` : 'Créer un nouvel agent'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              {[['Nom', 'nom'], ['Prénom', 'prenom'], ['Email', 'email'], [editAgent ? 'Nouveau mot de passe (laisser vide = inchangé)' : 'Mot de passe *', 'mot_de_passe']].map(([label, key]) => (
                <div key={key} className="form-group">
                  <label style={{ fontSize: 13, color: '#374151', marginBottom: 5, display: 'block' }}>{label}</label>
                  <input
                    type={key === 'mot_de_passe' ? 'password' : key === 'email' ? 'email' : 'text'}
                    value={formData[key]}
                    onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                    required={key !== 'mot_de_passe' || !editAgent}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>
              ))}
              <div className="form-group">
                <label style={{ fontSize: 13, color: '#374151', marginBottom: 5, display: 'block' }}>Service</label>
                <select value={formData.id_service} onChange={e => setFormData({ ...formData, id_service: e.target.value })} required
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}>
                  <option value="">-- Choisir --</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label style={{ fontSize: 13, color: '#374151', marginBottom: 5, display: 'block' }}>Rôle</label>
                <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" disabled={saving} style={{ padding: '9px 20px', background: '#667eea', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                {saving ? 'Enregistrement...' : editAgent ? 'Mettre à jour' : 'Créer'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '9px 20px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tableau des agents */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['Agent', 'Email', 'Service', 'Rôle', 'Réclamations', 'Statut', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#6b7280', fontWeight: 600, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {agents.map(a => (
              <tr key={a.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={16} color="#fff" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#1f2937' }}>{a.prenom} {a.nom}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 16px', color: '#6b7280' }}>{a.email}</td>
                <td style={{ padding: '12px 16px', color: '#374151' }}>{a.service?.nom || '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ background: a.role === 'administrateur' ? '#fef3c7' : '#f3f4f6', color: a.role === 'administrateur' ? '#92400e' : '#374151', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
                    {a.role}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: '#667eea' }}>{a.nb_reclamations}</td>
                <td style={{ padding: '12px 16px' }}><Badge disponible={a.disponible} /></td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => openEdit(a)} title="Modifier" style={{ background: '#f0f0ff', border: 'none', borderRadius: 7, padding: '6px 8px', cursor: 'pointer', color: '#667eea' }}>
                      <Pencil size={14} />
                    </button>
                    {a.disponible && a.role !== 'administrateur' && (
                      <button onClick={() => handleDeactivate(a)} title="Désactiver" style={{ background: '#fff0f0', border: 'none', borderRadius: 7, padding: '6px 8px', cursor: 'pointer', color: '#fc8181' }}>
                        <UserX size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
