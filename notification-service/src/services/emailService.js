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
    html: `
      <div style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
        
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;">
          
          <!-- HEADER -->
          <tr>
            <td style="background:#3B5BDB;text-align:center;padding:30px 20px;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;">Low Stock Alert</h1>
              <p style="margin:5px 0 0 0;color:#dbe4ff;font-size:14px;">Inventory notification</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:30px 25px;">
              <h2 style="margin:0 0 10px 0;color:#1e293b;font-size:22px;">
                Inventory Threshold Reached
              </h2>

              <p style="color:#64748b;font-size:15px;margin-bottom:20px;">
                Hi Team,
              </p>

              <!-- CARD -->
              <div style="background:#f8fafc;border-radius:10px;padding:20px;">
                <p style="margin:0 0 10px 0;font-size:15px;">
                  <strong>${productName || 'Product'}</strong> has reached the low stock threshold.
                </p>

                <p style="margin:0 0 5px 0;"><strong>Current Stock:</strong> ${currentStock ?? 'N/A'}</p>
                <p style="margin:0;"><strong>Threshold:</strong> ${threshold ?? 'N/A'}</p>
              </div>

              <!-- BUTTON -->
              <div style="text-align:center;margin-top:25px;">
                <a href="#" style="
                  background:#3B5BDB;
                  color:#ffffff;
                  text-decoration:none;
                  padding:12px 22px;
                  border-radius:6px;
                  font-weight:600;
                  display:inline-block;
                ">
                  Alert Retailers
                </a>
              </div>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#2d3748;padding:30px 20px;text-align:center;">
              <!-- Social Icons -->
              <p style="margin:0 0 15px 0;font-size:13px;color:#cbd5e0;font-weight:600;">Follow Us On</p>
              <div style="margin:0 0 20px 0;">
                <a href="#" style="display:inline-block;margin:0 8px;text-decoration:none;">
                  <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='%234a5568'%3E%3Cpath d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z'/%3E%3C/svg%3E" alt="Facebook" style="display:block;width:24px;height:24px;">
                </a>
                <a href="#" style="display:inline-block;margin:0 8px;text-decoration:none;">
                  <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='%234a5568'%3E%3Cpath d='M23.953 4.57a10 10 0 002.856-10.03 10 10 0 01-2.856 2.856c-.026.044-.052.087-.079.131l-.012-.006a10 10 0 01-1.675-1.675l-.006-.012c.044-.027.087-.053.131-.079a10 10 0 002.856-2.856l-2.829 2.83A10 10 0 0012 0c-5.513 0-10 4.487-10 10s4.487 10 10 10 10-4.487 10-10c0-1.675-.413-3.263-1.148-4.657l2.101 2.101c.735 1.395 1.148 2.982 1.148 4.657 0 5.513-4.487 10-10 10S2 15.513 2 10 6.487 0 12 0c1.675 0 3.263.413 4.657 1.148l-2.101-2.101C15.263.413 13.675 0 12 0z'/%3E%3C/svg%3E" alt="Twitter" style="display:block;width:24px;height:24px;">
                </a>
                <a href="#" style="display:inline-block;margin:0 8px;text-decoration:none;">
                  <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='%234a5568'%3E%3Cpath d='M20.447 20.452h-3.554v-5.569c0-1.328-.474-2.237-1.776-2.237-.968 0-1.522.651-1.769 1.281-.091.223-.114.535-.114.847v5.678h-3.554s.045-9.206 0-10.158h3.554v1.437c.469-.72 1.303-1.748 3.168-1.748 2.314 0 4.045 1.513 4.045 4.769v5.7zM5.337 8.855c-1.144 0-1.915-.759-1.915-1.71 0-.955.77-1.71 1.958-1.71 1.187 0 1.912.755 1.937 1.71 0 .951-.75 1.71-1.98 1.71zm1.946 11.597H3.392V9.294h3.891v11.158zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'/%3E%3C/svg%3E" alt="LinkedIn" style="display:block;width:24px;height:24px;">
                </a>
                <a href="#" style="display:inline-block;margin:0 8px;text-decoration:none;">
                  <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='%234a5568'%3E%3Ccircle cx='12' cy='12' r='1'/%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z'/%3E%3C/svg%3E" alt="Pinterest" style="display:block;width:24px;height:24px;">
                </a>
              </div>

              <!-- Newsletter Text -->
              <p style="margin:0 0 10px 0;font-size:12px;color:#a0aec0;">
                You are receiving this email as you signed up for our newsletters.
              </p>
              <p style="margin:0 0 8px 0;font-size:12px;color:#a0aec0;">
                Want to change how you receive these emails?
              </p>
              <p style="margin:0 0 15px 0;font-size:12px;color:#a0aec0;">
                You can <a href="#" style="color:#3B5BDB;text-decoration:underline;">Unsubscribe</a> or <a href="#" style="color:#3B5BDB;text-decoration:underline;">Update your preferences</a>
              </p>

              <!-- Brand Footer -->
              <hr style="border:none;border-top:1px solid #4a5568;margin:15px 0;">
              <p style="margin:10px 0 0 0;font-size:13px;color:#cbd5e0;font-weight:600;">
                HomeEssentials+ Team
              </p>
              <p style="margin:5px 0 0 0;font-size:12px;color:#a0aec0;">
                Managing your inventory efficiently
              </p>
            </td>
          </tr>

        </table>
      </div>
    `,
  }),
};

module.exports = {
  sendEmail,
  emailTemplates,
};
