import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, UserCheck } from 'lucide-react';
import { agentService } from '../services/api';

const AGENTS = [
  { id: 1, label: 'Agent Transport', service: 'Transport' },
  { id: 2, label: 'Agent Qualite', service: 'Qualite' },
  { id: 3, label: 'Agent Stock', service: 'Stock' }
];

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString();
}

function formatConfidence(value) {
  const score = Number(value);
  if (Number.isNaN(score)) return '-';
  return `${score.toFixed(1)}%`;
}

export default function AgentReclamations() {
  const [selectedAgentId, setSelectedAgentId] = useState(1);
  const [reclamations, setReclamations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const selectedAgent = AGENTS.find(agent => agent.id === selectedAgentId);

  const loadReclamations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await agentService.getReclamations(selectedAgentId);
      setReclamations(data);
    } catch (err) {
      console.error(err);
      setError("Impossible de charger les reclamations de cet agent.");
      setReclamations([]);
    } finally {
      setLoading(false);
    }
  }, [selectedAgentId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadReclamations();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadReclamations]);

  return (
    <div className="container">
      <div className="agent-page-header">
        <div>
          <h1>Interface Agent</h1>
          <p>Consultation des reclamations affectees par service.</p>
        </div>
        <button type="button" className="btn-secondary" onClick={loadReclamations}>
          <RefreshCw size={18} /> Actualiser
        </button>
      </div>

      <div className="agent-selector">
        {AGENTS.map(agent => (
          <button
            key={agent.id}
            type="button"
            className={selectedAgentId === agent.id ? 'agent-tab active' : 'agent-tab'}
            onClick={() => setSelectedAgentId(agent.id)}
          >
            <UserCheck size={18} />
            <span>{agent.label}</span>
            <small>{agent.service}</small>
          </button>
        ))}
      </div>

      <div className="agent-summary">
        <div>
          <span>Agent selectionne</span>
          <strong>{selectedAgent?.label}</strong>
        </div>
        <div>
          <span>Service</span>
          <strong>{selectedAgent?.service}</strong>
        </div>
        <div>
          <span>Reclamations affectees</span>
          <strong>{reclamations.length}</strong>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      {loading ? (
        <div className="agent-empty">Chargement des reclamations...</div>
      ) : reclamations.length === 0 ? (
        <div className="agent-empty">
          Aucune reclamation affectee a cet agent pour le moment.
        </div>
      ) : (
        <div className="agent-table-wrapper">
          <table className="data-table agent-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Client</th>
                <th>Description</th>
                <th>Categorie</th>
                <th>Priorite</th>
                <th>Statut reclamation</th>
                <th>Statut affectation</th>
                <th>Confiance</th>
                <th>Complexite</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {reclamations.map(rec => (
                <tr key={rec.id_affectation}>
                  <td>#{rec.id_reclamation}</td>
                  <td>
                    <strong>
                      {rec.client ? `${rec.client.prenom} ${rec.client.nom}` : 'Client inconnu'}
                    </strong>
                  </td>
                  <td className="agent-description">{rec.description}</td>
                  <td>{rec.classification_detectee}</td>
                  <td>
                    <span className={`badge badge-${rec.priorite_detectee}`}>
                      {rec.priorite_detectee}
                    </span>
                  </td>
                  <td>
                    <span className={`status status-${rec.statut_reclamation}`}>
                      {rec.statut_reclamation}
                    </span>
                  </td>
                  <td>
                    <span className={`agent-status agent-status-${rec.statut_affectation}`}>
                      {rec.statut_affectation}
                    </span>
                  </td>
                  <td>{formatConfidence(rec.score_confiance)}</td>
                  <td>
                    {rec.est_complexe ? (
                      <span className="badge-complexe">Complexe</span>
                    ) : (
                      <span className="badge-simple">Simple</span>
                    )}
                  </td>
                  <td>{formatDate(rec.date_creation)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
