import { userClient } from './axiosConfig';

export const authApi = {
  register: (data) => userClient.post('/api/auth/register', data),
  login: (data) => userClient.post('/api/auth/login', data),
  changePassword: (userId, data) => userClient.patch(`/api/auth/${userId}/password`, data),
};

export const usersApi = {
  getAll: (params = {}) => userClient.get('/api/users', { params }),
  getById: (id) => userClient.get(`/api/users/${id}`),
  update: (id, data) => userClient.patch(`/api/users/${id}`, data),
};
