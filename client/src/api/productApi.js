import api from './axios';

export const productApi = {
  // params: { search, category, brand, minPrice, maxPrice, rating, size, color, sort, page, limit, featured }
  list: (params) => api.get('/products', { params }),
  featured: () => api.get('/products/featured'),
  related: (id) => api.get(`/products/related/${id}`),
  bySlug: (slug) => api.get(`/products/${slug}`),
  byId: (id) => api.get(`/products/id/${id}`),

  // Admin (multipart FormData)
  create: (formData) =>
    api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) =>
    api.put(`/products/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  remove: (id) => api.delete(`/products/${id}`),
  addImages: (id, formData) =>
    api.post(`/products/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  removeImage: (id, imageId) => api.delete(`/products/${id}/images/${imageId}`),
};

export const categoryApi = {
  list: () => api.get('/categories'),
  bySlug: (slug) => api.get(`/categories/${slug}`),
  create: (formData) =>
    api.post('/categories', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) =>
    api.put(`/categories/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  remove: (id) => api.delete(`/categories/${id}`),
};

export const reviewApi = {
  all: (params) => api.get('/reviews', { params }),
  forProduct: (productId, params) => api.get(`/reviews/product/${productId}`, { params }),
  create: (productId, payload) => api.post(`/reviews/product/${productId}`, payload),
  update: (id, payload) => api.put(`/reviews/${id}`, payload),
  remove: (id) => api.delete(`/reviews/${id}`),
  helpful: (id) => api.post(`/reviews/${id}/helpful`),
};
