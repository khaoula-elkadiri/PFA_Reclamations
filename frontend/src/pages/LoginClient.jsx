import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LoginClient() {
  const [form, setForm] = useState({ email: '', mot_de_passe: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginClient } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authService.loginClient(form.email, form.mot_de_passe);
      loginClient(data.access_token, data.user_info);
      navigate('/espace-client');
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
          <div className="auth-icon client">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <h2>Espace Client</h2>
          <p>Suivez vos réclamations et consultez les réponses</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form-body">
          {error && <div className="error-box">{error}</div>}

          <div className="form-group">
            <label>Email</label>
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
          <span>Pas encore de compte ?</span>
        </div>
        <div style={{ textAlign: 'center', paddingBottom: '8px' }}>
          <Link to="/register" className="auth-link">Créer un compte</Link>
        </div>
        <div style={{ textAlign: 'center', paddingBottom: '24px' }}>
          <Link to="/login/agent" className="auth-link" style={{ fontSize: '13px', opacity: 0.7 }}>Accès agent</Link>
        </div>
      </div>
    </div>
  );
}
