import axios from "axios";
import { API_URLS } from "../utils/constants";

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

export const userClient = createInstance(API_URLS.USER_SERVICE);
export const productClient = createInstance(API_URLS.PRODUCT_SERVICE);
export const inventoryClient = createInstance(API_URLS.INVENTORY_SERVICE);
export const paymentClient = createInstance(API_URLS.PAYMENT_SERVICE);
export const orderClient = createInstance(API_URLS.ORDER_SERVICE);
export const notificationClient = createInstance(API_URLS.NOTIFICATION_SERVICE);
