const nodemailer = require('nodemailer');

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
    html: `
      <h2>Password Change Confirmation</h2>
      <p>Hi ${userName},</p>
      <p>Your password has been successfully changed on your HomeEssentials+ account.</p>
      <p>If you did not make this change, please contact our support team immediately.</p>
      <br/>
      <p>Best regards,<br/>HomeEssentials+ Team</p>
    `,
  }),

  USER_REGISTERED: (userName, email) => ({
    subject: 'Welcome to HomeEssentials+',
    html: `
      <h2>Welcome to HomeEssentials+</h2>
      <p>Hi ${userName},</p>
      <p>Thank you for registering with HomeEssentials+!</p>
      <p>Your account has been successfully created with email: <strong>${email}</strong></p>
      <p>You can now start shopping for household essentials.</p>
      <br/>
      <p>Best regards,<br/>HomeEssentials+ Team</p>
    `,
  }),

  ORDER_CREATED: (userName, orderId, totalAmount) => ({
    subject: 'Order Confirmation - HomeEssentials+',
    html: `
      <h2>Order Confirmation</h2>
      <p>Hi ${userName},</p>
      <p>Your order has been successfully created!</p>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Total Amount:</strong> LKR ${totalAmount.toFixed(2)}</p>
      <p>You will receive shipping updates soon.</p>
      <br/>
      <p>Best regards,<br/>HomeEssentials+ Team</p>
    `,
  }),

  ORDER_SHIPPED: (userName, orderId, trackingNumber) => ({
    subject: 'Your Order Has Been Shipped - HomeEssentials+',
    html: `
      <h2>Order Shipped</h2>
      <p>Hi ${userName},</p>
      <p>Great news! Your order has been shipped.</p>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Tracking Number:</strong> ${trackingNumber || 'N/A'}</p>
      <p>You can track your delivery status using the tracking number above.</p>
      <br/>
      <p>Best regards,<br/>HomeEssentials+ Team</p>
    `,
  }),

  PAYMENT_SUCCESS: (userName, orderId, paymentAmount) => ({
    subject: 'Payment Successful - HomeEssentials+',
    html: `
      <h2>Payment Receipt</h2>
      <p>Hi ${userName},</p>
      <p>Your payment has been successfully processed!</p>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Amount Paid:</strong> LKR ${paymentAmount.toFixed(2)}</p>
      <p>Your order will be prepared for shipping shortly.</p>
      <br/>
      <p>Best regards,<br/>HomeEssentials+ Team</p>
    `,
  }),

  PAYMENT_FAILED: (userName, orderId, reason) => ({
    subject: 'Payment Failed - Action Required - HomeEssentials+',
    html: `
      <h2>Payment Failed</h2>
      <p>Hi ${userName},</p>
      <p>Unfortunately, your payment for order <strong>${orderId}</strong> could not be processed.</p>
      <p><strong>Reason:</strong> ${reason || 'Payment declined'}</p>
      <p>Please try again with a different payment method or contact support.</p>
      <br/>
      <p>Best regards,<br/>HomeEssentials+ Team</p>
    `,
  }),

  LOW_STOCK_ALERT: (productName, currentStock, threshold) => ({
    subject: 'Low Stock Alert - HomeEssentials+',
    html: `
      <h2>Low Stock Alert</h2>
      <p>The following product is running low on stock:</p>
      <p><strong>Product:</strong> ${productName}</p>
      <p><strong>Current Stock:</strong> ${currentStock}</p>
      <p><strong>Threshold:</strong> ${threshold}</p>
      <p>Please consider restocking this item soon.</p>
      <br/>
      <p>Best regards,<br/>HomeEssentials+ Admin Team</p>
    `,
  }),
};

module.exports = {
  sendEmail,
  emailTemplates,
};
