const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
    index: true
  },
  orderId: {
    type: String,
    required: true,
    index: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'RELEASED', 'EXPIRED'],
    default: 'PENDING'
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Index for finding expired reservations
reservationSchema.index({ expiresAt: 1, status: 1 });

const Reservation = mongoose.model('Reservation', reservationSchema);

module.exports = Reservation;
