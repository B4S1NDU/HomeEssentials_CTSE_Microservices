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

// Service URLs (from .env or Azure Container Apps internal DNS)
const services = {
    users: process.env.USER_SERVICE_URL || 'http://user-service:3001',
    products: process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002',
    inventory: process.env.INVENTORY_SERVICE_URL || 'http://inventory-service:3003',
    orders: process.env.ORDER_SERVICE_URL || 'http://order-service:3004',
    payments: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3005',
    notifications: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3006',
};

// Route Setup
app.use('/api/users', createProxyMiddleware({ 
    target: services.users, 
    changeOrigin: true,
    pathRewrite: { '^/api/users': '' } // Strips /api/users to send clean path to microservice
}));

app.use('/api/products', createProxyMiddleware({ 
    target: services.products, 
    changeOrigin: true,
    pathRewrite: { '^/api/products': '' }
}));

app.use('/api/inventory', createProxyMiddleware({ 
    target: services.inventory, 
    changeOrigin: true,
    pathRewrite: { '^/api/inventory': '' }
}));

app.use('/api/orders', createProxyMiddleware({ 
    target: services.orders, 
    changeOrigin: true,
    pathRewrite: { '^/api/orders': '' }
}));

app.use('/api/payments', createProxyMiddleware({ 
    target: services.payments, 
    changeOrigin: true,
    pathRewrite: { '^/api/payments': '' }
}));

app.use('/api/notifications', createProxyMiddleware({ 
    target: services.notifications, 
    changeOrigin: true,
    pathRewrite: { '^/api/notifications': '' }
}));

// Health Check
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
