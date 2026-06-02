import api from './axios';

export const cartApi = {
  get: () => api.get('/cart'),
  add: (payload) => api.post('/cart', payload), // { productId, quantity, size, color }
  update: (itemId, payload) => api.put(`/cart/${itemId}`, payload),
  remove: (itemId) => api.delete(`/cart/${itemId}`),
  clear: () => api.delete('/cart'),
  sync: (items) => api.post('/cart/sync', { items }),
};

export const wishlistApi = {
  get: () => api.get('/wishlist'),
  add: (productId) => api.post(`/wishlist/${productId}`),
  remove: (productId) => api.delete(`/wishlist/${productId}`),
  moveToCart: (productId, payload) => api.post(`/wishlist/move-to-cart/${productId}`, payload),
};

export const couponApi = {
  validate: (code, subtotal) => api.post('/coupons/validate', { code, subtotal }),
  list: () => api.get('/coupons'),
  create: (payload) => api.post('/coupons', payload),
  update: (id, payload) => api.put(`/coupons/${id}`, payload),
  remove: (id) => api.delete(`/coupons/${id}`),
};
