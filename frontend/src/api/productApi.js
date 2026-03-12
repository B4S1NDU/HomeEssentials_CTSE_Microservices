import { productClient } from './axiosConfig';

export const productsApi = {
  getAll: (params = {}) => productClient.get('/api/products', { params }),
  getById: (id) => productClient.get(`/api/products/${id}`),
  getByCategory: (category) => productClient.get(`/api/products/category/${category}`),
  create: (data) => productClient.post('/api/products', data),
  update: (id, data) => productClient.put(`/api/products/${id}`, data),
  delete: (id) => productClient.delete(`/api/products/${id}`),
  healthCheck: () => productClient.get('/health'),
};
