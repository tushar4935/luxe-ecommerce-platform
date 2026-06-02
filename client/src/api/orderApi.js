import api from './axios';

export const orderApi = {
  list: (params) => api.get('/orders', { params }),
  byId: (id) => api.get(`/orders/${id}`),
  create: (payload) => api.post('/orders', payload),
  cancel: (id, reason) => api.post(`/orders/${id}/cancel`, { reason }),
};
