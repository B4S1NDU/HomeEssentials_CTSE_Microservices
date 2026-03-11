import axios from 'axios';

const USER_SERVICE_URL         = import.meta.env.VITE_USER_SERVICE_URL         || 'http://localhost:5000';
const PRODUCT_SERVICE_URL      = import.meta.env.VITE_PRODUCT_SERVICE_URL      || 'http://localhost:3002';
const INVENTORY_SERVICE_URL    = import.meta.env.VITE_INVENTORY_SERVICE_URL    || 'http://localhost:3003';
const ORDER_SERVICE_URL        = import.meta.env.VITE_ORDER_SERVICE_URL        || 'http://localhost:3004';
const PAYMENT_SERVICE_URL      = import.meta.env.VITE_PAYMENT_SERVICE_URL      || 'http://localhost:3005';
const NOTIFICATION_SERVICE_URL = import.meta.env.VITE_NOTIFICATION_SERVICE_URL || 'http://localhost:3006';

function createClient(baseURL) {
  const instance = axios.create({ baseURL });
  instance.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  return instance;
}

export const userApi         = createClient(USER_SERVICE_URL);
export const productApi      = createClient(PRODUCT_SERVICE_URL);
export const inventoryApi    = createClient(INVENTORY_SERVICE_URL);
export const orderApi        = createClient(ORDER_SERVICE_URL);
export const paymentApi      = createClient(PAYMENT_SERVICE_URL);
export const notificationApi = createClient(NOTIFICATION_SERVICE_URL);
