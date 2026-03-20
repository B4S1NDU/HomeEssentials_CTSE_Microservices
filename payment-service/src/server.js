const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { successResponse } = require('./utils/response');

dotenv.config();

const paymentRoutes = require("./routes/paymentRoutes");
const connectDB = require("./config/db");

const app = express();
app.use(cors());
app.use(express.json());

// Connect to DB
connectDB();

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json(
    successResponse({
      status: 'ok',
      service: 'payment-service',
      timestamp: new Date().toISOString(),
    })
  );
});

app.use("/api/payments", paymentRoutes);

app.get("/", (req, res) => res.send("Payment service is running"));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Payment service listening on port ${PORT}`);
});
