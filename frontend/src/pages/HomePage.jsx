import { Link } from 'react-router-dom';
import { Search, BarChart3, Bell } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="container">
      <div className="hero">
        <h1>🎯 Système Intelligent de Gestion des Réclamations</h1>
        <p>Recherchez votre commande, suivez son statut, et déposez une réclamation si nécessaire. Notre IA traite automatiquement votre demande.</p>
      </div>
      
      <div className="cards-grid">
        <Link to="/rechercher" className="card card-primary">
          <Search size={48} />
          <h2>Rechercher ma commande</h2>
          <p>Consultez votre commande et faites une réclamation si besoin</p>
          <span className="card-arrow">→</span>
        </Link>
        
        <Link to="/suivi" className="card">
          <Bell size={48} />
          <h2>Suivre ma réclamation</h2>
          <p>Consultez l'état d'avancement de votre réclamation</p>
          <span className="card-arrow">→</span>
        </Link>
        
        <Link to="/dashboard" className="card card-admin">
          <BarChart3 size={48} />
          <h2>Tableau de bord</h2>
          <p>Vue d'ensemble (administration)</p>
          <span className="card-arrow">→</span>
        </Link>
      </div>

      <div className="info-cards">
        <div className="info-card">
          <h3>🤖 Intelligence Artificielle</h3>
          <p>Votre réclamation est analysée automatiquement par notre IA pour un traitement rapide.</p>
        </div>
        <div className="info-card">
          <h3>⚡ Traitement rapide</h3>
          <p>La réclamation est routée directement vers le bon service.</p>
        </div>
        <div className="info-card">
          <h3>🔔 Notifications</h3>
          <p>Recevez des mises à jour à chaque étape du traitement.</p>
        </div>
      </div>
    </div>
  );
}