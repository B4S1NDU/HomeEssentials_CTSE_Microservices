import axios from "axios";

const createInstance = (baseURL) => {
  const instance = axios.create({ baseURL, timeout: 10000 });

  // Attach JWT token on every request
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;

    // Auto-detect FormData and let axios handle the Content-Type header
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  });

  return instance;
};

// Since we have an API Gateway now, all clients point to the same single URL!
const API_GATEWAY_APP = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080';

export const userClient = createInstance(API_GATEWAY_APP);
export const productClient = createInstance(API_GATEWAY_APP);
export const inventoryClient = createInstance(API_GATEWAY_APP);
export const paymentClient = createInstance(API_GATEWAY_APP);
export const orderClient = createInstance(API_GATEWAY_APP);
export const notificationClient = createInstance(API_GATEWAY_APP);
