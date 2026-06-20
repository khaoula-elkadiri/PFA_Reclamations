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
  const agentRoutes = ['/dashboard', '/reclamations', '/reponse', '/statut', '/auth/me', '/agents'];
  const adminRoutes = ['/admin/'];
  const clientRoutes = ['/mes-reclamations', '/auth/me/client', '/client/mes-reclamations', '/client/mes-commandes', '/client/reclamation', '/reclamation'];

  const isAgentRoute = agentRoutes.some(r => url.includes(r));
  const isAdminRoute = adminRoutes.some(r => url.includes(r));
  const isClientRoute = clientRoutes.some(r => url.includes(r));

  if ((isAgentRoute || isAdminRoute) && agentToken && !config.headers.Authorization) {
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

export const agentService = {
  getReclamations: async (idAgent) => {
    const response = await api.get(`/agents/${idAgent}/reclamations`);
    return response.data;
  },
  updateStatut: async (idReclamation, nouveauStatut) => {
    const response = await api.put(`/reclamation/${idReclamation}/statut?nouveau_statut=${nouveauStatut}`);
    return response.data;
  },
  creerReponse: async (idReclamation, contenu) => {
    const response = await api.post(`/reponse/reclamation/${idReclamation}`, { contenu });
    return response.data;
  },
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
  },

  getMesCommandes: async () => {
    const token = localStorage.getItem('client_token');
    const response = await api.get('/client/mes-commandes', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response.data;
  },

  updateReclamation: async (id, description) => {
    const token = localStorage.getItem('client_token');
    const response = await api.put(`/client/reclamation/${id}`, { description }, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response.data;
  },

  deleteReclamation: async (id) => {
    const token = localStorage.getItem('client_token');
    const response = await api.delete(`/client/reclamation/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response.data;
  },
};

export const adminService = {
  // Dashboard
  getDashboard: () => api.get('/admin/dashboard').then(r => r.data),
  // Agents
  getAgents: () => api.get('/admin/agents').then(r => r.data),
  getServices: () => api.get('/admin/services').then(r => r.data),
  createAgent: (data) => api.post('/admin/agents', data).then(r => r.data),
  updateAgent: (id, data) => api.put(`/admin/agents/${id}`, data).then(r => r.data),
  deactivateAgent: (id) => api.delete(`/admin/agents/${id}`).then(r => r.data),
  // Réclamations
  getReclamations: (filters = {}) => {
    const p = new URLSearchParams(filters);
    return api.get(`/admin/reclamations?${p}`).then(r => r.data);
  },
  reassigner: (id, data) => api.put(`/admin/reclamations/${id}/reassigner`, data).then(r => r.data),
  // Monitoring IA
  getMonitoringIA: () => api.get('/admin/ia/monitoring').then(r => r.data),
  // Clients
  getClients: () => api.get('/admin/clients').then(r => r.data),
  getClientDetail: (id) => api.get(`/admin/clients/${id}`).then(r => r.data),
  createClient: (data) => api.post('/admin/clients', data).then(r => r.data),
  updateClient: (id, data) => api.put(`/admin/clients/${id}`, data).then(r => r.data),
  deleteClient: (id) => api.delete(`/admin/clients/${id}`).then(r => r.data),
  updateCommandeStatut: (id, nouveau_statut) => api.put(`/admin/commandes/${id}/statut`, { nouveau_statut }).then(r => r.data),
  getArticles: () => api.get('/admin/articles').then(r => r.data),
  createCommande: (data) => api.post('/admin/commandes', data).then(r => r.data),
};

export default api;