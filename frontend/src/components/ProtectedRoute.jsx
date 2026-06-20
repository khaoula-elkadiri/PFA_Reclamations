import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ type, children }) {
  const { loading, isAgentLoggedIn, isClientLoggedIn, isAdminLoggedIn } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <p style={{ color: '#6b7280', fontSize: '16px' }}>Chargement...</p>
      </div>
    );
  }

  if (type === 'admin' && !isAdminLoggedIn()) {
    return <Navigate to="/login/agent" replace />;
  }
  if (type === 'agent' && !isAgentLoggedIn()) {
    return <Navigate to="/login/agent" replace />;
  }
  if (type === 'client' && !isClientLoggedIn()) {
    return <Navigate to="/login/client" replace />;
  }
  return children;
}
