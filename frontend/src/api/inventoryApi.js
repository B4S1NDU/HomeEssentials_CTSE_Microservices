import { inventoryClient } from './axiosConfig';

export const inventoryApi = {
  getAll: (params = {}) => inventoryClient.get('/api/inventory', { params }),
  getLowStock: () => inventoryClient.get('/api/inventory/low-stock'),
  getByProductId: (productId) => inventoryClient.get(`/api/inventory/${productId}`),
  create: (data) => inventoryClient.post('/api/inventory', data),
  update: (productId, data) => inventoryClient.put(`/api/inventory/${productId}`, data),
  checkStock: (data) => inventoryClient.post('/api/inventory/check', data),
  reserveStock: (data) => inventoryClient.post('/api/inventory/reserve', data),
  releaseStock: (data) => inventoryClient.post('/api/inventory/release', data),
  deductStock: (data) => inventoryClient.post('/api/inventory/deduct', data),
  healthCheck: () => inventoryClient.get('/health'),
};
