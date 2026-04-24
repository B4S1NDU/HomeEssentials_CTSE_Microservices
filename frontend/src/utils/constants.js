// Since we set up an API Gateway, all service calls go to ONE URL!
const GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080';

export const API_URLS = {
  USER_SERVICE: GATEWAY_URL,
  PRODUCT_SERVICE: GATEWAY_URL,
  INVENTORY_SERVICE: GATEWAY_URL,
  ORDER_SERVICE: GATEWAY_URL,
  PAYMENT_SERVICE: GATEWAY_URL,
  NOTIFICATION_SERVICE: GATEWAY_URL,
};

export const ROLES = {
  ADMIN: 'Admin',
  STORE_MANAGER: 'StoreManager',
  CUSTOMER: 'Customer',
  CASHIER: 'Cashier',
  DELIVERY: 'Delivery',
  SUPPORT: 'Support',
};

export const PRODUCT_CATEGORIES = [
  'rice',
  'soap',
  'detergent',
  'cooking-oil',
  'spices',
  'cleaning',
  'personal-care',
  'other',
];

export const PRODUCT_UNITS = ['kg', 'g', 'l', 'ml', 'piece', 'pack'];

export const STOCK_STATUS = {
  IN_STOCK: 'IN_STOCK',
  LOW_STOCK: 'LOW_STOCK',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
};

export const RESERVATION_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  RELEASED: 'RELEASED',
  EXPIRED: 'EXPIRED',
};
