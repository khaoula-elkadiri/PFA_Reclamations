import axios from 'axios';

const API_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Intercepteur : attache automatiquement le bon token selon la route
api.interceptors.request.use((config) => {
  const agentToken = localStorage.getItem('agent_token');
  const clientToken = localStorage.getItem('client_token');

  const url = config.url || '';
  const agentRoutes = ['/dashboard', '/reclamations', '/reponse', '/statut', '/auth/me'];
  const clientRoutes = ['/mes-reclamations', '/auth/me/client'];

  const isAgentRoute = agentRoutes.some(r => url.includes(r));
  const isClientRoute = clientRoutes.some(r => url.includes(r));

  if (isAgentRoute && agentToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${agentToken}`;
  } else if (isClientRoute && clientToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${clientToken}`;
  }
  return config;
});

export const reclamationService = {
  creer: async (data) => {
    const response = await api.post('/reclamation', data);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/reclamation/${id}`);
    return response.data;
  },

  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/reclamations?${params}`);
    return response.data;
  },

  updateStatut: async (id, statut) => {
    const response = await api.put(`/reclamation/${id}/statut?nouveau_statut=${statut}`);
    return response.data;
  }
};

export const dashboardService = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  getByService: async (service) => {
    const response = await api.get(`/dashboard/service/${service}`);
    return response.data;
  }
};

export const notificationService = {
  getByClient: async (idClient) => {
    const response = await api.get(`/notifications/client/${idClient}`);
    return response.data;
  }
};

export const commandeService = {
  rechercher: async (numeroCommande) => {
    const response = await api.get(`/commande/rechercher/${numeroCommande}`);
    return response.data;
  },

  rechercherParClient: async (telephone, email) => {
    const params = new URLSearchParams();
    if (telephone) params.append('telephone', telephone);
    if (email) params.append('email', email);
    const response = await api.get(`/commandes/client?${params}`);
    return response.data;
  }
};

export const authService = {
  loginAgent: async (email, mot_de_passe) => {
    const response = await api.post('/auth/agent/login', { email, mot_de_passe });
    return response.data;
  },

  loginClient: async (email, mot_de_passe) => {
    const response = await api.post('/auth/client/login', { email, mot_de_passe });
    return response.data;
  },

  registerClient: async (data) => {
    const response = await api.post('/auth/client/register', data);
    return response.data;
  },

  getMeAgent: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  getMeClient: async () => {
    const response = await api.get('/auth/me/client');
    return response.data;
  }
};

export const reponseService = {
  getForAgent: async (idReclamation) => {
    const response = await api.get(`/reponse/reclamation/${idReclamation}/agent`);
    return response.data;
  },

  getForClient: async (idReclamation) => {
    const token = localStorage.getItem('client_token');
    const response = await api.get(`/reponse/reclamation/${idReclamation}/client`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response.data;
  },

  creer: async (idReclamation, contenu) => {
    const response = await api.post(`/reponse/reclamation/${idReclamation}`, { contenu });
    return response.data;
  }
};

export const clientService = {
  getMesReclamations: async () => {
    const token = localStorage.getItem('client_token');
    const response = await api.get('/client/mes-reclamations', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response.data;
  }
};

export default api;
