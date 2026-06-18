import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function RegisterClient() {
  const [form, setForm] = useState({
    nom: '', prenom: '', telephone: '', email: '', mot_de_passe: '', confirmer: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginClient } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.mot_de_passe !== form.confirmer) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    if (form.mot_de_passe.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    setLoading(true);
    try {
      const { confirmer, ...payload } = form;
      const data = await authService.registerClient(payload);
      loginClient(data.access_token, data.user_info);
      navigate('/espace-client');
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', paddingTop: '40px', paddingBottom: '40px' }}>
      <div className="auth-form" style={{ maxWidth: '480px' }}>
        <div className="auth-form-header">
          <h2>Créer un compte</h2>
          <p>Suivez vos réclamations depuis votre espace personnel</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form-body">
          {error && <div className="error-box">{error}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Nom</label>
              <input
                type="text"
                className="form-control"
                placeholder="Dupont"
                value={form.nom}
                onChange={e => setForm({ ...form, nom: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Prénom</label>
              <input
                type="text"
                className="form-control"
                placeholder="Jean"
                value={form.prenom}
                onChange={e => setForm({ ...form, prenom: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Téléphone</label>
            <input
              type="tel"
              className="form-control"
              placeholder="0612345678"
              value={form.telephone}
              onChange={e => setForm({ ...form, telephone: e.target.value })}
              required
            />
          </div>

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
              placeholder="Minimum 6 caractères"
              value={form.mot_de_passe}
              onChange={e => setForm({ ...form, mot_de_passe: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Confirmer le mot de passe</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={form.confirmer}
              onChange={e => setForm({ ...form, confirmer: e.target.value })}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '8px' }}>
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>

        <div className="auth-divider">
          <span>Déjà un compte ?</span>
        </div>
        <div style={{ textAlign: 'center', paddingBottom: '24px' }}>
          <Link to="/login/client" className="auth-link">Se connecter</Link>
        </div>
      </div>
    </div>
  );
}
