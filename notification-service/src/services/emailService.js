const nodemailer = require('nodemailer');

const brandPalette = {
  primary: '#6366F1', // indigo-500
  secondary: '#3B82F6', // blue-500
  accent: '#10B981', // emerald-500
  surface: '#F8FAFC',
  text: '#0F172A',
  muted: '#475569',
};

const buildEmailLayout = ({ title, greeting, bodyHtml }) => `
  <div style="margin:0;padding:24px;background:${brandPalette.surface};font-family:Arial,Helvetica,sans-serif;color:${brandPalette.text};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #E2E8F0;">
      <tr>
        <td style="padding:0;">
          <div style="height:8px;background:linear-gradient(90deg, ${brandPalette.primary} 0%, ${brandPalette.secondary} 55%, ${brandPalette.accent} 100%);"></div>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 24px 8px 24px;">
          <h2 style="margin:0 0 10px 0;color:${brandPalette.primary};font-size:24px;line-height:1.3;">${title}</h2>
          <p style="margin:0;color:${brandPalette.muted};font-size:15px;line-height:1.6;">${greeting}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 24px 24px 24px;">
          <div style="background:#EFF6FF;border-left:4px solid ${brandPalette.secondary};padding:14px 16px;border-radius:8px;color:${brandPalette.text};font-size:14px;line-height:1.7;">
            ${bodyHtml}
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:0 24px 24px 24px;">
          <p style="margin:0;color:${brandPalette.muted};font-size:13px;line-height:1.6;">Best regards,<br/>HomeEssentials+ Team</p>
        </td>
      </tr>
    </table>
  </div>
`;

const formatLkr = (amount) => {
  const numericAmount = Number(amount);
  return Number.isFinite(numericAmount) ? numericAmount.toFixed(2) : '0.00';
};

// Create transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Send email notification
 */
const sendEmail = async (to, subject, htmlContent, textContent = '') => {
  try {
    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html: htmlContent,
      text: textContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✓ Email sent: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('✗ Email sending error:', error.message);
    throw error;
  }
};

/**
 * Email templates for different notification types
 */
const emailTemplates = {
  PASSWORD_CHANGED: (userName) => ({
    subject: 'Your Password Has Been Changed',
    html: buildEmailLayout({
      title: 'Password Change Confirmation',
      greeting: `Hi ${userName},`,
      bodyHtml: `
        <p style="margin:0 0 10px 0;">Your password has been successfully changed on your HomeEssentials+ account.</p>
        <p style="margin:0;">If you did not make this change, please contact our support team immediately.</p>
      `,
    }),
  }),

  USER_REGISTERED: (userName, email) => ({
    subject: 'Welcome to HomeEssentials+',
    html: buildEmailLayout({
      title: 'Welcome to HomeEssentials+',
      greeting: `Hi ${userName},`,
      bodyHtml: `
        <p style="margin:0 0 10px 0;">Thank you for registering with HomeEssentials+.</p>
        <p style="margin:0 0 10px 0;">Your account has been successfully created with email: <strong>${email}</strong>.</p>
        <p style="margin:0;">You can now start shopping for household essentials.</p>
      `,
    }),
  }),

  ORDER_CREATED: (userName, orderId, totalAmount) => ({
    subject: 'Order Confirmation - HomeEssentials+',
    html: buildEmailLayout({
      title: 'Order Confirmation',
      greeting: `Hi ${userName},`,
      bodyHtml: `
        <p style="margin:0 0 10px 0;">Your order has been successfully created.</p>
        <p style="margin:0 0 6px 0;"><strong>Order ID:</strong> ${orderId || 'N/A'}</p>
        <p style="margin:0 0 10px 0;"><strong>Total Amount:</strong> LKR ${formatLkr(totalAmount)}</p>
        <p style="margin:0;">You will receive shipping updates soon.</p>
      `,
    }),
  }),

  ORDER_SHIPPED: (userName, orderId, trackingNumber) => ({
    subject: 'Your Order Has Been Shipped - HomeEssentials+',
    html: buildEmailLayout({
      title: 'Order Shipped',
      greeting: `Hi ${userName},`,
      bodyHtml: `
        <p style="margin:0 0 10px 0;">Great news, your order has been shipped.</p>
        <p style="margin:0 0 6px 0;"><strong>Order ID:</strong> ${orderId || 'N/A'}</p>
        <p style="margin:0 0 10px 0;"><strong>Tracking Number:</strong> ${trackingNumber || 'N/A'}</p>
        <p style="margin:0;">You can track your delivery status using the tracking number above.</p>
      `,
    }),
  }),

  PAYMENT_SUCCESS: (userName, orderId, paymentAmount) => ({
    subject: 'Payment Successful - HomeEssentials+',
    html: buildEmailLayout({
      title: 'Payment Receipt',
      greeting: `Hi ${userName},`,
      bodyHtml: `
        <p style="margin:0 0 10px 0;">Your payment has been successfully processed.</p>
        <p style="margin:0 0 6px 0;"><strong>Order ID:</strong> ${orderId || 'N/A'}</p>
        <p style="margin:0 0 10px 0;"><strong>Amount Paid:</strong> LKR ${formatLkr(paymentAmount)}</p>
        <p style="margin:0;">Your order will be prepared for shipping shortly.</p>
      `,
    }),
  }),

  PAYMENT_FAILED: (userName, orderId, reason) => ({
    subject: 'Payment Failed - Action Required - HomeEssentials+',
    html: buildEmailLayout({
      title: 'Payment Failed',
      greeting: `Hi ${userName},`,
      bodyHtml: `
        <p style="margin:0 0 10px 0;">Unfortunately, your payment could not be processed.</p>
        <p style="margin:0 0 6px 0;"><strong>Order ID:</strong> ${orderId || 'N/A'}</p>
        <p style="margin:0 0 10px 0;"><strong>Reason:</strong> ${reason || 'Payment declined'}</p>
        <p style="margin:0;">Please try again with a different payment method or contact support.</p>
      `,
    }),
  }),

  LOW_STOCK_ALERT: (productName, currentStock, threshold) => ({
    subject: 'Low Stock Alert - HomeEssentials+',
    html: buildEmailLayout({
      title: 'Low Stock Alert',
      greeting: 'Hi Team,',
      bodyHtml: `
        <p style="margin:0 0 10px 0;">The following product is running low on stock.</p>
        <p style="margin:0 0 6px 0;"><strong>Product:</strong> ${productName || 'N/A'}</p>
        <p style="margin:0 0 6px 0;"><strong>Current Stock:</strong> ${currentStock ?? 'N/A'}</p>
        <p style="margin:0 0 10px 0;"><strong>Threshold:</strong> ${threshold ?? 'N/A'}</p>
        <p style="margin:0;">Please consider restocking this item soon.</p>
      `,
    }),
  }),
};

module.exports = {
  sendEmail,
  emailTemplates,
};
