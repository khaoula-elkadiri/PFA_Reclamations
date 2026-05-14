import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { dashboardService, reclamationService } from '../services/api';

export default function ServiceDashboard() {
  const { nomService } = useParams();
  const [reclamations, setReclamations] = useState([]);

  useEffect(() => {
    loadData();
  }, [nomService]);

  const loadData = async () => {
    try {
      const data = await dashboardService.getByService(nomService);
      setReclamations(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatut = async (id, statut) => {
    try {
      await reclamationService.updateStatut(id, statut);
      loadData();
    } catch (err) {
      alert('Erreur lors de la mise à jour');
    }
  };

  return (
    <div className="container">
      <h1>Service : {nomService}</h1>
      
      <div className="reclamations-list">
        {reclamations.map(rec => (
          <div key={rec.id_reclamation} className="reclamation-card">
            <div className="card-header">
              <h3>Réclamation #{rec.id_reclamation}</h3>
              <span className={`badge badge-${rec.priorite_detectee}`}>
                {rec.priorite_detectee}
              </span>
            </div>
            <p><strong>Catégorie :</strong> {rec.classification_detectee}</p>
            <p><strong>Statut :</strong> {rec.statut_reclamation}</p>
            <p className="description">{rec.description}</p>
            <div className="card-actions">
              <button 
                onClick={() => handleUpdateStatut(rec.id_reclamation, 'en_traitement')}
                className="btn-secondary"
              >
                En traitement
              </button>
              <button 
                onClick={() => handleUpdateStatut(rec.id_reclamation, 'resolue')}
                className="btn-success"
              >
                Marquer résolue
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}