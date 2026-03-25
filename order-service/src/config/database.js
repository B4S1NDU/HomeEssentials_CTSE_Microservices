const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/homeessentials_orders';

    await mongoose.connect(mongoUri, {
      // Modern mongoose uses URI only; options kept minimal
    });
   //  Check connection state
    console.log('✅ Order Service: MongoDB connected');
  } catch (error) {
    console.error('❌ Order Service: MongoDB connection error:', error.message);
    console.log('⏳ Retrying MongoDB connection in 5 seconds...');
    setTimeout(() => connectDB(), 5000);
  }
};

module.exports = connectDB;


// Triggering OIDC deployment pipeline to Azure Container Apps
