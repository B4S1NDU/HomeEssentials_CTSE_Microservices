# # Notification Service

Microservice responsible for handling notifications (email, SMS, in-app) triggered by other microservices.

## 📋 Service Details

- **Port:** 3006
- **Technology:** Node.js + Express.js
- **Database:** MongoDB
- **Email Provider:** Nodemailer (SMTP)

## 🏗️ Architecture

### Synchronous REST Communication
The Notification Service receives HTTP requests from other microservices (User, Order, Payment, Inventory) and sends notifications asynchronously.

**Flow:**
```
User Service (password change)
    ↓
POST /api/notifications/send
    ↓
Notification Service queues email
    ↓
Response returned immediately (non-blocking)
    ↓
Email sent asynchronously
```

## 🔧 Setup & Installation

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Gmail account with App Password (or alternative SMTP service)

### 1. Install Dependencies
```bash
cd notification-service
npm install
```

### 2. Configure Environment Variables
Create `.env` file with:
```env
PORT=3006
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/notification-service?retryWrites=true&w=majority

# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=noreply@homeessentials.com
EMAIL_FROM_NAME=HomeEssentials

# Service URLs (for service-to-service communication)
USER_SERVICE_URL=http://localhost:5000
ORDER_SERVICE_URL=http://localhost:3004
PRODUCT_SERVICE_URL=http://localhost:3002
INVENTORY_SERVICE_URL=http://localhost:3003
PAYMENT_SERVICE_URL=http://localhost:3005

# Logging
LOG_LEVEL=debug
```

### 3. Gmail App Password Setup
1. Enable 2-Factor Authentication on Gmail
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Generate app password for "Mail" and "Windows Computer"
4. Use this password in `.env` as `EMAIL_PASSWORD`

### 4. Run Service
```bash
# Development (with nodemon)
npm run dev

# Production
npm start
```

Service will be available at `http://localhost:3006`

## 📨 Supported Notification Types

1. **USER_REGISTERED** - Welcome email for new users
2. **PASSWORD_CHANGED** - Password change confirmation
3. **ORDER_CREATED** - Order confirmation
4. **ORDER_SHIPPED** - Shipping notification
5. **ORDER_DELIVERED** - Delivery confirmation
6. **ORDER_CANCELLED** - Order cancellation
7. **PAYMENT_SUCCESS** - Payment receipt
8. **PAYMENT_FAILED** - Payment failure alert
9. **LOW_STOCK_ALERT** - Admin stock alert
10. **ACCOUNT_VERIFIED** - Account verification

## 🔗 API Endpoints

### Send Notification
```http
POST /api/notifications/send
Content-Type: application/json

{
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "type": "PASSWORD_CHANGED",
  "message": "Your password was changed",
  "metadata": {
    "orderId": "optional-order-id",
    "amount": 1000
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification queued for delivery",
  "data": {
    "notificationId": "507f1f77bcf86cd799439012",
    "status": "pending"
  }
}
```

### Get Notification
```http
GET /api/notifications/:id
```

### Get User Notifications
```http
GET /api/notifications/user/:userId?page=1&limit=10&status=sent
```

### Mark as Read
```http
PATCH /api/notifications/:id/read
```

### Delete Notification
```http
DELETE /api/notifications/:id
```

### Health Check
```http
GET /health
```

## 🐳 Docker Deployment

### Build Image
```bash
docker build -t notification-service:1.0.0 .
```

### Run Container
```bash
docker run -d \
  --name notification-service \
  -p 3006:3006 \
  --env-file .env \
  notification-service:1.0.0
```

### Docker Compose
```bash
docker-compose up notification-service
```

## 📊 Database Schema

### Notification Collection
```javascript
{
  _id: ObjectId,
  userId: String,
  email: String,
  type: String (enum),
  subject: String,
  message: String,
  channel: String (email/sms/in-app/push),
  status: String (pending/sent/failed/read),
  metadata: Object,
  attempts: Number,
  lastError: String,
  sentAt: Date,
  readAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔐 Security Features

- Input validation & sanitization
- Email validation
- Error handling & logging
- Non-blocking notification delivery
- Best-effort email sending
- Secure SMTP authentication

## 🧪 Testing

### Test with cURL
```bash
curl -X POST http://localhost:3006/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-1",
    "email": "test@example.com",
    "type": "PASSWORD_CHANGED"
  }'
```

## 📝 Notes

- Notifications are sent asynchronously (fire-and-forget pattern)
- Failed emails are logged and stored in database for retry
- Supports custom email templates per notification type
- Service continues operation even if email sending fails

## 🚀 Future Enhancements

- SMS notifications via Twilio
- Push notifications
- In-app notification UI
- Email notification delivery dashboard
- Notification preferences management
- Retry mechanism for failed emails
- Message queue integration (RabbitMQ/Kafka)

Notification Delivery Service for HomeEssentials+

## 📋 Overview

**Assigned to:** Student 4

This service handles sending notifications to users for various system events.

## 🎯 Responsibilities

- Send order confirmation notifications
- Send payment success/failure notifications
- Store notification history
- Support multiple notification channels (Email, SMS - simulated)

## 🔌 API Endpoints (To Implement)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/notifications` | Send notification |
| GET | `/api/notifications/:userId` | Get user notifications |
| GET | `/api/notifications/:id` | Get notification details |

## 💾 Database Schema (Suggested)

```javascript
{
  notificationId: String (unique),
  userId: String,
  title: String,
  message: String,
  type: String (ORDER_CONFIRMED, PAYMENT_SUCCESS, PAYMENT_FAILED),
  channel: String (EMAIL, SMS, PUSH),
  status: String (SENT, FAILED, PENDING),
  metadata: {
    orderId: String,
    amount: Number
  },
  sentAt: Date,
  createdAt: Date
}
```

## 🔄 Notification Flow

1. Receive notification request from Payment Service
2. Format notification message
3. Simulate sending (console.log for demo)
4. Store notification record
5. Return confirmation

## 🔗 Service Communication

### Incoming
- **Payment Service**: Sends payment notifications

### Outgoing
- None (End of chain)

## 🚀 Tech Stack (Recommended)

- Node.js + Express
- MongoDB
- Notification templates

## 📝 Implementation Guide

### Notification Templates

```javascript
const templates = {
  ORDER_CONFIRMED: (data) => ({
    title: 'Order Confirmed',
    message: `Your order #${data.orderId} has been confirmed. Total: LKR ${data.amount}`
  }),
  PAYMENT_SUCCESS: (data) => ({
    title: 'Payment Successful',
    message: `Payment of LKR ${data.amount} was successful.`
  }),
  PAYMENT_FAILED: (data) => ({
    title: 'Payment Failed',
    message: `Payment failed. Please try again.`
  })
};
```

### Simulated Sending

```javascript
const sendNotification = async (notification) => {
  // Simulate email/SMS sending
  console.log('📧 Sending notification:', notification.title);
  console.log('📱 To user:', notification.userId);
  console.log('📝 Message:', notification.message);
  
  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return { status: 'SENT', sentAt: new Date() };
};
```

## 🔮 Future Enhancements

- Integrate real email service (SendGrid, AWS SES)
- Integrate SMS service (Twilio)
- Add push notifications
- Add notification preferences

## Port

**Development:** 3006

---

Keep it simple for MVP. Console logging is acceptable for demo.
