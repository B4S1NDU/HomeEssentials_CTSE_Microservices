const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    type: {
      type: String,
      enum: [
        'PASSWORD_CHANGED',
        'USER_REGISTERED',
        'ORDER_CREATED',
        'ORDER_SHIPPED',
        'ORDER_DELIVERED',
        'ORDER_CANCELLED',
        'PAYMENT_SUCCESS',
        'PAYMENT_FAILED',
        'LOW_STOCK_ALERT',
        'ACCOUNT_VERIFIED',
      ],
      required: true,
    },
    subject: String,
    message: String,
    channel: {
      type: String,
      enum: ['email', 'sms', 'in-app', 'push'],
      default: 'email',
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed', 'read'],
      default: 'pending',
    },
    metadata: {
      orderId: String,
      productId: String,
      amount: Number,
      reason: String,
      firstName: String,
      lastName: String,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    lastError: String,
    sentAt: Date,
    readAt: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
