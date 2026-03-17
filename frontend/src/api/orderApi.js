import { orderClient } from "./axiosConfig";

export const ordersApi = {
  create: (data) => orderClient.post("/api/orders", data),
  getById: (id) => orderClient.get(`/api/orders/${id}`),
  getByUser: (userId) => orderClient.get(`/api/orders/user/${userId}`),
  updateStatus: (id, status) =>
    orderClient.put(`/api/orders/${id}/status`, { status }),
  healthCheck: () => orderClient.get("/health"),
};

