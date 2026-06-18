import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [agentToken, setAgentToken] = useState(() => localStorage.getItem('agent_token'));
  const [clientToken, setClientToken] = useState(() => localStorage.getItem('client_token'));
  const [agentUser, setAgentUser] = useState(null);
  const [clientUser, setClientUser] = useState(null);
  const [loading, setLoading] = useState(
    !!(localStorage.getItem('agent_token') || localStorage.getItem('client_token'))
  );

  useEffect(() => {
    const agentT = localStorage.getItem('agent_token');
    const clientT = localStorage.getItem('client_token');
    if (!agentT && !clientT) { setLoading(false); return; }

    const promises = [];
    if (agentT) {
      promises.push(
        api.get('/auth/me', { headers: { Authorization: `Bearer ${agentT}` } })
          .then(r => setAgentUser(r.data))
          .catch(() => { localStorage.removeItem('agent_token'); setAgentToken(null); })
      );
    }
    if (clientT) {
      promises.push(
        api.get('/auth/me/client', { headers: { Authorization: `Bearer ${clientT}` } })
          .then(r => setClientUser(r.data))
          .catch(() => { localStorage.removeItem('client_token'); setClientToken(null); })
      );
    }
    Promise.all(promises).finally(() => setLoading(false));
  }, []);

  const loginAgent = (token, user) => {
    localStorage.setItem('agent_token', token);
    setAgentToken(token);
    setAgentUser(user);
  };

  const loginClient = (token, user) => {
    localStorage.setItem('client_token', token);
    setClientToken(token);
    setClientUser(user);
  };

  const logoutAgent = () => {
    localStorage.removeItem('agent_token');
    setAgentToken(null);
    setAgentUser(null);
  };

  const logoutClient = () => {
    localStorage.removeItem('client_token');
    setClientToken(null);
    setClientUser(null);
  };

  const isAgentLoggedIn = () => !!agentToken && !!agentUser;
  const isClientLoggedIn = () => !!clientToken && !!clientUser;

  return (
    <AuthContext.Provider value={{
      agentToken, clientToken,
      agentUser, clientUser,
      loading,
      loginAgent, loginClient,
      logoutAgent, logoutClient,
      isAgentLoggedIn, isClientLoggedIn,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
