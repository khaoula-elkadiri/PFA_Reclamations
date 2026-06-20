import { useEffect, useState } from 'react';
import { adminService } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Brain, TrendingUp, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

const LABEL_CAT = {
  retard_livraison: 'Retard livraison',
  produit_casse: 'Produit cassé',
  erreur_picking: 'Erreur picking',
  article_manquant: 'Article manquant',
  mauvaise_qualite: 'Mauvaise qualité',
  probleme_transport: 'Pb. transport',
  erreur_administrative: 'Erreur admin.',
  autre: 'Autre',
};

const PIE_COLORS = ['#48bb78', '#f6ad55', '#fc8181'];

export default function AdminMonitoringIA() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    adminService.getMonitoringIA()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="container"><p style={{ color: '#6b7280', paddingTop: 40 }}>Chargement...</p></div>;
  if (!data) return null;

  const { global: g, par_categorie, tendance_7j, distribution_confiance } = data;

  const distData = [
    { name: 'Haute (≥70%)', value: distribution_confiance.haute_70plus },
    { name: 'Moyenne (40-70%)', value: distribution_confiance.moyenne_40_70 },
    { name: 'Basse (<40%)', value: distribution_confiance.basse_sous_40 },
  ];

  const catData = par_categorie.map(c => ({
    name: LABEL_CAT[c.categorie] || c.categorie,
    confiance: c.confiance_moy,
    total: c.total,
    complexes: c.nb_complexes,
  }));

  return (
    <div className="container" style={{ paddingTop: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' }}>
            <Brain size={22} style={{ verticalAlign: 'middle', marginRight: 8, color: '#667eea' }} />
            Monitoring du Modèle IA
          </h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>Performance en temps réel du modèle de classification LinearSVC</p>
        </div>
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 14 }}>
          <RefreshCw size={15} /> Actualiser
        </button>
      </div>

      {/* KPI globaux */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Réclamations analysées', value: g.total, icon: <Brain size={20} color="#667eea" />, color: '#667eea' },
          { label: 'Confiance moyenne', value: `${g.confiance_moy}%`, icon: <TrendingUp size={20} color="#48bb78" />, color: '#48bb78' },
          { label: 'Cas complexes', value: g.complexes, icon: <AlertTriangle size={20} color="#f6ad55" />, color: '#f6ad55' },
          { label: '% Cas complexes', value: `${g.pct_complexes}%`, icon: <CheckCircle size={20} color="#fc8181" />, color: '#fc8181' },
        ].map(k => (
          <div key={k.label} style={{
            background: '#fff', borderRadius: 12, padding: '18px 20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)', borderLeft: `4px solid ${k.color}`,
          }}>
            <div style={{ marginBottom: 6 }}>{k.icon}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1f2937' }}>{k.value}</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Graphiques ligne 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Tendance 7 jours */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '1rem', color: '#374151' }}>Évolution sur 7 jours</h3>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#9ca3af' }}>Nombre de réclamations et confiance moyenne par jour</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={tendance_7j}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              <Bar yAxisId="left" dataKey="nb_reclamations" fill="#667eea" name="Réclamations" radius={[3, 3, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="confiance_moy" stroke="#48bb78" name="Confiance %" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Distribution confiance */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '1rem', color: '#374151' }}>Distribution confiance</h3>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#9ca3af' }}>Répartition des niveaux de confiance</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={distData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                {distData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Confiance par catégorie */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 4px', fontSize: '1rem', color: '#374151' }}>Confiance IA par catégorie</h3>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#9ca3af' }}>Score moyen de confiance du modèle pour chaque catégorie de réclamation</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={catData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
            <Tooltip formatter={(v) => `${v}%`} />
            <Bar dataKey="confiance" fill="#48bb78" radius={[0, 4, 4, 0]}
              label={{ position: 'right', fontSize: 11, formatter: v => `${v}%` }} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tableau détail par catégorie */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#374151' }}>Détail par catégorie</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['Catégorie', 'Réclamations', 'Confiance moy.', 'Cas complexes', '% complexes', 'Qualité'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#6b7280', fontWeight: 600, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {par_categorie.map(c => {
              const col = c.confiance_moy >= 70 ? '#48bb78' : c.confiance_moy >= 40 ? '#f6ad55' : '#fc8181';
              return (
                <tr key={c.categorie} style={{ borderTop: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 16px', fontWeight: 500 }}>{LABEL_CAT[c.categorie] || c.categorie}</td>
                  <td style={{ padding: '10px 16px', fontWeight: 600, color: '#667eea' }}>{c.total}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ background: '#f3f4f6', borderRadius: 4, height: 8, width: 80, flexShrink: 0 }}>
                        <div style={{ background: col, borderRadius: 4, height: '100%', width: `${Math.min(c.confiance_moy, 100)}%` }} />
                      </div>
                      <span style={{ color: col, fontWeight: 600 }}>{c.confiance_moy}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 16px', color: '#f6ad55', fontWeight: 600 }}>{c.nb_complexes}</td>
                  <td style={{ padding: '10px 16px', color: '#6b7280' }}>{c.pct_complexes}%</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{
                      background: col + '20', color: col, padding: '2px 10px', borderRadius: 10, fontSize: 12, fontWeight: 600
                    }}>
                      {c.confiance_moy >= 70 ? 'Bonne' : c.confiance_moy >= 40 ? 'Moyenne' : 'Faible'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
