# Order Service

Order Management & Orchestration Service for HomeEssentials+

## 📋 Overview

**Assigned to:** Student 2

This is the core orchestrator service that manages the complete order lifecycle and coordinates with other services.

## 🎯 Responsibilities

- Manage order creation
- Orchestrate order flow
- Coordinate with User, Product, Inventory, and Payment services
- Order status management
- Order history

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Create new order |
| GET | `/api/orders/:id` | Get order details |
| GET | `/api/orders/user/:userId` | Get user's orders |
| PUT | `/api/orders/:id/status` | Update order status |

## 💾 Database Schema (Suggested)

```javascript
{
  orderId: String (unique),
  userId: String,
  items: [{
    productId: String,
    productName: String,
    quantity: Number,
    price: Number
  }],
  totalAmount: Number,
  status: String (PENDING, CONFIRMED, CANCELLED),
  paymentId: String,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔄 Order Flow Logic

### When creating an order:

1. **Validate User** → Call User Service `GET /api/users/:userId`
2. **Validate Products** → Call Product Service `GET /api/products/:productId`
3. **Check Stock** → Call Inventory Service `POST /api/inventory/check`
4. **Reserve Stock** → Call Inventory Service `POST /api/inventory/reserve`
5. **Process Payment** → Call Payment Service `POST /api/payments`
6. **Handle Payment Result:**
   - **If SUCCESS**: 
     - Call Inventory Service `POST /api/inventory/deduct`
     - Update order status to CONFIRMED
   - **If FAILED**:
     - Call Inventory Service `POST /api/inventory/release`
     - Update order status to CANCELLED

## 🔗 Service Communication

This service communicates with ALL other services:
- User Service
- Product Service
- Inventory Service
- Payment Service

## 🚀 Tech Stack (Recommended)

- Node.js + Express
- MongoDB
- Axios for HTTP calls
- Error handling & retry logic

## 📝 Implementation Notes

- Implement proper error handling for each external call
- Add retry logic for failed service calls
- Consider implementing circuit breaker pattern
- Handle race conditions

## Port

**Development:** 3004

---

**IMPORTANT:** This is the most complex service. Plan carefully and test integrations thoroughly.
