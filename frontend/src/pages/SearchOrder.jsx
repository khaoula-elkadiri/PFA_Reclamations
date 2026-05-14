import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { commandeService } from '../services/api';
import { Search, Package, Calendar, Truck, MapPin, AlertCircle } from 'lucide-react';

export default function SearchOrder() {
  const [numeroCommande, setNumeroCommande] = useState('');
  const [commande, setCommande] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    setError(null);
    setCommande(null);
    setLoading(true);
    
    try {
      const data = await commandeService.rechercher(numeroCommande);
      setCommande(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const handleReclamer = () => {
    // On passe les infos de la commande à la page de réclamation
    navigate('/soumettre', { state: { commande } });
  };

  const getStatusColor = (statut) => {
    const colors = {
      'livree': '#22c55e',
      'expediee': '#3b82f6',
      'en_preparation': '#f59e0b',
      'en_retard': '#ef4444',
      'en_transit': '#8b5cf6',
      'echec_livraison': '#dc2626',
      'annulee': '#6b7280'
    };
    return colors[statut] || '#6b7280';
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Rechercher ma commande</h1>
        <p>Entrez votre numéro de commande pour consulter les détails et faire une réclamation si nécessaire.</p>
      </div>
      
      <form onSubmit={handleSearch} className="search-form-large">
        <div className="search-input-group">
          <Search size={20} />
          <input
            type="text"
            value={numeroCommande}
            onChange={(e) => setNumeroCommande(e.target.value)}
            placeholder="Numéro de commande (ex: CMD001)"
            required
          />
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Recherche...' : 'Rechercher'}
          </button>
        </div>
      </form>

      {error && (
        <div className="error-box">
          <AlertCircle size={24} />
          <p>{error}</p>
        </div>
      )}

      {commande && (
        <div className="order-card">
          <div className="order-header">
            <div>
              <h2>Commande #{commande.numero_commande}</h2>
              <p className="order-date">
                <Calendar size={16} /> 
                Date : {new Date(commande.date_commande).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <span 
              className="status-badge" 
              style={{ background: getStatusColor(commande.statut_commande) }}
            >
              {commande.statut_commande.replace('_', ' ')}
            </span>
          </div>

          {commande.client && (
            <div className="info-section">
              <h3>👤 Client</h3>
              <p><strong>{commande.client.prenom} {commande.client.nom}</strong></p>
              <p>📞 {commande.client.telephone}</p>
              {commande.client.email && <p>✉️ {commande.client.email}</p>}
            </div>
          )}

          <div className="info-section">
            <h3><Package size={20} /> Articles ({commande.articles.length})</h3>
            <div className="articles-list">
              {commande.articles.map((article, idx) => (
                <div key={idx} className="article-item">
                  <div>
                    <strong>{article.nom_article}</strong>
                    {article.categorie && <span className="category-tag">{article.categorie}</span>}
                  </div>
                  <div className="article-meta">
                    <span className="quantity">Quantité: {article.quantite}</span>
                    {article.est_perissable && <span className="tag tag-warning">Périssable</span>}
                    {article.est_fragile && <span className="tag tag-info">Fragile</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {commande.livraison && (
            <div className="info-section">
              <h3><Truck size={20} /> Livraison</h3>
              <div className="livraison-grid">
                <div>
                  <label>Numéro de suivi</label>
                  <p>{commande.livraison.numero_suivi}</p>
                </div>
                <div>
                  <label>Transporteur</label>
                  <p>{commande.livraison.transporteur || '-'}</p>
                </div>
                <div>
                  <label>Statut</label>
                  <p>
                    <span 
                      className="status-badge-small"
                      style={{ background: getStatusColor(commande.livraison.statut_livraison) }}
                    >
                      {commande.livraison.statut_livraison.replace('_', ' ')}
                    </span>
                  </p>
                </div>
                {commande.livraison.adresse_livraison && (
                  <div className="full-width">
                    <label><MapPin size={14} /> Adresse</label>
                    <p>{commande.livraison.adresse_livraison}</p>
                  </div>
                )}
                {commande.livraison.date_livraison_prevue && (
                  <div>
                    <label>Date prévue</label>
                    <p>{new Date(commande.livraison.date_livraison_prevue).toLocaleDateString('fr-FR')}</p>
                  </div>
                )}
                {commande.livraison.date_livraison_reelle && (
                  <div>
                    <label>Date réelle</label>
                    <p>{new Date(commande.livraison.date_livraison_reelle).toLocaleDateString('fr-FR')}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="order-summary">
            <div>
              <strong>Montant total</strong>
              <p className="amount">{commande.montant_total.toFixed(2)} €</p>
            </div>
            <button onClick={handleReclamer} className="btn-warning btn-large">
              🛠️ Faire une réclamation sur cette commande
            </button>
          </div>
        </div>
      )}
    </div>
  );
}