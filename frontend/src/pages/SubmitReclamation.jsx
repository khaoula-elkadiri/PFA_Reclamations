import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { reclamationService } from '../services/api';
import { CheckCircle, AlertCircle, ArrowLeft, Package, Brain, Users } from 'lucide-react';

const LABEL_CATEGORIES = {
  retard_livraison: 'Retard de livraison',
  produit_casse: 'Produit cassé / abîmé',
  erreur_picking: 'Erreur de picking',
  article_manquant: 'Article manquant',
  mauvaise_qualite: 'Mauvaise qualité',
  probleme_transport: 'Problème de transport',
  erreur_administrative: 'Erreur administrative',
  autre: 'Autre',
};

export default function SubmitReclamation() {
  const location = useLocation();
  const navigate = useNavigate();
  const commandeRecue = location.state?.commande;
  const retourRecherche = commandeRecue
    ? (location.state?.retourRecherche || `/rechercher?numero=${encodeURIComponent(commandeRecue.numero_commande)}`)
    : '/rechercher';

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    numero_commande: '',
    description: '',
    articles: [''],
    quantites: [1]
  });
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Pré-remplir depuis les données de la commande sélectionnée
  useEffect(() => {
    if (commandeRecue) {
      setFormData({
        // Utiliser les infos du client lié à la commande (pour que le matcher_commande fonctionne)
        nom: commandeRecue.client?.nom || '',
        prenom: commandeRecue.client?.prenom || '',
        telephone: commandeRecue.client?.telephone || '',
        email: commandeRecue.client?.email || '',
        numero_commande: commandeRecue.numero_commande || '',
        description: '',
        articles: commandeRecue.articles?.map(a => a.nom_article) || [''],
        quantites: commandeRecue.articles?.map(a => a.quantite) || [1]
      });
    }
  }, [commandeRecue]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await reclamationService.creer(formData);
      setResult(response);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la soumission');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    const confiance = Number(result.score_confiance);
    const barColor = confiance >= 70 ? '#48bb78' : confiance >= 40 ? '#f6ad55' : '#fc8181';
    return (
      <div className="container">
        <div className="success-box">
          <CheckCircle size={56} color="#22c55e" />
          <h2>Réclamation #{result.id_reclamation} enregistrée</h2>

          {/* Bloc analyse IA */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea15, #764ba215)',
            border: '1px solid #667eea30',
            borderRadius: 12, padding: '20px 24px', margin: '16px 0', width: '100%', boxSizing: 'border-box',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Brain size={18} color="#667eea" />
              <span style={{ fontWeight: 600, color: '#667eea', fontSize: 14 }}>Analyse IA</span>
            </div>
            <div className="result-details">
              <div className="result-row">
                <span>Catégorie détectée</span>
                <strong>{LABEL_CATEGORIES[result.classification_detectee] || result.classification_detectee}</strong>
              </div>
              <div className="result-row">
                <span>Confiance du modèle</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, justifyContent: 'flex-end' }}>
                  <div style={{ background: '#e5e7eb', borderRadius: 4, height: 8, width: 100 }}>
                    <div style={{ background: barColor, borderRadius: 4, height: '100%', width: `${Math.min(confiance, 100)}%` }} />
                  </div>
                  <strong style={{ color: barColor, minWidth: 45 }}>{confiance.toFixed(1)}%</strong>
                </div>
              </div>
              {result.est_complexe && (
                <div className="result-row">
                  <span>Complexité</span>
                  <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 10px', borderRadius: 12, fontSize: 13, fontWeight: 600 }}>
                    ⚠ Cas complexe — revue manuelle
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="result-details">
            <div className="result-row">
              <span><Users size={14} style={{ verticalAlign: 'middle' }} /> Service en charge</span>
              <strong>{result.service_destinataire}</strong>
            </div>
          </div>

          <div className="message-box" style={{ marginTop: 12 }}>{result.message}</div>

          <div className="action-buttons">
            <button onClick={() => navigate('/suivi')} className="btn-secondary">
              Voir le suivi
            </button>
            <button onClick={() => navigate('/mes-reclamations')} className="btn-primary">
              Mes réclamations
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <Link
        to={retourRecherche}
        state={commandeRecue ? { commande: commandeRecue } : undefined}
        className="back-link"
      >
        <ArrowLeft size={18} /> Retour à la recherche
      </Link>

      <h1>Déposer une réclamation</h1>
      
      {commandeRecue && (
        <div className="info-banner">
          <Package size={24} />
          <div>
            <strong>Commande #{commandeRecue.numero_commande}</strong>
            {commandeRecue.articles?.length > 0 && (
              <p style={{ margin: '4px 0 0' }}>
                {commandeRecue.articles.map(a => `${a.nom_article} ×${a.quantite}`).join(' · ')}
              </p>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="error-box">
          <AlertCircle size={24} />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="form">
        {/* Champs client : visibles seulement si on n'a pas de commande pré-sélectionnée */}
        {!commandeRecue ? (
          <>
            <div className="form-section">
              <h3>Informations client</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Nom *</label>
                  <input type="text" name="nom" value={formData.nom} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Prénom *</label>
                  <input type="text" name="prenom" value={formData.prenom} onChange={handleChange} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Téléphone *</label>
                  <input type="tel" name="telephone" value={formData.telephone} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} />
                </div>
              </div>
            </div>
            <div className="form-section">
              <h3>Numéro de commande</h3>
              <div className="form-group">
                <input type="text" name="numero_commande" value={formData.numero_commande} onChange={handleChange} placeholder="Ex: CMD001" required />
              </div>
            </div>
          </>
        ) : (
          /* Champs cachés pour le matching backend quand commande pré-sélectionnée */
          <>
            <input type="hidden" name="nom" value={formData.nom} />
            <input type="hidden" name="prenom" value={formData.prenom} />
            <input type="hidden" name="telephone" value={formData.telephone} />
            <input type="hidden" name="email" value={formData.email} />
            <input type="hidden" name="numero_commande" value={formData.numero_commande} />
          </>
        )}

        <div className="form-section">
          <h3>Décrivez votre problème</h3>
          <div className="form-group">
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="8"
              placeholder="Décrivez précisément le problème rencontré : retard, produit cassé, mauvaise qualité, article manquant, erreur de livraison, etc."
              required
              minLength="10"
            />
            <small>Soyez le plus précis possible — le modèle IA analysera votre texte pour classifier et router votre réclamation automatiquement.</small>
          </div>
        </div>

        <button type="submit" className="btn-primary btn-large" disabled={loading}>
          {loading ? '⏳ Envoi en cours...' : ' Envoyer la réclamation'}
        </button>
      </form>
    </div>
  );
}
