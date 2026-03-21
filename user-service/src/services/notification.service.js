const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006';

const NOTIFICATION_TIMEOUT_MS = Number.parseInt(
  process.env.NOTIFICATION_TIMEOUT_MS || '3000',
  10
);

/**
 * Send USER_REGISTERED event to notification service.
 * This is intentionally best-effort so auth flow is not blocked by notification downtime.
 */
const sendUserRegisteredNotification = async ({ userId, email, firstName, lastName }) => {
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
        type: 'USER_REGISTERED',
        metadata: {
          firstName,
          lastName,
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
  sendUserRegisteredNotification,
};
