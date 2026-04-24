const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(morgan('dev'));

// Service URLs (from .env or Azure Container Apps Internal DNS)
const services = {
    users: process.env.USER_SERVICE_URL || 'https://user-service.politepond-d071e43b.southeastasia.azurecontainerapps.io',
    products: process.env.PRODUCT_SERVICE_URL || 'https://product-service.politepond-d071e43b.southeastasia.azurecontainerapps.io',
    inventory: process.env.INVENTORY_SERVICE_URL || 'https://inventory-service.politepond-d071e43b.southeastasia.azurecontainerapps.io',
    orders: process.env.ORDER_SERVICE_URL || 'https://order-service.politepond-d071e43b.southeastasia.azurecontainerapps.io',
    payments: process.env.PAYMENT_SERVICE_URL || 'https://payment-service.politepond-d071e43b.southeastasia.azurecontainerapps.io',
    notifications: process.env.NOTIFICATION_SERVICE_URL || 'https://notification-service.politepond-d071e43b.southeastasia.azurecontainerapps.io',
};

// Route Setup
// Forwards the requests exactly as they are without stripping the path
// (e.g., /api/products -> product-service:3002/api/products)
app.use('/api/users', createProxyMiddleware({ target: services.users, changeOrigin: true }));
app.use('/api/auth', createProxyMiddleware({ target: services.users, changeOrigin: true }));

app.use('/api/products', createProxyMiddleware({ target: services.products, changeOrigin: true }));
app.use('/api/inventory', createProxyMiddleware({ target: services.inventory, changeOrigin: true }));
app.use('/api/orders', createProxyMiddleware({ target: services.orders, changeOrigin: true }));
app.use('/api/payments', createProxyMiddleware({ target: services.payments, changeOrigin: true }));
app.use('/api/notifications', createProxyMiddleware({ target: services.notifications, changeOrigin: true }));

// Health Checking
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'API Gateway is running properly!' });
});

app.listen(PORT, () => {
    console.log(`🚀 API Gateway running on port ${PORT}`);
    console.log('Registered Routes:');
    console.log(`- /api/users -> ${services.users}`);
    console.log(`- /api/products -> ${services.products}`);
    console.log(`- /api/inventory -> ${services.inventory}`);
    console.log(`- /api/orders -> ${services.orders}`);
    console.log(`- /api/payments -> ${services.payments}`);
    console.log(`- /api/notifications -> ${services.notifications}`);
});
