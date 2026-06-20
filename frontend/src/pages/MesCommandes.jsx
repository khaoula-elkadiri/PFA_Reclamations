import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Package, Truck, Calendar, AlertCircle, RefreshCw, FileText } from 'lucide-react';

const STATUT_COLORS = {
  livree: { bg: '#dcfce7', color: '#166534', label: 'Livrée' },
  expediee: { bg: '#dbeafe', color: '#1e40af', label: 'Expédiée' },
  en_preparation: { bg: '#fef3c7', color: '#92400e', label: 'En préparation' },
  en_retard: { bg: '#fee2e2', color: '#991b1b', label: 'En retard' },
  en_transit: { bg: '#ede9fe', color: '#5b21b6', label: 'En transit' },
  echec_livraison: { bg: '#fee2e2', color: '#7f1d1d', label: 'Échec livraison' },
  annulee: { bg: '#f3f4f6', color: '#4b5563', label: 'Annulée' },
};

function StatutBadge({ statut }) {
  const style = STATUT_COLORS[statut] || { bg: '#f3f4f6', color: '#4b5563', label: statut };
  return (
    <span style={{
      background: style.bg, color: style.color,
      padding: '3px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600,
    }}>
      {style.label}
    </span>
  );
}

export default function MesCommandes() {
  const { clientUser } = useAuth();
  const navigate = useNavigate();
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const charger = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await clientService.getMesCommandes();
      setCommandes(data);
    } catch (err) {
      setError("Impossible de charger vos commandes. Vérifiez que le serveur est démarré.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(); }, []);

  const handleReclamer = (commande) => {
    navigate('/soumettre', {
      state: { commande, retourRecherche: '/mes-commandes' }
    });
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: '#1f2937' }}>
            Mes Commandes
          </h1>
          <p style={{ margin: '6px 0 0', color: '#6b7280' }}>
            {clientUser?.prenom} {clientUser?.nom} — sélectionnez une commande pour déposer une réclamation.
          </p>
        </div>
        <button
          onClick={charger}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 14 }}
        >
          <RefreshCw size={15} /> Actualiser
        </button>
      </div>

      {error && (
        <div className="error-box" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={20} />
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
          Chargement de vos commandes...
        </div>
      ) : commandes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
          <Package size={48} color="#d1d5db" style={{ marginBottom: 16 }} />
          <h3 style={{ color: '#374151', margin: '0 0 8px' }}>Aucune commande trouvée</h3>
          <p style={{ color: '#6b7280', margin: 0, maxWidth: 380, marginInline: 'auto' }}>
            Aucune commande n'est associée à votre compte (<strong>{clientUser?.email}</strong>).
            Contactez le support si vous pensez qu'il s'agit d'une erreur.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {commandes.map((cmd) => (
            <div key={cmd.id_commande} style={{
              background: '#fff', borderRadius: 12, padding: '20px 24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.07)', border: '1px solid #f3f4f6',
            }}>
              {/* En-tête commande */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Package size={20} color="#667eea" />
                  <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1f2937' }}>
                    Commande #{cmd.numero_commande}
                  </h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <StatutBadge statut={cmd.statut_commande} />
                  <span style={{ color: '#9ca3af', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={13} />
                    {new Date(cmd.date_commande).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>

              {/* Articles */}
              <div style={{ marginBottom: 12 }}>
                <p style={{ margin: '0 0 6px', fontSize: 13, color: '#6b7280', fontWeight: 600 }}>
                  Articles ({cmd.articles.length})
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {cmd.articles.map((art, idx) => (
                    <div key={idx} style={{
                      background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8,
                      padding: '5px 12px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <strong>{art.nom_article}</strong>
                      <span style={{ color: '#9ca3af' }}>×{art.quantite}</span>
                      {art.est_perissable && <span style={{ background: '#fef3c7', color: '#92400e', borderRadius: 4, padding: '1px 6px', fontSize: 11 }}>Périssable</span>}
                      {art.est_fragile && <span style={{ background: '#dbeafe', color: '#1e40af', borderRadius: 4, padding: '1px 6px', fontSize: 11 }}>Fragile</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Livraison */}
              {cmd.livraison && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#6b7280' }}>
                    <Truck size={14} /> {cmd.livraison.transporteur || 'Transporteur inconnu'}
                  </span>
                  {cmd.livraison.date_livraison_prevue && (
                    <span style={{ fontSize: 13, color: '#6b7280' }}>
                      Livraison prévue : <strong>{new Date(cmd.livraison.date_livraison_prevue).toLocaleDateString('fr-FR')}</strong>
                    </span>
                  )}
                  <StatutBadge statut={cmd.livraison.statut_livraison} />
                </div>
              )}

              {/* Pied de carte */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #f3f4f6' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937' }}>
                  {cmd.montant_total.toFixed(2)} €
                </span>
                <button
                  onClick={() => handleReclamer(cmd)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    color: '#fff', border: 'none', borderRadius: 8,
                    padding: '9px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  <FileText size={16} /> Déposer une réclamation
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
