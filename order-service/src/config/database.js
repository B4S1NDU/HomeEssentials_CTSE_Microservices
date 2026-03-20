const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/homeessentials_orders';

    await mongoose.connect(mongoUri, {
      // modern mongoose uses URI only; options kept minimal
    });

    console.log('✅ Order Service: MongoDB connected');
  } catch (error) {
    console.error('❌ Order Service: MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

