const axios = require('axios');

const USER_SERVICE_BASE_URL = process.env.USER_SERVICE_BASE_URL || 'http://localhost:3001';
const PRODUCT_SERVICE_BASE_URL = process.env.PRODUCT_SERVICE_BASE_URL || 'http://localhost:3002';
const INVENTORY_SERVICE_BASE_URL = process.env.INVENTORY_SERVICE_BASE_URL || 'http://localhost:3003';
const PAYMENT_SERVICE_BASE_URL = process.env.PAYMENT_SERVICE_BASE_URL || 'http://localhost:3005';
const NOTIFICATION_SERVICE_BASE_URL = process.env.NOTIFICATION_SERVICE_BASE_URL || 'http://localhost:3006';

const httpClient = axios.create({
  timeout: Number.parseInt(process.env.HTTP_CLIENT_TIMEOUT_MS, 10) || 5000
});

async function validateUser(userId, authorization) {
  const response = await httpClient.get(`${USER_SERVICE_BASE_URL}/api/users/${userId}`, {
    headers: authorization ? { Authorization: authorization } : undefined
  });
  return response.data?.data || response.data;
}

async function validateProduct(productId, authorization) {
  const response = await httpClient.get(`${PRODUCT_SERVICE_BASE_URL}/api/products/${productId}`, {
    headers: authorization ? { Authorization: authorization } : undefined
  });
  return response.data?.data || response.data;
}

async function checkStock(productId, quantity, authorization) {
  try {
    console.log(`[CHECK-STOCK] Checking ${quantity} units of ${productId}`);
    const response = await httpClient.post(
      `${INVENTORY_SERVICE_BASE_URL}/api/inventory/check`,
      {
        productId,
        quantity
      },
      {
        headers: authorization ? { Authorization: authorization } : undefined
      }
    );
    console.log(`[CHECK-STOCK] ✅ Stock check passed:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[CHECK-STOCK] ❌ FAILED for ${productId}:`, {
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    throw error;
  }
}

async function reserveStock(productId, orderId, quantity, authorization) {
  try {
    console.log(`[RESERVE] Attempting to reserve ${quantity} units of ${productId} for order ${orderId}`);
    const response = await httpClient.post(
      `${INVENTORY_SERVICE_BASE_URL}/api/inventory/reserve`,
      {
        productId,
        orderId,
        quantity
      },
      {
        headers: authorization ? { Authorization: authorization } : undefined
      }
    );
    console.log(`[RESERVE] ✅ Success - Reserved ${quantity} units`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[RESERVE] ❌ FAILED for ${productId}:`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });
    throw error;
  }
}

async function deductStock(orderId, authorization) {
  try {
    console.log(`[DEDUCT] Deducting reserved stock for order ${orderId}`);
    const response = await httpClient.post(
      `${INVENTORY_SERVICE_BASE_URL}/api/inventory/deduct`,
      {
        orderId
      },
      {
        headers: authorization ? { Authorization: authorization } : undefined
      }
    );
    console.log(`[DEDUCT] ✅ Success - Stock deducted`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[DEDUCT] ❌ FAILED for ${orderId}:`, {
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    throw error;
  }
}

async function releaseStock(orderId, authorization) {
  try {
    console.log(`[RELEASE] Releasing reserved stock for order ${orderId}`);
    const response = await httpClient.post(
      `${INVENTORY_SERVICE_BASE_URL}/api/inventory/release`,
      {
        orderId
      },
      {
        headers: authorization ? { Authorization: authorization } : undefined
      }
    );
    console.log(`[RELEASE] ✅ Success - Stock released`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[RELEASE] ❌ FAILED for ${orderId}:`, {
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    throw error;
  }
}

async function processPayment({ orderId, userId, amount }) {
  const response = await httpClient.post(`${PAYMENT_SERVICE_BASE_URL}/api/payments/create`, {
    orderId,
    userId,
    amount
  });
  return response.data;
}

async function getInventoryByProductId(productId, authorization) {
  const response = await httpClient.get(`${INVENTORY_SERVICE_BASE_URL}/api/inventory/${productId}`, {
    headers: authorization ? { Authorization: authorization } : undefined
  });
  return response.data?.data || response.data;
}

async function getWarehouseById(warehouseId, authorization) {
  const response = await httpClient.get(`${INVENTORY_SERVICE_BASE_URL}/api/warehouse/${warehouseId}`, {
    headers: authorization ? { Authorization: authorization } : undefined
  });
  return response.data?.data || response.data;
}

async function getUserById(userId, authorization) {
  const serviceToken = process.env.USER_SERVICE_INTERNAL_TOKEN;
  const effectiveAuthorization = serviceToken ? `Bearer ${serviceToken}` : undefined;

  // Use internal endpoint that doesn't require authentication
  const response = await httpClient.get(`${USER_SERVICE_BASE_URL}/api/users/internal/${userId}`, {
    headers: effectiveAuthorization ? { Authorization: effectiveAuthorization } : undefined
  });
  return response.data?.data || response.data;
}

async function sendNotification(payload) {
  const response = await httpClient.post(`${NOTIFICATION_SERVICE_BASE_URL}/api/notifications/send`, payload);
  return response.data?.data || response.data;
}

module.exports = {
  validateUser,
  validateProduct,
  checkStock,
  reserveStock,
  deductStock,
  releaseStock,
  processPayment,
  getInventoryByProductId,
  getWarehouseById,
  getUserById,
  sendNotification
};

