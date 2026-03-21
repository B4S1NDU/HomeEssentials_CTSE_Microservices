const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const addressSnapshotSchema = new mongoose.Schema(
  {
    line1: { type: String, default: '' },
    line2: { type: String, default: '' },
    city: { type: String, default: '' },
    district: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    country: { type: String, default: '' }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, unique: true, required: true },
    userId: { type: String, required: true },
    /** Snapshot at order time (for display without calling User Service) */
    customerName: { type: String, default: '' },
    deliveryAddress: { type: addressSnapshotSchema, default: undefined },
    /** Admin-set estimated delivery window */
    deliveryWindowStart: { type: Date },
    deliveryWindowEnd: { type: Date },
    items: { type: [orderItemSchema], required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'CANCELLED'],
      default: 'PENDING'
    },
    paymentId: { type: String },
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Order', orderSchema);

