import axios from 'axios';

const API_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
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
export default api;