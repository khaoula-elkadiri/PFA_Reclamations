import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { dashboardService, reclamationService } from '../services/api';
import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';

const LABEL_CATEGORIES = {
  retard_livraison: 'Retard livraison',
  produit_casse: 'Produit cassé',
  erreur_picking: 'Erreur picking',
  article_manquant: 'Article manquant',
  mauvaise_qualite: 'Mauvaise qualité',
  probleme_transport: 'Prob. transport',
  erreur_administrative: 'Erreur admin.',
  autre: 'Autre',
};

const COLORS_PRIO = { critique: '#fc8181', elevee: '#f6ad55', moyenne: '#63b3ed', faible: '#68d391' };
const COLORS_CAT = ['#667eea', '#764ba2', '#f6ad55', '#68d391', '#fc8181', '#63b3ed', '#b794f4', '#9ca3af'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [reclamations, setReclamations] = useState([]);
  const [filtreStatut, setFiltreStatut] = useState('');
  const [filtreService, setFiltreService] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [statsData, recsData] = await Promise.all([
        dashboardService.getStats(),
        reclamationService.getAll({ statut: filtreStatut, service: filtreService }),
      ]);
      setStats(statsData);
      setReclamations(recsData);
    } catch (err) {
      console.error(err);
    }
  }, [filtreStatut, filtreService]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!stats) return <div className="container">Chargement...</div>;

  const dataCat = Object.entries(stats.par_categorie || {}).map(([key, val], i) => ({
    name: LABEL_CATEGORIES[key] || key,
    value: val,
    fill: COLORS_CAT[i % COLORS_CAT.length],
  }));

  const dataPrio = Object.entries(stats.par_priorite || {}).map(([key, val]) => ({
    name: key,
    value: val,
    fill: COLORS_PRIO[key] || '#9ca3af',
  }));

  const services = [...new Set(reclamations.map(r => r.service_destinataire).filter(Boolean))];

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h1 style={{ margin: 0 }}>Tableau de bord</h1>
        <Link to="/analytics" style={{
          display: 'flex', alignItems: 'center', gap: 6,
          color: '#667eea', textDecoration: 'none', fontSize: 14, fontWeight: 500,
        }}>
          <TrendingUp size={16} /> Voir les analytiques IA →
        </Link>
      </div>

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

      {/* Graphiques */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, margin: '24px 0' }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem', color: '#374151' }}>Par catégorie</h3>
          {dataCat.length === 0 ? (
            <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>Aucune donnée</p>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={dataCat} margin={{ top: 0, right: 10, left: -15, bottom: 55 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" name="Réclamations" radius={[3, 3, 0, 0]}>
                  {dataCat.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem', color: '#374151' }}>Par priorité</h3>
          {dataPrio.length === 0 ? (
            <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>Aucune donnée</p>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={dataPrio} margin={{ top: 0, right: 10, left: -15, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" name="Réclamations" radius={[3, 3, 0, 0]}>
                  {dataPrio.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <h2 style={{ margin: 0, flex: 1 }}>Réclamations récentes</h2>
        <select
          value={filtreStatut}
          onChange={e => setFiltreStatut(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14 }}
        >
          <option value="">Tous les statuts</option>
          <option value="en_attente">En attente</option>
          <option value="en_analyse">En analyse</option>
          <option value="affectee">Affectée</option>
          <option value="en_traitement">En traitement</option>
          <option value="resolue">Résolue</option>
        </select>
        <select
          value={filtreService}
          onChange={e => setFiltreService(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14 }}
        >
          <option value="">Tous les services</option>
          {services.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(filtreStatut || filtreService) && (
          <button
            onClick={() => { setFiltreStatut(''); setFiltreService(''); }}
            style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, cursor: 'pointer', background: '#fff' }}
          >
            Réinitialiser
          </button>
        )}
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Catégorie</th>
            <th>Priorité</th>
            <th>Service</th>
            <th>Statut</th>
            <th>Confiance IA</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {reclamations.slice(0, 25).map(rec => (
            <tr key={rec.id_reclamation}>
              <td>#{rec.id_reclamation}</td>
              <td>{LABEL_CATEGORIES[rec.classification_detectee] || rec.classification_detectee}</td>
              <td>
                <span className={`badge badge-${rec.priorite_detectee}`}>
                  {rec.priorite_detectee}
                </span>
              </td>
              <td>{rec.service_destinataire}</td>
              <td>
                <span className={`status status-${rec.statut_reclamation}`}>
                  {rec.statut_reclamation}
                </span>
              </td>
              <td>{rec.score_confiance != null ? `${Number(rec.score_confiance).toFixed(1)}%` : '-'}</td>
              <td>{new Date(rec.date_creation).toLocaleDateString('fr-FR')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {reclamations.length === 0 && (
        <p style={{ textAlign: 'center', color: '#9ca3af', padding: '20px 0' }}>Aucune réclamation trouvée.</p>
      )}
    </div>
  );
}
