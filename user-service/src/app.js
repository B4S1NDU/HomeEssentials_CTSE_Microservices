const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'user-service' });
});

app.use('/api/users', userRoutes);

module.exports = app;
