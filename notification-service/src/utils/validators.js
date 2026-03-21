/**
 * Validate send notification input
 */
const validateSendNotification = (data) => {
  const errors = [];

  if (!data.userId || data.userId.trim() === '') {
    errors.push('User ID is required');
  }

  if (!data.email || data.email.trim() === '') {
    errors.push('Email is required');
  } else if (!isValidEmail(data.email)) {
    errors.push('Invalid email format');
  }

  if (!data.type || data.type.trim() === '') {
    errors.push('Notification type is required');
  } else if (!isValidNotificationType(data.type)) {
    errors.push('Invalid notification type');
  }

  return errors;
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate notification type
 */
const isValidNotificationType = (type) => {
  const validTypes = [
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
  ];
  return validTypes.includes(type);
};

module.exports = {
  validateSendNotification,
  isValidEmail,
  isValidNotificationType,
};
