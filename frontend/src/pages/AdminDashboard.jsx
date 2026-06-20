import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  LayoutDashboard, Users, Brain, ShoppingBag, RefreshCw,
  AlertTriangle, CheckCircle, Clock, TrendingUp,
} from 'lucide-react';

const COLORS_STATUT = {
  en_attente: '#f6ad55',
  en_analyse: '#667eea',
  affectee: '#4299e1',
  en_traitement: '#4299e1',
  resolue: '#48bb78',
  fermee: '#a0aec0',
};

const PIE_COLORS = ['#667eea', '#48bb78', '#f6ad55', '#fc8181', '#4299e1', '#a0aec0'];

const LABEL_STATUT = {
  en_attente: 'En attente',
  en_analyse: 'En analyse',
  affectee: 'Affectée',
  en_traitement: 'En traitement',
  resolue: 'Résolue',
  fermee: 'Fermée',
};

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    adminService.getDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="container"><p style={{ color: '#6b7280', paddingTop: 40 }}>Chargement...</p></div>;
  if (!data) return null;

  const { kpis, par_service, par_priorite, par_statut, recentes } = data;

  const statutData = par_statut.map(s => ({
    name: LABEL_STATUT[s.statut] || s.statut,
    value: s.count,
  }));

  const serviceData = par_service
    .filter(s => s.service)
    .map(s => ({ name: s.service.replace('Service ', ''), count: s.count }));

  return (
    <div className="container" style={{ paddingTop: 32 }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: '#1f2937' }}>
            <LayoutDashboard size={22} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Super Dashboard
          </h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>Vue globale de toutes les réclamations du système</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 14 }}>
            <RefreshCw size={15} /> Actualiser
          </button>
          <Link to="/admin/agents" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: '#667eea', color: '#fff', textDecoration: 'none', fontSize: 14 }}>
            <Users size={15} /> Gérer les agents
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Total réclamations', value: kpis.total, color: '#667eea', icon: <LayoutDashboard size={20} /> },
          { label: 'En attente', value: kpis.en_attente, color: '#f6ad55', icon: <Clock size={20} /> },
          { label: 'En traitement', value: kpis.en_traitement, color: '#4299e1', icon: <TrendingUp size={20} /> },
          { label: 'Résolues', value: kpis.resolues, color: '#48bb78', icon: <CheckCircle size={20} /> },
          { label: 'Cas complexes', value: kpis.complexes, color: '#fc8181', icon: <AlertTriangle size={20} /> },
          { label: 'Taux résolution', value: `${kpis.taux_resolution}%`, color: '#48bb78', icon: <TrendingUp size={20} /> },
        ].map(k => (
          <div key={k.label} style={{
            background: '#fff', borderRadius: 12, padding: '18px 20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
            borderLeft: `4px solid ${k.color}`,
          }}>
            <div style={{ color: k.color, marginBottom: 6 }}>{k.icon}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1f2937' }}>{k.value}</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Graphiques */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
        {/* Par service */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: '#374151' }}>Réclamations par service</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={serviceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#667eea" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Par statut */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: '#374151' }}>Répartition par statut</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statutData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                {statutData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Raccourcis admin */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 32 }}>
        {[
          { to: '/admin/agents', icon: <Users size={22} color="#667eea" />, label: 'Gérer les agents', desc: 'Créer, modifier, désactiver' },
          { to: '/admin/ia', icon: <Brain size={22} color="#48bb78" />, label: 'Monitoring IA', desc: 'Confiance, catégories, tendances' },
          { to: '/admin/clients', icon: <ShoppingBag size={22} color="#f6ad55" />, label: 'Clients & Commandes', desc: 'Gérer les clients et leurs commandes' },
        ].map(card => (
          <Link key={card.to} to={card.to} style={{ textDecoration: 'none', background: '#fff', borderRadius: 12, padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 14, transition: 'box-shadow .2s' }}>
            <div style={{ background: '#f9fafb', borderRadius: 10, padding: 10 }}>{card.icon}</div>
            <div>
              <div style={{ fontWeight: 600, color: '#1f2937', fontSize: 15 }}>{card.label}</div>
              <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 2 }}>{card.desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Réclamations récentes */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#374151' }}>Réclamations récentes (toutes catégories)</h3>
          <Link to="/admin/reclamations" style={{ color: '#667eea', fontSize: 13, textDecoration: 'none' }}>Voir tout →</Link>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['#', 'Client', 'Service', 'Priorité', 'Confiance IA', 'Statut', 'Date'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#6b7280', fontWeight: 600, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentes.map(r => (
                <tr key={r.id_reclamation} style={{ borderTop: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 14px', color: '#9ca3af' }}>#{r.id_reclamation}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 500 }}>
                    {r.client ? `${r.client.prenom} ${r.client.nom}` : '—'}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#374151' }}>{r.service_destinataire || '—'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span className={`badge badge-${r.priorite_detectee}`}>{r.priorite_detectee}</span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ color: r.score_confiance >= 70 ? '#48bb78' : r.score_confiance >= 40 ? '#f6ad55' : '#fc8181', fontWeight: 600 }}>
                      {Number(r.score_confiance).toFixed(0)}%
                    </span>
                    {r.est_complexe && <span style={{ marginLeft: 6, fontSize: 11, background: '#fef3c7', color: '#92400e', padding: '1px 6px', borderRadius: 8 }}>complexe</span>}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ background: COLORS_STATUT[r.statut_reclamation] + '20', color: COLORS_STATUT[r.statut_reclamation], padding: '2px 8px', borderRadius: 10, fontSize: 12, fontWeight: 600 }}>
                      {LABEL_STATUT[r.statut_reclamation] || r.statut_reclamation}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', color: '#9ca3af' }}>
                    {new Date(r.date_creation).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
