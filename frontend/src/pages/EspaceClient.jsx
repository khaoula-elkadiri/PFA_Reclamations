import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, Bell, FileText, PlusCircle } from 'lucide-react';

export default function EspaceClient() {
  const { clientUser } = useAuth();

  return (
    <div className="container" style={{ paddingTop: '40px' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1f2937' }}>
          Bonjour, {clientUser?.prenom} {clientUser?.nom}
        </h1>
        <p style={{ color: '#6b7280', marginTop: '6px' }}>
          Que souhaitez-vous faire ?
        </p>
      </div>

      <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <Link to="/rechercher" className="card card-primary" style={{ textDecoration: 'none' }}>
          <Search size={44} />
          <h2>Déposer une réclamation</h2>
          <p>Recherchez votre commande et soumettez une réclamation</p>
          <span className="card-arrow">→</span>
        </Link>

        <Link to="/suivi" className="card" style={{ textDecoration: 'none' }}>
          <Bell size={44} />
          <h2>Suivre une réclamation</h2>
          <p>Consultez l'état d'avancement par numéro de dossier</p>
          <span className="card-arrow">→</span>
        </Link>

        <Link to="/mes-reclamations" className="card" style={{ textDecoration: 'none', borderLeft: '4px solid #667eea' }}>
          <FileText size={44} />
          <h2>Mes réclamations</h2>
          <p>Consultez toutes vos réclamations et les réponses des agents</p>
          <span className="card-arrow">→</span>
        </Link>
      </div>
    </div>
  );
}
