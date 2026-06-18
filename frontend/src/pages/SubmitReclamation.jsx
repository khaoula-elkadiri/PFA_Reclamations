import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { reclamationService } from '../services/api';
import { CheckCircle, AlertCircle, ArrowLeft, Package } from 'lucide-react';

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

  // Pré-remplir le formulaire si on vient de la page recherche commande
  useEffect(() => {
    if (commandeRecue) {
      setFormData({
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
    return (
      <div className="container">
        <div className="success-box">
          <CheckCircle size={64} color="#22c55e" />
          <h2>Réclamation envoyée avec succès !</h2>
          <div className="result-details">
            <div className="result-row">
              <span>Numéro de réclamation</span>
              <strong>#{result.id_reclamation}</strong>
            </div>
            <div className="result-row">
              <span>Statut</span>
              <strong>{result.statut_reclamation}</strong>
            </div>
            <div className="result-row">
              <span>Catégorie détectée</span>
              <strong>{result.classification_detectee}</strong>
            </div>
            <div className="result-row">
              <span>Priorité</span>
              <span className={`badge badge-${result.priorite_detectee}`}>
                {result.priorite_detectee}
              </span>
            </div>
            <div className="result-row">
              <span>Service en charge</span>
              <strong>{result.service_destinataire}</strong>
            </div>
            <div className="result-row">
              <span>Confiance IA</span>
              <strong>{result.score_confiance.toFixed(1)}%</strong>
            </div>
            <div className="message-box">{result.message}</div>
          </div>
          <div className="action-buttons">
            <button onClick={() => navigate('/suivi')} className="btn-secondary">
              Voir le suivi
            </button>
            <button onClick={() => navigate('/')} className="btn-primary">
              Retour à l'accueil
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
            <strong>Réclamation sur la commande #{commandeRecue.numero_commande}</strong>
            <p>Les informations sont pré-remplies. Décrivez simplement votre problème ci-dessous.</p>
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
          <h3>Informations commande</h3>
          <div className="form-group">
            <label>Numéro de commande *</label>
            <input 
              type="text" 
              name="numero_commande" 
              value={formData.numero_commande} 
              onChange={handleChange} 
              placeholder="Ex: CMD001" 
              required 
              readOnly={!!commandeRecue}
              style={commandeRecue ? { background: '#f3f4f6' } : {}}
            />
          </div>

          {formData.articles[0] && (
            <div className="form-group">
              <label>Articles concernés</label>
              <div className="articles-summary">
                {formData.articles.map((article, idx) => article && (
                  <div key={idx} className="article-summary-item">
                    <span>{article}</span>
                    <span className="qty">×{formData.quantites[idx]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="form-section">
          <h3>Votre réclamation</h3>
          <div className="form-group">
            <label>Décrivez votre problème en détail *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="8"
              placeholder="Décrivez précisément le problème rencontré : retard, produit cassé, mauvaise qualité, article manquant, erreur de livraison, etc."
              required
              minLength="10"
            />
            <small>Soyez le plus précis possible pour un meilleur traitement automatique.</small>
          </div>
        </div>

        <button type="submit" className="btn-primary btn-large" disabled={loading}>
          {loading ? '⏳ Envoi en cours...' : ' Envoyer la réclamation'}
        </button>
      </form>
    </div>
  );
}
