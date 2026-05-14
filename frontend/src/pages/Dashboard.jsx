import { useState, useEffect } from 'react';
import { dashboardService, reclamationService } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [reclamations, setReclamations] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, recsData] = await Promise.all([
        dashboardService.getStats(),
        reclamationService.getAll()
      ]);
      setStats(statsData);
      setReclamations(recsData);
    } catch (err) {
      console.error(err);
    }
  };

  if (!stats) return <div className="container">Chargement...</div>;

  return (
    <div className="container">
      <h1>Tableau de bord</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total</h3>
          <p className="stat-number">{stats.total_reclamations}</p>
        </div>
        <div className="stat-card stat-warning">
          <h3>En attente</h3>
          <p className="stat-number">{stats.en_attente}</p>
        </div>
        <div className="stat-card stat-info">
          <h3>En traitement</h3>
          <p className="stat-number">{stats.en_traitement}</p>
        </div>
        <div className="stat-card stat-success">
          <h3>Résolues</h3>
          <p className="stat-number">{stats.resolues}</p>
        </div>
      </div>

      <h2>Réclamations récentes</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Catégorie</th>
            <th>Priorité</th>
            <th>Service</th>
            <th>Statut</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {reclamations.slice(0, 20).map(rec => (
            <tr key={rec.id_reclamation}>
              <td>#{rec.id_reclamation}</td>
              <td>{rec.classification_detectee}</td>
              <td>
                <span className={`badge badge-${rec.priorite_detectee}`}>
                  {rec.priorite_detectee}
                </span>
              </td>
              <td>{rec.service_destinataire}</td>
              <td>{rec.statut_reclamation}</td>
              <td>{new Date(rec.date_creation).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}