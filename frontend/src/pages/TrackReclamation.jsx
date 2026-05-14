import { useState } from 'react';
import { reclamationService } from '../services/api';
import { Search } from 'lucide-react';

export default function TrackReclamation() {
  const [id, setId] = useState('');
  const [reclamation, setReclamation] = useState(null);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const data = await reclamationService.getById(id);
      setReclamation(data);
    } catch (err) {
      setError('Réclamation introuvable');
      setReclamation(null);
    }
  };

  return (
    <div className="container">
      <h1>Suivre ma réclamation</h1>
      
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="number"
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="Numéro de réclamation"
          required
        />
        <button type="submit" className="btn-primary">
          <Search size={18} /> Rechercher
        </button>
      </form>

      {error && <div className="error-box">{error}</div>}

      {reclamation && (
        <div className="reclamation-detail">
          <h2>Réclamation #{reclamation.id_reclamation}</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Statut</label>
              <span className={`status status-${reclamation.statut_reclamation}`}>
                {reclamation.statut_reclamation}
              </span>
            </div>
            <div className="detail-item">
              <label>Catégorie</label>
              <span>{reclamation.classification_detectee}</span>
            </div>
            <div className="detail-item">
              <label>Priorité</label>
              <span className={`badge badge-${reclamation.priorite_detectee}`}>
                {reclamation.priorite_detectee}
              </span>
            </div>
            <div className="detail-item">
              <label>Service en charge</label>
              <span>{reclamation.service_destinataire}</span>
            </div>
          </div>
          <div className="description-box">
            <h3>Description</h3>
            <p>{reclamation.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}