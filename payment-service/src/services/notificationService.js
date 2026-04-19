const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006';

const NOTIFICATION_TIMEOUT_MS = Number.parseInt(
  process.env.NOTIFICATION_TIMEOUT_MS || '3000',
  10
);

const sendPaymentNotification = async ({
  userId,
  email,
  type,
  orderId,
  amount,
  reason,
  userName,
}) => {
  if (!userId || !email || !type) {
    console.warn('Skipping notification due to missing required fields');
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), NOTIFICATION_TIMEOUT_MS);

  try {
    const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        email,
        type,
        metadata: {
          orderId,
          amount: amount ? amount / 100 : 0, // Convert from cents to main unit for display
          reason,
          userName: userName || email.split('@')[0] || userId,
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.error(
        `Notification service returned ${response.status}: ${responseText || 'Unknown error'}`
      );
    }
  } catch (error) {
    console.error('Failed to call notification service:', error.message);
  } finally {
    clearTimeout(timeout);
  }
};

module.exports = {
  sendPaymentNotification,
};
