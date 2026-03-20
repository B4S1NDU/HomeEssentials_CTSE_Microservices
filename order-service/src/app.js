const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const orderRoutes = require('./routes/orderRoutes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true
  })
);

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(compression());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

let swaggerDocument;
try {
  swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (err) {
  console.warn('Swagger file not found or failed to load for Order Service');
}

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'Order Service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/readiness', async (req, res) => {
  const mongoose = require('mongoose');
  const dbState = mongoose.connection.readyState;

  if (dbState === 1) {
    res.status(200).json({ status: 'READY', database: 'connected' });
  } else {
    res.status(503).json({ status: 'NOT_READY', database: 'disconnected' });
  }
});

app.use('/api/orders', orderRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Order Service API',
    version: '1.0.0',
    documentation: '/api-docs',
    health: '/health'
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

