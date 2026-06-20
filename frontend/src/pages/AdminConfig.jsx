import { useEffect, useState } from 'react';
import { adminService } from '../services/api';
import { Settings, Save, RefreshCw, Info, Check, X } from 'lucide-react';

const DESCRIPTIONS_FR = {
  seuil_complexite: { label: 'Seuil de complexité (%)', hint: 'Si la confiance IA est inférieure à ce seuil, la réclamation est marquée comme complexe et envoyée vers le service client pour revue humaine.' },
  seuil_priorite_critique: { label: 'Score → priorité CRITIQUE', hint: 'Score de priorité minimum pour déclencher la priorité critique (traitement immédiat).' },
  seuil_priorite_elevee: { label: 'Score → priorité ÉLEVÉE', hint: 'Score de priorité minimum pour déclencher la priorité élevée.' },
  seuil_priorite_moyenne: { label: 'Score → priorité MOYENNE', hint: 'Score de priorité minimum pour déclencher la priorité moyenne.' },
  notifications_actives: { label: 'Notifications automatiques', hint: 'Si activé, un email/notification est envoyé au client après chaque changement de statut de sa réclamation.' },
  longueur_min_description: { label: 'Longueur min. description (caractères)', hint: 'Nombre minimum de caractères requis dans la description d\'une réclamation.' },
};

const SECTION_LABELS = {
  ia: { label: 'Paramètres IA', keys: ['seuil_complexite'] },
  priorite: { label: 'Seuils de priorité', keys: ['seuil_priorite_critique', 'seuil_priorite_elevee', 'seuil_priorite_moyenne'] },
  systeme: { label: 'Système général', keys: ['notifications_actives', 'longueur_min_description'] },
};

export default function AdminConfig() {
  const [configs, setConfigs] = useState([]);
  const [edits, setEdits] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [msgs, setMsgs] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminService.getConfig();
      setConfigs(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const getValue = (cle) => {
    if (cle in edits) return edits[cle];
    const c = configs.find(x => x.cle === cle);
    return c ? c.valeur : '';
  };

  const handleChange = (cle, val) => {
    setEdits(prev => ({ ...prev, [cle]: val }));
    setMsgs(prev => ({ ...prev, [cle]: null }));
  };

  const handleSave = async (cle) => {
    setSaving(prev => ({ ...prev, [cle]: true }));
    try {
      await adminService.updateConfig(cle, getValue(cle));
      setMsgs(prev => ({ ...prev, [cle]: { type: 'success', text: 'Sauvegardé' } }));
      const updated = configs.map(c => c.cle === cle ? { ...c, valeur: getValue(cle) } : c);
      setConfigs(updated);
      setEdits(prev => { const n = { ...prev }; delete n[cle]; return n; });
    } catch (err) {
      setMsgs(prev => ({ ...prev, [cle]: { type: 'error', text: err.response?.data?.detail || 'Erreur' } }));
    } finally {
      setSaving(prev => ({ ...prev, [cle]: false }));
    }
  };

  if (loading) return <div className="container"><p style={{ color: '#6b7280', paddingTop: 40 }}>Chargement...</p></div>;

  return (
    <div className="container" style={{ paddingTop: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' }}>
            <Settings size={22} style={{ verticalAlign: 'middle', marginRight: 8, color: '#f6ad55' }} />
            Configuration du système
          </h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>Paramètres de l'IA, des seuils de priorité et du système en général</p>
        </div>
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 14 }}>
          <RefreshCw size={15} /> Recharger
        </button>
      </div>

      {/* Bandeau info */}
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '12px 16px', marginBottom: 24, display: 'flex', gap: 10, fontSize: 14, color: '#1e40af' }}>
        <Info size={18} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>Les modifications sont appliquées immédiatement. Le modèle IA lui-même (fichier .pkl) n'est pas modifié — seuls les seuils de décision changent.</span>
      </div>

      {Object.entries(SECTION_LABELS).map(([sectionKey, section]) => (
        <div key={sectionKey} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', marginBottom: 20, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6', background: '#f9fafb' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#374151', fontWeight: 600 }}>{section.label}</h3>
          </div>

          <div style={{ padding: '8px 0' }}>
            {section.keys.map(cle => {
              const meta = DESCRIPTIONS_FR[cle] || { label: cle, hint: '' };
              const val = getValue(cle);
              const isEdited = cle in edits;
              const isBool = val === 'true' || val === 'false';
              const msg = msgs[cle];

              return (
                <div key={cle} style={{ padding: '16px 20px', borderBottom: '1px solid #f9fafb' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontWeight: 600, color: '#1f2937', fontSize: 14, marginBottom: 4 }}>
                        {meta.label}
                      </label>
                      <p style={{ margin: '0 0 10px', fontSize: 13, color: '#6b7280' }}>{meta.hint}</p>

                      {isBool ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          {['true', 'false'].map(opt => (
                            <button
                              key={opt}
                              onClick={() => handleChange(cle, opt)}
                              style={{
                                padding: '6px 18px', borderRadius: 8, border: '1px solid',
                                borderColor: val === opt ? '#667eea' : '#d1d5db',
                                background: val === opt ? '#667eea' : '#fff',
                                color: val === opt ? '#fff' : '#374151',
                                cursor: 'pointer', fontWeight: 500, fontSize: 14,
                              }}
                            >
                              {opt === 'true' ? 'Activé' : 'Désactivé'}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <input
                            type="number"
                            value={val}
                            onChange={e => handleChange(cle, e.target.value)}
                            style={{
                              width: 100, padding: '7px 12px', border: `1px solid ${isEdited ? '#667eea' : '#d1d5db'}`,
                              borderRadius: 8, fontSize: 15, fontWeight: 600, color: '#1f2937',
                              outline: 'none',
                            }}
                          />
                          {cle.includes('seuil') && !cle.includes('longueur') && (
                            <span style={{ fontSize: 13, color: '#9ca3af' }}>
                              {cle.includes('complexite') ? '% de confiance' : 'points de score'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                      <button
                        onClick={() => handleSave(cle)}
                        disabled={saving[cle] || (!isEdited && !isBool)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '7px 14px', borderRadius: 8, border: 'none',
                          background: isEdited || isBool ? '#667eea' : '#f3f4f6',
                          color: isEdited || isBool ? '#fff' : '#9ca3af',
                          cursor: isEdited || isBool ? 'pointer' : 'default',
                          fontWeight: 500, fontSize: 13,
                        }}
                      >
                        <Save size={13} /> {saving[cle] ? 'Enr...' : 'Sauvegarder'}
                      </button>

                      {msg && (
                        <span style={{
                          fontSize: 12, fontWeight: 600,
                          color: msg.type === 'success' ? '#48bb78' : '#fc8181',
                          display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                          {msg.type === 'success' ? <Check size={12} /> : <X size={12} />} {msg.text}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Tableau récapitulatif */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6', background: '#f9fafb' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#374151' }}>Toutes les configurations</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['Clé', 'Valeur', 'Dernière modification'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#6b7280', fontWeight: 600, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {configs.map(c => (
              <tr key={c.cle} style={{ borderTop: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 16px', fontFamily: 'monospace', color: '#667eea', fontSize: 12 }}>{c.cle}</td>
                <td style={{ padding: '10px 16px', fontWeight: 600, color: '#1f2937' }}>{c.valeur}</td>
                <td style={{ padding: '10px 16px', color: '#9ca3af' }}>
                  {c.date_maj ? new Date(c.date_maj).toLocaleString('fr-FR') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
