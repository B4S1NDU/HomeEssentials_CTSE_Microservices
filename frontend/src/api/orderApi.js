import { orderClient } from "./axiosConfig";

export const ordersApi = {
  create: (data) => orderClient.post("/api/orders", data),
  getAll: () => orderClient.get("/api/orders"),
  getById: (id) => orderClient.get(`/api/orders/${id}`),
  getByUser: (userId) => orderClient.get(`/api/orders/user/${userId}`),
  updateStatus: (id, status) =>
    orderClient.put(`/api/orders/${id}/status`, { status }),
  updateDelivery: (id, body) =>
    orderClient.put(`/api/orders/${id}/delivery`, body),
  remove: (id) => orderClient.delete(`/api/orders/${id}`),
  healthCheck: () => orderClient.get("/health"),
};

