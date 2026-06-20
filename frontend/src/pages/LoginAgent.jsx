import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LoginAgent() {
  const [form, setForm] = useState({ email: '', mot_de_passe: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginAgent } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authService.loginAgent(form.email, form.mot_de_passe);
      loginAgent(data.access_token, data.user_info);
      if (data.user_info.role === 'administrateur') {
        navigate('/admin/dashboard');
      } else {
        navigate('/agent');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
      <div className="auth-form">
        <div className="auth-form-header">
          <div className="auth-icon agent">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <h2>Espace Agent</h2>
          <p>Connectez-vous pour accéder à vos réclamations</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form-body">
          {error && <div className="error-box">{error}</div>}

          <div className="form-group">
            <label>Email professionnel</label>
            <input
              type="email"
              className="form-control"
              placeholder="votre@email.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={form.mot_de_passe}
              onChange={e => setForm({ ...form, mot_de_passe: e.target.value })}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '8px' }}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="auth-divider">
          <span>Vous êtes un client ?</span>
        </div>
        <div style={{ textAlign: 'center', paddingBottom: '24px' }}>
          <Link to="/login/client" className="auth-link">Accéder à l'espace client</Link>
        </div>
      </div>
    </div>
  );
}
