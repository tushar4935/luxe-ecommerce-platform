import api from './axios';

export const userApi = {
  me: () => api.get('/users/me'),
  updateMe: (payload) => {
    // Accept either a plain object (JSON) or FormData (avatar upload)
    if (payload instanceof FormData) {
      return api.put('/users/me', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.put('/users/me', payload);
  },
  changePassword: (currentPassword, newPassword) =>
    api.put('/users/me/password', { currentPassword, newPassword }),
  getAddresses: () => api.get('/users/me/addresses'),
  addAddress: (payload) => api.post('/users/me/addresses', payload),
  updateAddress: (id, payload) => api.put(`/users/me/addresses/${id}`, payload),
  deleteAddress: (id) => api.delete(`/users/me/addresses/${id}`),
};

export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
  users: (params) => api.get('/admin/users', { params }),
  userById: (id) => api.get(`/admin/users/${id}`),
  updateUserStatus: (id, isActive) => api.put(`/admin/users/${id}/status`, { isActive }),
  orders: (params) => api.get('/admin/orders', { params }),
  updateOrderStatus: (id, status, note) =>
    api.put(`/admin/orders/${id}/status`, { status, note }),
  revenueAnalytics: (period) => api.get('/admin/analytics/revenue', { params: { period } }),
  productAnalytics: () => api.get('/admin/analytics/products'),
};
