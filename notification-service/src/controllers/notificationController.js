const Notification = require('../models/Notification');
const { successResponse } = require('../utils/response');
const { sendEmail, emailTemplates } = require('../services/emailService');
const { validateSendNotification } = require('../utils/validators');

/**
 * Send notification
 * Receives notification request from other services and sends it
 */
const sendNotification = async (req, res, next) => {
  try {
    const { userId, email, type, message, metadata } = req.body;

    // Validate input
    const validationErrors = validateSendNotification(req.body);
    if (validationErrors.length > 0) {
      const error = new Error(validationErrors.join('; '));
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    // Create notification record
    const notification = await Notification.create({
      userId,
      email,
      type,
      message,
      metadata,
      status: 'pending',
      channel: 'email',
    });

    // Send email (non-blocking, set to async)
    sendEmailAsync(notification, type).catch((error) => {
      console.error(`Failed to send email for notification ${notification._id}:`, error.message);
    });

    res.status(201).json(
      successResponse(
        {
          notificationId: notification._id,
          status: notification.status,
        },
        'Notification queued for delivery'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to send email asynchronously
 */
const sendEmailAsync = async (notification, type) => {
  try {
    let emailContent = {};

    // Get email template based on type
    if (type === 'PASSWORD_CHANGED') {
      emailContent = emailTemplates.PASSWORD_CHANGED(notification.userId);
    } else if (type === 'USER_REGISTERED') {
      const firstName = notification.metadata?.firstName || '';
      const lastName = notification.metadata?.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim() || notification.userId;
      emailContent = emailTemplates.USER_REGISTERED(fullName, notification.email);
    } else if (type === 'ORDER_CREATED') {
      emailContent = emailTemplates.ORDER_CREATED(
        notification.userId,
        notification.metadata?.orderId,
        notification.metadata?.amount
      );
    } else if (type === 'ORDER_SHIPPED') {
      emailContent = emailTemplates.ORDER_SHIPPED(
        notification.userId,
        notification.metadata?.orderId,
        notification.metadata?.trackingNumber
      );
    } else if (type === 'PAYMENT_SUCCESS') {
      emailContent = emailTemplates.PAYMENT_SUCCESS(
        notification.userId,
        notification.metadata?.orderId,
        notification.metadata?.amount
      );
    } else if (type === 'PAYMENT_FAILED') {
      emailContent = emailTemplates.PAYMENT_FAILED(
        notification.userId,
        notification.metadata?.orderId,
        notification.metadata?.reason
      );
    } else if (type === 'LOW_STOCK_ALERT') {
      emailContent = emailTemplates.LOW_STOCK_ALERT(
        notification.metadata?.productName,
        notification.metadata?.currentStock,
        notification.metadata?.threshold
      );
    } else {
      emailContent = {
        subject: 'HomeEssentials+ Notification',
        html: notification.message || 'You have a new notification',
      };
    }

    // Send email
    await sendEmail(notification.email, emailContent.subject, emailContent.html);

    // Update notification status
    notification.status = 'sent';
    notification.sentAt = new Date();
    notification.lastError = null;
    await notification.save();

    console.log(`✓ Notification ${notification._id} sent successfully`);
  } catch (error) {
    // Update notification with error
    notification.status = 'failed';
    notification.attempts += 1;
    notification.lastError = error.message;
    await notification.save();

    console.error(`✗ Failed to send notification ${notification._id}: ${error.message}`);
    throw error;
  }
};

/**
 * Get notification by ID
 */
const getNotificationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findById(id);

    if (!notification) {
      const error = new Error('Notification not found');
      error.statusCode = 404;
      error.code = 'NOTIFICATION_NOT_FOUND';
      throw error;
    }

    res.status(200).json(successResponse(notification));
  } catch (error) {
    next(error);
  }
};

/**
 * Get all notifications for a user
 */
const getUserNotifications = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const skip = (page - 1) * limit;

    // Build filter
    const filter = { userId };
    if (status) {
      filter.status = status;
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(filter);

    res.status(200).json(
      successResponse({
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Mark notification as read
 */
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      id,
      {
        status: 'read',
        readAt: new Date(),
      },
      { new: true }
    );

    if (!notification) {
      const error = new Error('Notification not found');
      error.statusCode = 404;
      error.code = 'NOTIFICATION_NOT_FOUND';
      throw error;
    }

    res.status(200).json(successResponse(notification, 'Notification marked as read'));
  } catch (error) {
    next(error);
  }
};

/**
 * Delete notification
 */
const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndDelete(id);

    if (!notification) {
      const error = new Error('Notification not found');
      error.statusCode = 404;
      error.code = 'NOTIFICATION_NOT_FOUND';
      throw error;
    }

    res.status(200).json(successResponse(null, 'Notification deleted successfully'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendNotification,
  getNotificationById,
  getUserNotifications,
  markAsRead,
  deleteNotification,
};
