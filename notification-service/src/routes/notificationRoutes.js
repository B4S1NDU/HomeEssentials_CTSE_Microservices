const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const notificationController = require('../controllers/notificationController');

/**
 * POST /api/notifications/send
 * Send a notification (called by other microservices)
 */
router.post(
  '/send',
  [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('type')
      .notEmpty()
      .isIn([
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
      ])
      .withMessage('Invalid notification type'),
  ],
  notificationController.sendNotification
);

/**
 * GET /api/notifications/:id
 * Get notification by ID
 */
router.get('/:id', notificationController.getNotificationById);

/**
 * GET /api/notifications/user/:userId
 * Get all notifications for a user
 */
router.get('/user/:userId', notificationController.getUserNotifications);

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read
 */
router.patch('/:id/read', notificationController.markAsRead);

/**
 * DELETE /api/notifications/:id
 * Delete notification
 */
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
