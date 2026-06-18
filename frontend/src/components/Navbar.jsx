import { Link } from 'react-router-dom';
import { Home, Search, Bell, BarChart3, Package, UserCheck } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <Package size={28} />
        <h1>Réclamations Logistiques</h1>
      </Link>
      <div className="navbar-links">
        <Link to="/"><Home size={18} /> Accueil</Link>
        <Link to="/rechercher"><Search size={18} /> Rechercher</Link>
        <Link to="/suivi"><Bell size={18} /> Suivi</Link>
        <Link to="/dashboard"><BarChart3 size={18} /> Dashboard</Link>
        <Link to="/agent"><UserCheck size={18} /> Agent</Link>
      </div>
    </nav>
  );
}
