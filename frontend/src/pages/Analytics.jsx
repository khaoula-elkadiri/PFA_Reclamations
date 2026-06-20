import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { Brain, AlertTriangle, TrendingUp, Layers } from 'lucide-react';
import api from '../services/api';

const COLORS_CAT = ['#667eea', '#764ba2', '#f6ad55', '#68d391', '#fc8181', '#63b3ed', '#b794f4'];
const COLORS_SERVICE = ['#4299e1', '#48bb78', '#f6ad55', '#fc8181', '#9f7aea'];

const LABEL_CATEGORIES = {
  retard_livraison: 'Retard livraison',
  produit_casse: 'Produit cassé',
  erreur_picking: 'Erreur picking',
  article_manquant: 'Article manquant',
  mauvaise_qualite: 'Mauvaise qualité',
  probleme_transport: 'Problème transport',
  erreur_administrative: 'Erreur administrative',
  autre: 'Autre',
  non_classe: 'Non classé',
};

function StatCard({ icon: Icon, title, value, subtitle, color }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: '20px 24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 12,
        background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={26} color={color} />
      </div>
      <div>
        <p style={{ margin: 0, color: '#6b7280', fontSize: 13 }}>{title}</p>
        <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#1f2937' }}>{value}</p>
        {subtitle && <p style={{ margin: 0, color: '#9ca3af', fontSize: 12 }}>{subtitle}</p>}
      </div>
    </div>
  );
}

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [dashStats, setDashStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('agent_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    Promise.all([
      api.get('/dashboard/ai-stats', { headers }),
      api.get('/dashboard/stats', { headers }),
    ])
      .then(([aiRes, dashRes]) => {
        setStats(aiRes.data);
        setDashStats(dashRes.data);
      })
      .catch(() => setError("Impossible de charger les statistiques."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
        <p style={{ color: '#6b7280' }}>Chargement des statistiques IA...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-box">{error}</div>
      </div>
    );
  }

  const dataCat = (stats?.par_categorie || []).map((r, i) => ({
    name: LABEL_CATEGORIES[r.categorie] || r.categorie,
    total: r.total,
    confiance: r.confiance_moy,
    fill: COLORS_CAT[i % COLORS_CAT.length],
  }));

  const dataService = (stats?.par_service || []).filter(r => r.service).map((r, i) => ({
    name: r.service,
    value: r.total,
    fill: COLORS_SERVICE[i % COLORS_SERVICE.length],
  }));

  const dataStatut = dashStats ? [
    { name: 'En attente', value: dashStats.en_attente, fill: '#f6ad55' },
    { name: 'En traitement', value: dashStats.en_traitement, fill: '#63b3ed' },
    { name: 'Résolues', value: dashStats.resolues, fill: '#68d391' },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="container">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1f2937', marginBottom: 6 }}>
          Analytiques IA
        </h1>
        <p style={{ color: '#6b7280', margin: 0 }}>
          Statistiques du modèle de classification et du traitement des réclamations.
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard
          icon={Layers}
          title="Réclamations totales"
          value={stats?.total ?? 0}
          color="#667eea"
        />
        <StatCard
          icon={AlertTriangle}
          title="Cas complexes"
          value={stats?.nb_complexes ?? 0}
          subtitle={`${stats?.pct_complexes ?? 0}% du total — traitement manuel`}
          color="#f6ad55"
        />
        <StatCard
          icon={Brain}
          title="Catégories classifiées"
          value={dataCat.length}
          subtitle="Détectées par le modèle IA"
          color="#764ba2"
        />
        <StatCard
          icon={TrendingUp}
          title="Services impliqués"
          value={dataService.length}
          subtitle="Équipes de traitement"
          color="#48bb78"
        />
      </div>

      {/* Row 1 : distribution catégories + statuts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h3 style={{ margin: '0 0 16px', color: '#1f2937', fontSize: '1rem' }}>
            Distribution par catégorie
          </h3>
          {dataCat.length === 0 ? (
            <p style={{ color: '#9ca3af', textAlign: 'center', padding: '30px 0' }}>Aucune donnée</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dataCat} margin={{ top: 0, right: 10, left: -10, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" name="Réclamations" radius={[4, 4, 0, 0]}>
                  {dataCat.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h3 style={{ margin: '0 0 16px', color: '#1f2937', fontSize: '1rem' }}>
            Répartition par statut
          </h3>
          {dataStatut.length === 0 ? (
            <p style={{ color: '#9ca3af', textAlign: 'center', padding: '30px 0' }}>Aucune donnée</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={dataStatut}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={true}
                >
                  {dataStatut.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} réclamations`]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 2 : confiance IA + distribution services */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h3 style={{ margin: '0 0 16px', color: '#1f2937', fontSize: '1rem' }}>
            Confiance IA moyenne par catégorie (%)
          </h3>
          {dataCat.length === 0 ? (
            <p style={{ color: '#9ca3af', textAlign: 'center', padding: '30px 0' }}>Aucune donnée</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dataCat} layout="vertical" margin={{ top: 0, right: 30, left: 100, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={95} />
                <Tooltip formatter={(v) => [`${v}%`, 'Confiance moy.']} />
                <Bar dataKey="confiance" name="Confiance IA" radius={[0, 4, 4, 0]} fill="#667eea" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h3 style={{ margin: '0 0 16px', color: '#1f2937', fontSize: '1rem' }}>
            Réclamations par service
          </h3>
          {dataService.length === 0 ? (
            <p style={{ color: '#9ca3af', textAlign: 'center', padding: '30px 0' }}>Aucune donnée</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dataService} margin={{ top: 0, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" name="Réclamations" radius={[4, 4, 0, 0]}>
                  {dataService.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Tableau détail par catégorie */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <h3 style={{ margin: '0 0 16px', color: '#1f2937', fontSize: '1rem' }}>
          Détail par catégorie
        </h3>
        {dataCat.length === 0 ? (
          <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>Aucune donnée disponible</p>
        ) : (
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Catégorie</th>
                <th>Réclamations</th>
                <th>Confiance IA moy.</th>
                <th>Barre de confiance</th>
              </tr>
            </thead>
            <tbody>
              {dataCat.sort((a, b) => b.total - a.total).map((row, i) => (
                <tr key={i}>
                  <td><strong>{row.name}</strong></td>
                  <td>{row.total}</td>
                  <td>{row.confiance.toFixed(1)}%</td>
                  <td>
                    <div style={{ background: '#f3f4f6', borderRadius: 4, height: 10, width: '100%' }}>
                      <div style={{
                        background: row.confiance >= 70 ? '#48bb78' : row.confiance >= 40 ? '#f6ad55' : '#fc8181',
                        borderRadius: 4, height: '100%', width: `${row.confiance}%`,
                        transition: 'width 0.4s ease',
                      }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
