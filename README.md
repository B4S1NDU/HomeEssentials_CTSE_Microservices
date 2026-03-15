# HomeEssentials+ Cloud-Native Household Ordering System

A cloud-native microservices-based e-commerce platform for household essentials built with DevOps and DevSecOps practices. All 6 services are independently deployed on Microsoft Azure and seamlessly integrate to form a complete end-to-end order management system.

## 🏗️ System Architecture

### Microservices (6 Services, 4 Students)

| Service | Student | Technology | Port | Responsibility |
|---------|---------|------------|------|----------------|
| **User Service** | Student 1 | Node.js + Express | 3001 | User authentication & authorization |
| **Product Service** | **Your Service** | Node.js + Express | 3002 | Product catalog management |
| **Inventory Service** | **Your Service** | Node.js + Express | 3003 | Stock & inventory management with reservation system |
| **Order Service** | Student 2 | Node.js + Express | 3004 | Order orchestration & lifecycle management |
| **Payment Service** | Student 3 | Node.js + Express | 3005 | Payment processing & transaction handling |
| **Notification Service** | Student 4 | Node.js + Express | 3006 | Notification delivery to users |

---

## 🔄 Inter-Service Communication Architecture

### Communication Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    AZURE CONTAINER APPS                         │
│                     (Shared Environment)                        │
└─────────────────────────────────────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
    ┌───▼────┐           ┌─────▼─────┐          ┌────▼──┐
    │ User   │           │  Product  │          │Inventory
    │Service │           │ Service   │          │Service
    │        │           │           │          │
    │        │◄──────────┤ (Catalog) │          │ (Stock)
    │Port3001│  Auth     │ Port 3002 ├──────────►Port 3003
    │        │  Check    │           │ SKU Data │
    │        │           │ Endpoints │ Lookup   │
    └────┬───┘           └────┬──────┘          └────┬───┘
         │                    │                      │
         │                    │                      │
         │                Order Service              │
         │              (Port 3004)                  │
         │              - Orchestrates order flow    │
         │              - Calls all services         │
         │              - Maintains order state      │
         │                                           │
         ├─────────────────────┬─────────────────────┤
         │                     │                     │
    ┌────▼────┐          ┌─────▼─────┐         ┌────▼──────┐
    │ Payment │          │Notification│        │  Logging  │
    │ Service │          │  Service   │        │ & Events  │
    │         │          │            │        │           │
    │Port 3005│◄─────────┤ Port 3006  │        │           │
    │         │  Status  │            │        │           │
    │  Process│ Updates  │  Send      │        │           │
    │ Payment │          │ Emails/SMS │        │           │
    └────┬────┘          └──────┬─────┘        └───────────┘
         │                     │
         └─────────────────────┘
```

### Service Communication Patterns

| From Service | To Service | Purpose | Call Type | Example |
|---|---|---|---|---|
| **Order Service** | Product Service | Fetch product details, price, availability | HTTP GET | `GET /api/products/{id}` |
| **Order Service** | Inventory Service | Check stock, reserve items | HTTP POST | `POST /api/inventory/reserve` |
| **Order Service** | User Service | Validate customer, get user info | HTTP GET | `GET /api/users/{id}` |
| **Order Service** | Payment Service | Process payment | HTTP POST | `POST /api/payments/process` |
| **Payment Service** | Notification Service | Send payment status | HTTP POST | `POST /api/notifications/send` |
| **Order Service** | Notification Service | Send order confirmation | HTTP POST | `POST /api/notifications/send` |
| **Inventory Service** | Notification Service | Low stock alert | HTTP POST | `POST /api/notifications/alert` |

---

## 📋 End-to-End Order Flow (Inter-Service Communication Example)

### Scenario: Customer Places an Order

**Step-by-step service communication:**

#### 1️⃣ **User authenticates with User Service**
```
Client → User Service
POST /api/auth/login
{
  "email": "customer@example.com",
  "password": "password123"
}

User Service → Client (Returns JWT Token)
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "userId": "user-123"
}
```

#### 2️⃣ **Client requests product details from Product Service**
```
Client → Product Service (with JWT token)
GET /api/products/prod-456
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

Product Service → Client
{
  "id": "prod-456",
  "name": "Rice - 10kg Bag",
  "price": 25.99,
  "category": "Groceries",
  "description": "Premium quality rice"
}
```

#### 3️⃣ **Order Service initiates order creation (Main Orchestrator)**
```
Client → Order Service (Triggers order placement)
POST /api/orders
{
  "userId": "user-123",
  "items": [
    { "productId": "prod-456", "quantity": 2 }
  ]
}

🔄 Order Service now orchestrates the entire flow:
```

#### 4️⃣ **Order Service → Product Service (Get current price & details)**
```
Order Service → Product Service
GET /api/products/prod-456

Product Service → Order Service
{
  "id": "prod-456",
  "name": "Rice - 10kg Bag",
  "price": 25.99,
  "stock": true
}

✅ Order Service keeps this in order context
```

#### 5️⃣ **Order Service → Inventory Service (Reserve stock)**
```
Order Service → Inventory Service
POST /api/inventory/reserve
{
  "productId": "prod-456",
  "quantity": 2,
  "orderId": "order-789"
}

Inventory Service Checks:
- Current stock: 50 bags
- Required: 2 bags
- Action: Reserve 2 bags, return reservation ID

Inventory Service → Order Service
{
  "success": true,
  "reservationId": "resv-123",
  "reservedUntil": "2026-03-16T12:00:00Z"
}

✅ Order Service notes stock is reserved
```

#### 6️⃣ **Order Service → User Service (Validate customer credit)**
```
Order Service → User Service
GET /api/users/user-123/credit-limit

User Service → Order Service
{
  "creditLimit": 1000,
  "currentUsage": 150,
  "available": 850
}

✅ Order total: $51.98 ✓ Within limit
```

#### 7️⃣ **Order Service → Payment Service (Process payment)**
```
Order Service → Payment Service
POST /api/payments/process
{
  "orderId": "order-789",
  "userId": "user-123",
  "amount": 51.98,
  "paymentMethod": "credit_card"
}

Payment Service Processes:
- Charges customer credit card
- Records transaction
- Updates payment status

Payment Service → Order Service
{
  "transactionId": "txn-456",
  "status": "COMPLETED",
  "timestamp": "2026-03-15T10:30:45Z"
}

✅ Payment successful
```

#### 8️⃣ **Order Service → Inventory Service (Deduct stock)**
```
Order Service → Inventory Service
POST /api/inventory/deduct
{
  "productId": "prod-456",
  "quantity": 2,
  "orderId": "order-789",
  "reservationId": "resv-123"
}

Inventory Service:
- Confirms reservation matches
- Deducts 2 bags from stock (50 → 48)
- Releases reservation
- Logs transaction

Inventory Service → Order Service
{
  "success": true,
  "newStock": 48,
  "deductedQuantity": 2
}

✅ Stock updated
```

#### 9️⃣ **Order Service → Notification Service (Send confirmation email)**
```
Order Service → Notification Service
POST /api/notifications/send
{
  "recipientId": "user-123",
  "type": "ORDER_CONFIRMATION",
  "orderId": "order-789",
  "data": {
    "customerName": "John Doe",
    "orderTotal": 51.98,
    "estimatedDelivery": "2026-03-17"
  }
}

Notification Service:
- Composes email template
- Sends via email provider
- Logs notification
- Tracks delivery status

Notification Service → Order Service
{
  "notificationId": "notif-789",
  "status": "SENT",
  "sentAt": "2026-03-15T10:30:50Z"
}

✅ Confirmation email sent to customer
```

#### 🔟 **Payment Service → Notification Service (Payment receipt)**
```
Payment Service → Notification Service
POST /api/notifications/send
{
  "recipientId": "user-123",
  "type": "PAYMENT_RECEIPT",
  "orderId": "order-789",
  "data": {
    "transactionId": "txn-456",
    "amount": 51.98,
    "date": "2026-03-15"
  }
}

Notification Service sends payment receipt email
```

#### 1️⃣1️⃣ **Order Service → Client (Order confirmation response)**
```
Order Service → Client
{
  "orderId": "order-789",
  "status": "CONFIRMED",
  "items": [
    {
      "productId": "prod-456",
      "productName": "Rice - 10kg Bag",
      "quantity": 2,
      "unitPrice": 25.99,
      "subtotal": 51.98
    }
  ],
  "total": 51.98,
  "paymentStatus": "COMPLETED",
  "estimatedDelivery": "2026-03-17T18:00:00Z",
  "confirmationNumber": "CONF-789-RICE",
  "createdAt": "2026-03-15T10:30:45Z"
}
```

---

### Sequence Summary (All Service Calls in Order)

```
User Service:        Token Generation
                     ↓
Product Service:     Fetch Product Details (2 calls - browse + order processing)
                     ↓
Order Service:       Orchestrates entire flow
                     ├─→ Product Service (Get price)
                     ├─→ Inventory Service (Reserve stock)
                     ├─→ User Service (Validate credit)
                     ├─→ Payment Service (Process payment)
                     ├─→ Inventory Service (Deduct stock)
                     ├─→ Notification Service (Send confirmation)
                     └─→ Return final order confirmation
                     ↓
Payment Service:     Optional Payment Notification
                     ├─→ Notification Service (Send receipt)
                     └─→ Update order status
```

---

## 🔌 API Communication Examples

### Example 1: Order Service Calling Inventory Service

**Request:**
```javascript
// From: order-service/src/controllers/orderController.js
const axios = require('axios');

async function reserveInventory(productId, quantity, orderId) {
  try {
    const response = await axios.post(
      `${process.env.INVENTORY_SERVICE_URL}/api/inventory/reserve`,
      {
        productId,
        quantity,
        orderId
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.SERVICE_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      }
    );
    return response.data;
  } catch (error) {
    console.error('Inventory Service Error:', error.message);
    throw new Error('Failed to reserve inventory');
  }
}
```

**Response Handling:**
```javascript
// Continue with order creation
const reservation = await reserveInventory('prod-456', 2, 'order-789');

if (reservation.success) {
  // Proceed to payment
  await processPayment(orderId, amount);
} else {
  // Rollback and notify customer
  await cancelOrder(orderId, 'Out of stock');
}
```

### Example 2: Inventory Service Auto-Notification for Low Stock

**Inventory Service Logic:**
```javascript
// From: inventory-service/src/controllers/inventoryController.js

async function updateStock(productId, newStock) {
  // Update database
  await Inventory.updateOne(
    { productId },
    { stock: newStock, updatedAt: new Date() }
  );

  // Check if stock is low
  if (newStock < THRESHOLD) {
    // Automatically notify
    await notificationService.sendAlert({
      type: 'LOW_STOCK_ALERT',
      productId,
      currentStock: newStock,
      threshold: THRESHOLD
    });
  }
}
```

### Example 3: Payment Service Triggering Multiple Notifications

```javascript
// From: payment-service/src/controllers/paymentController.js

async function processPayment(orderId, userId, amount) {
  // Process payment with payment gateway
  const transaction = await chargeCard(amount);

  if (transaction.success) {
    // Send multiple notifications
    
    // 1. Notify customer
    await notificationService.sendNotification({
      recipientId: userId,
      type: 'PAYMENT_SUCCESS',
      data: { amount, orderId, transactionId: transaction.id }
    });

    // 2. Notify admin
    await notificationService.sendNotification({
      recipientId: 'admin',
      type: 'PAYMENT_RECEIVED',
      data: { amount, orderId, customerId: userId }
    });

    // 3. Update order status
    await orderService.updateOrderStatus(orderId, 'PAID');
  } else {
    // Notify payment failure
    await notificationService.sendNotification({
      recipientId: userId,
      type: 'PAYMENT_FAILED',
      data: { amount, orderId, reason: transaction.error }
    });
  }
}
```

---

## 🌐 Service URLs in Azure

When deployed to Azure Container Apps, services are accessible via public HTTPS URLs:

```
Product Service:       https://product-service.xxx.eastus.azurecontainerapps.io
Inventory Service:     https://inventory-service.xxx.eastus.azurecontainerapps.io
User Service:          https://user-service.xxx.eastus.azurecontainerapps.io
Order Service:         https://order-service.xxx.eastus.azurecontainerapps.io
Payment Service:       https://payment-service.xxx.eastus.azurecontainerapps.io
Notification Service:  https://notification-service.xxx.eastus.azurecontainerapps.io
```

### Service Discovery (Environment Variables)

Each service uses environment variables to locate other services:

```bash
# In Order Service Container
PRODUCT_SERVICE_URL=https://product-service.xxx.eastus.azurecontainerapps.io
INVENTORY_SERVICE_URL=https://inventory-service.xxx.eastus.azurecontainerapps.io
USER_SERVICE_URL=https://user-service.xxx.eastus.azurecontainerapps.io
PAYMENT_SERVICE_URL=https://payment-service.xxx.eastus.azurecontainerapps.io
NOTIFICATION_SERVICE_URL=https://notification-service.xxx.eastus.azurecontainerapps.io
```

---

## 🔁 Error Handling & Resilience

### Circuit Breaker Pattern

Services implement circuit breaker to handle failures:

```javascript
// If Inventory Service is down, Order Service doesn't crash
try {
  const reservation = await inventoryService.reserve(productId, qty);
} catch (error) {
  if (error.code === 'SERVICE_UNAVAILABLE') {
    // Option 1: Retry with exponential backoff
    await retryWithBackoff(() => inventoryService.reserve(productId, qty));
    
    // Option 2: Use fallback
    logger.warn('Inventory Service down, using cache');
    return cachedReservation;
    
    // Option 3: Fail gracefully
    throw new Error('Service temporarily unavailable, try again later');
  }
}
```

### Compensation for Failed Transactions

When a later step fails, Order Service compensates earlier calls:

```javascript
async function createOrder(userId, items) {
  const order = await db.orders.create({ userId, items, status: 'PENDING' });
  
  try {
    // Step 1: Reserve inventory
    const reservation = await inventoryService.reserve(items);
    
    // Step 2: Process payment
    const payment = await paymentService.charge(amount);
    
    // Step 3: Update order status
    order.status = 'CONFIRMED';
    await order.save();
    
  } catch (error) {
    // Compensation: Release reserved inventory if payment fails
    if (reservation) {
      await inventoryService.release(reservation.id);
    }
    
    // Set order to failed
    order.status = 'FAILED';
    await order.save();
    
    throw error;
  }
}
```

---

## 🚀 Tech Stack

- **Backend:** Node.js 18+ + Express.js
- **Database:** MongoDB Atlas (separate DB per service - no database coupling)
- **Containerization:** Docker (Multi-stage builds, Alpine images, Non-root users)
- **Container Registry:** Azure Container Registry (ACR)
- **Cloud Orchestration:** Azure Container Apps (Managed Kubernetes alternative)
- **CI/CD:** GitHub Actions (3-stage: Quality → Build → Deploy)
- **Security:**
  - JWT authentication with role-based access control (RBAC)
  - bcrypt password hashing
  - Azure Key Vault for secrets management
  - SonarCloud for code quality analysis
  - Snyk for dependency vulnerability scanning
  - Trivy for container image scanning
  - HTTPS enforced via Azure Container Apps ingress
- **API Documentation:** Swagger/OpenAPI
- **Monitoring:** Azure Monitor + Log Analytics Workspace
- **Communication:** RESTful APIs with HTTP/HTTPS

## 📁 Project Structure

```
HomeEssentials_CTSE_Microservices/
├── .github/workflows/                      # GitHub Actions CI/CD pipelines
│   ├── product-service-ci-cd.yml           # Product Service pipeline
│   ├── inventory-service-ci-cd.yml         # Inventory Service pipeline
│   ├── user-service-ci-cd.yml              # User Service pipeline
│   ├── order-service-ci-cd.yml             # Order Service pipeline
│   ├── payment-service-ci-cd.yml           # Payment Service pipeline
│   └── notification-service-ci-cd.yml      # Notification Service pipeline
│
├── product-service/                        # Your responsibility
│   ├── Dockerfile                          # Multi-stage Docker build
│   ├── package.json                        # Dependencies
│   ├── src/
│   │   ├── app.js                         # Express app setup
│   │   ├── server.js                      # Server entry point
│   │   ├── controllers/                   # Business logic
│   │   ├── models/                        # MongoDB schemas
│   │   ├── routes/                        # API routes
│   │   ├── middleware/                    # Auth, error handling
│   │   └── config/                        # Configuration
│   └── swagger.yaml                        # OpenAPI documentation
│
├── inventory-service/                      # Your responsibility
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── config/
│   └── swagger.yaml
│
├── user-service/                           # Student 1
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│
├── order-service/                          # Student 2
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│
├── payment-service/                        # Student 3
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│
├── notification-service/                   # Student 4
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│
├── docker-compose.yml                      # Local development setup
├── AZURE_DEPLOYMENT_COMPLETE_GUIDE.md      # Step-by-step Azure deployment
├── AZURE_DEPLOYMENT.md                     # Azure configuration details
├── LEARNING_OUTCOMES_ASSESSMENT.md         # Assignment requirements verification
├── SETUP_GUIDE.md                          # Quick start guide
├── INTEGRATION_TESTING.md                  # Inter-service communication tests
├── PROJECT_SUMMARY.md                      # High-level overview
├── Endpoints_Postman.md                    # Postman collection documentation
└── README.md                               # This file (Updated)
```

## 🏃 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- MongoDB Atlas account
- AWS account (free tier)
- GitHub account

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/B4S1NDU/HomeEssentials_CTSE_Microservices.git
cd HomeEssentials_CTSE_Microservices
```

2. **Start all services with Docker Compose**
```bash
docker-compose up --build
```

3. **Or run individual service**
```bash
cd product-service
npm install
npm run dev
```

## 🔐 Security Features

### Application Level
- JWT authentication
- Password hashing (bcrypt)
- Input validation & sanitization
- Rate limiting
- CORS configuration

### Cloud Level
- IAM least privilege roles
- Security Groups (restrict ports)
- HTTPS via ALB
- Database not publicly exposed
- Secrets Manager for credentials

### DevSecOps
- SonarCloud code quality scanning
- Snyk dependency vulnerability scanning
- npm audit in CI/CD pipeline
- Pipeline fails on critical vulnerabilities

## ☁️ AWS Deployment Architecture

```
GitHub → GitHub Actions → Build → ECR → ECS Fargate
                          ↓
                    SonarCloud Scan
                          ↓
                    Security Check
```

### AWS Resources
- **ECS Fargate:** Container orchestration
- **ECR:** Docker image registry
- **Application Load Balancer:** Traffic distribution
- **CloudWatch:** Logging & monitoring
- **IAM Roles:** Service permissions
- **Security Groups:** Network security

## ☁️ Azure Deployment Architecture

```
GitHub Repository (Source Code)
    ↓
GitHub Actions CI/CD Pipeline (Triggered on push to main)
    ├─ Stage 1: Code Quality & Security
    │  ├─ ESLint (Code style)
    │  ├─ Jest Tests (Unit tests)
    │  ├─ SonarCloud Scan (Code quality)
    │  └─ Snyk Scan (Dependency vulnerabilities)
    ├─ Stage 2: Build & Push to ACR
    │  ├─ Docker Image Build (Multi-stage)
    │  ├─ Trivy Scan (Container vulnerabilities)
    │  └─ Push to Azure Container Registry
    └─ Stage 3: Deploy to Azure Container Apps
       ├─ Update container image reference
       ├─ Deploy with automatic rollout
       └─ Health check monitoring
    ↓
Azure Container Apps (Deployment)
    ├─ Product Service (HTTPS URL + Load balancing)
    ├─ Inventory Service (HTTPS URL + Load balancing)
    ├─ User Service (HTTPS URL + Load balancing)
    ├─ Order Service (HTTPS URL + Load balancing)
    ├─ Payment Service (HTTPS URL + Load balancing)
    └─ Notification Service (HTTPS URL + Load balancing)
    ↓
Azure Resources
    ├─ Container Registry (ACR) - Image storage
    ├─ Key Vault - Secrets & credentials
    ├─ Log Analytics - Monitoring & logging
    └─ Application Insights - Performance tracking
```

### Azure Resources Overview

| Resource | Purpose | Configuration |
|----------|---------|----------------|
| **Resource Group** | Container for all resources | homeessentials-rg |
| **Azure Container Registry (ACR)** | Private Docker image registry | homeessentialsacr.azurecr.io |
| **Container Apps Environment** | Shared environment for services | homeessentials |
| **Container Apps** | Running microservices (6 total) | Each with HTTPS public endpoint |
| **Azure Key Vault** | Secure secrets storage | MongoDB URIs, ACR credentials |
| **Log Analytics Workspace** | Centralized logging & monitoring | homeessentials-logs |
| **Managed Identities** | Service-to-service authentication | Auto-generated per service |

---

## 🔐 Security Features

### Application Level
- **JWT Tokens:** Each service validates JWT in Authorization header
- **Password Security:** Bcrypt with salt rounds = 10
- **Input Validation:** Express middleware validates all inputs
- **Rate Limiting:** APIs limited to 100 requests/minute per IP
- **CORS:** Restricted to legitimate service origins
- **Data Encryption:** Passwords and sensitive data encrypted in MongoDB

### Service-to-Service Security
- **Service Tokens:** Services authenticate with JWT tokens
- **Least Privilege:** Each service has only required permissions
- **Network Isolation:** Services run in same Container Apps environment (internal network)
- **Timeout Protection:** All inter-service calls have 5-second timeout

### Cloud Security (Azure)
- **Azure Key Vault:** All secrets encrypted at rest
- **Managed Identities:** No hardcoded credentials in containers
- **Azure AD Integration:** User authentication via Azure Active Directory
- **Network Security Groups:** Restrict traffic to required ports
- **HTTPS Enforced:** All public endpoints use TLS 1.2+
- **Database Security:** MongoDB Atlas with IP whitelist

### DevSecOps Pipeline
- **SonarCloud Scan:** Static code analysis (SCA) - detects vulnerabilities
- **Snyk Scan:** Dependency scanning - alerts on vulnerable packages
- **Trivy Scan:** Container image scanning - detects OS-level vulnerabilities
- **Pipeline Enforces:** Build fails if critical vulnerabilities found

---

## 📊 Service Decomposition & Responsibilities

### Product Service (Your Responsibility)
**Purpose:** Central product catalog management  
**Port:** 3002  
**Technology:** Node.js + Express + MongoDB

**Database Schema:**
```javascript
{
  id: ObjectId,
  name: String,
  description: String,
  category: String,
  price: Number,
  image: String,
  rating: Number,
  createdAt: Date,
  updatedAt: Date
}
```

**API Endpoints:**
```
POST   /api/products                 // Create product (Admin)
GET    /api/products                 // List all products
GET    /api/products?category=xyz    // Filter by category
GET    /api/products/:id             // Get product details
PUT    /api/products/:id             // Update product (Admin)
DELETE /api/products/:id             // Delete product (Admin)
GET    /health                       // Health check endpoint
```

**Called By:** Product Service is called by:
- **Order Service**: To get product details and prices
- **Inventory Service**: To validate product exists before creating inventory
- **Client**: To browse products

**Calls:** Product Service does NOT call other services

---

### Inventory Service (Your Responsibility)
**Purpose:** Stock management with reservation system  
**Port:** 3003  
**Technology:** Node.js + Express + MongoDB

**Database Schema:**
```javascript
// Inventory Collection
{
  id: ObjectId,
  productId: ObjectId,
  stock: Number,
  reserved: Number,
  threshold: Number,
  createdAt: Date,
  updatedAt: Date
}

// Reservation Collection
{
  id: ObjectId,
  productId: ObjectId,
  orderId: String,
  quantity: Number,
  expiresAt: Date,
  status: String, // "ACTIVE", "RELEASED", "CONVERTED"
  createdAt: Date
}
```

**API Endpoints:**
```
GET    /api/inventory/:productId             // Check stock level
POST   /api/inventory                        // Create inventory entry
PUT    /api/inventory/:productId             // Update stock manually
POST   /api/inventory/reserve                // Reserve stock (Order Service)
POST   /api/inventory/release                // Release reservation
POST   /api/inventory/deduct                 // Deduct stock after payment
GET    /health                               // Health check
```

**Example POST /api/inventory/reserve:**
```json
Request:
{
  "productId": "prod-456",
  "quantity": 2,
  "orderId": "order-789"
}

Response (Success):
{
  "success": true,
  "reservationId": "resv-123",
  "productId": "prod-456",
  "quantity": 2,
  "reservedUntil": "2026-03-16T12:00:00Z",
  "currentStock": 48
}

Response (Failure - Out of Stock):
{
  "success": false,
  "error": "Insufficient stock available",
  "available": 1,
  "requested": 2
}
```

**Called By:**
- **Order Service**: To reserve and deduct stock
- **Client**: To check product availability

**Calls:**
- **Notification Service**: To send low-stock alerts

---

### User Service
**Purpose:** Authentication, authorization, user management  
**Port:** 3001  
**Student:** Student 1  
**Technology:** Node.js + Express + MongoDB

**API Endpoints:**
```
POST   /api/auth/login                // User login (returns JWT)
POST   /api/auth/register             // User registration
GET    /api/users/:id                 // Get user profile
GET    /api/users/:id/credit-limit    // Get user credit limit
PUT    /api/users/:id                 // Update user profile
GET    /health                        // Health check
```

**Called By:**
- **All services**: To validate JWT tokens in Authorization header
- **Order Service**: To verify customer and credit limit

---

### Order Service
**Purpose:** Order orchestration & workflow management  
**Port:** 3004  
**Student:** Student 2  
**Technology:** Node.js + Express + MongoDB

**Key Responsibility:** Service Orchestration
- Order Service acts as the **central orchestrator** for order flow
- It coordinates interactions between all other services
- It maintains transaction state and handles compensations

**Database Schema:**
```javascript
{
  id: ObjectId,
  orderId: String,
  userId: ObjectId,
  items: [{
    productId: ObjectId,
    quantity: Number,
    unitPrice: Number
  }],
  status: String, // "PENDING", "CONFIRMED", "PAID", "SHIPPED", "FAILED"
  paymentStatus: String,
  reservationIds: [String],
  total: Number,
  createdAt: Date,
  updatedAt: Date
}
```

**Orchestration Logic:**
```
1. Receive order request from client
2. Validate with User Service
3. For each product:
   - Get details from Product Service
   - Reserve stock with Inventory Service
4. Process payment with Payment Service
5. Deduct stock with Inventory Service
6. Send confirmation via Notification Service
7. Return order confirmation to client

If any step fails:
- Release inventory reservations
- Rollback payment if charged
- Notify customer of failure
```

**Called By:**
- **Client**: To place orders
- **Payment Service**: For status updates

**Calls:**
- **User Service**: to validate customer
- **Product Service**: to get product details
- **Inventory Service**: to reserve and deduct stock
- **Payment Service**: to process payment
- **Notification Service**: to send confirmations

---

### Payment Service
**Purpose:** Payment processing & transaction management  
**Port:** 3005  
**Student:** Student 3  
**Technology:** Node.js + Express + MongoDB

**Integration Points:**
- Receives payment request from Order Service
- Processes payment with external payment gateway (Stripe/PayPal)
- Sends payment status to Order Service
- Triggers notifications via Notification Service

**Called By:**
- **Order Service**: To process payment

**Calls:**
- **Notification Service**: To send payment receipts and alerts

---

### Notification Service
**Purpose:** Multi-channel notification delivery  
**Port:** 3006  
**Student:** Student 4  
**Technology:** Node.js + Express + MongoDB

**Notification Types:**
```
- ORDER_CONFIRMATION: Send to customer after order placed
- PAYMENT_SUCCESS: Send payment receipt
- PAYMENT_FAILED: Alert customer of payment failure
- LOW_STOCK_ALERT: Notify admin of low inventory
- ORDER_SHIPPED: Notify customer of shipment
- ORDER_DELIVERED: Confirm delivery
```

**Delivery Channels:**
- Email (SMTP)
- SMS (Twilio/Nexmo)
- Push notifications (Firebase)
- In-app notifications (Database)

**Called By:**
- **Order Service**: For order confirmations
- **Payment Service**: For payment notifications
- **Inventory Service**: For low-stock alerts

**No Outbound Calls:** Notification Service does NOT call other services

---

## 🧪 Testing Inter-Service Communication

### Automated Integration Tests

Each service includes tests for inter-service communication:

```bash
# Run tests for a specific service
cd product-service
npm test

# Run with coverage
npm run test:coverage

# Run integration tests (requires other services running)
npm run test:integration
```

### Manual Testing with Postman

**Postman Collection:** `Endpoints_Postman.md`

**Test Flow:**
1. Start all services (locally or Azure)
2. Import Postman collection
3. Execute requests in sequence:
   - Set JWT token from User Service
   - Create product via Product Service
   - Check inventory via Inventory Service
   - Create order via Order Service (triggers all services)
   - Verify payment processed
   - Confirm notifications sent

---

## 📊 Monitoring & Observability

### Local Development
```bash
# View logs for a specific service
docker logs -f product-service

# View all service logs
docker-compose logs -f
```

### Azure Production
```powershell
# View service logs
az containerapp logs show --name product-service --resource-group homeessentials-rg --follow

# View metrics
az monitor metrics list --resource-group homeessentials-rg

# View all deployed services
az containerapp list --resource-group homeessentials-rg --output table
```

### Service Health Endpoints

Each service exposes a health check endpoint:

```
GET /health
```

**Example Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-03-15T10:30:45Z",
  "uptime": 3600,
  "database": "connected",
  "dependencies": {
    "order-service": "reachable",
    "inventory-service": "reachable"
  }
}
```

---

## 🚀 Deployment Guide

### Quick Deployment to Azure

**For Complete Step-by-Step Instructions:**
See: [AZURE_DEPLOYMENT_COMPLETE_GUIDE.md](AZURE_DEPLOYMENT_COMPLETE_GUIDE.md)

**10 Phases (30-40 minutes):**
1. Create Azure education account with 100 free credits
2. Install Azure CLI
3. Login to Azure
4. Create Resource Group
5. Create Container Registry (ACR)
6. Create Container Apps Environment
7. Create Key Vault for secrets
8. Create Service Principal for GitHub
9. Configure 5 GitHub Secrets
10. Deploy services (automatic via git push)

### Automatic Deployment (GitHub Actions)

When you push code to `main` branch:

```powershell
git add .
git commit -m "Deploy to Azure"
git push origin main
```

**Workflow Triggers Automatically:**

```
├─ Code Quality & Security (ESLint, SonarCloud, Snyk)
├─ Build & Push to ACR (Docker build, Trivy scan)
└─ Deploy to Azure Container Apps (Automatic rollout)
```

**Monitor Progress:**
- Go to GitHub repo → **Actions** tab
- Click the running workflow
- Watch real-time logs

### Environment Variables

**For Each Service (Set in Container Apps):**

```bash
# Product Service
NODE_ENV=production
PORT=3002
MONGODB_URI=<from Key Vault>
LOG_LEVEL=info

# Inventory Service
NODE_ENV=production
PORT=3003
MONGODB_URI=<from Key Vault>
PRODUCT_SERVICE_URL=https://product-service.xxx.eastus.azurecontainerapps.io
LOG_LEVEL=info

# Order Service
NODE_ENV=production
PORT=3004
MONGODB_URI=<from Key Vault>
USER_SERVICE_URL=https://user-service.xxx.eastus.azurecontainerapps.io
PRODUCT_SERVICE_URL=https://product-service.xxx.eastus.azurecontainerapps.io
INVENTORY_SERVICE_URL=https://inventory-service.xxx.eastus.azurecontainerapps.io
PAYMENT_SERVICE_URL=https://payment-service.xxx.eastus.azurecontainerapps.io
NOTIFICATION_SERVICE_URL=https://notification-service.xxx.eastus.azurecontainerapps.io
LOG_LEVEL=info

# Payment Service
NODE_ENV=production
PORT=3005
MONGODB_URI=<from Key Vault>
NOTIFICATION_SERVICE_URL=https://notification-service.xxx.eastus.azurecontainerapps.io
STRIPE_API_KEY=<from Key Vault>
LOG_LEVEL=info

# Notification Service
NODE_ENV=production
PORT=3006
MONGODB_URI=<from Key Vault>
SMTP_HOST=<email provider>
SMTP_PASSWORD=<from Key Vault>
LOG_LEVEL=info
```

---

## 👥 Team Distribution & Responsibilities

### Student 1: User Service + Notification Service
- User authentication & management
- Notification delivery (Email, SMS, Push)

### Your Role: Product Service + Inventory Service (Student 1 from backend perspective)
- Product catalog management (Create, Read, Update, Delete)
- Stock/Inventory management with reservation system
- **Critical for integration:** 
  - Product Service provides product details to Order Service
  - Inventory Service manages stock reservations and deductions

### Student 2: Order Service
- **Service Orchestrator:** Coordinates all other services
- Order lifecycle management
- Transaction handling

### Student 3: Payment Service
- Payment processing
- Transaction management
- Triggers notifications

### Student 4: Notification Service (Alternative)
- Handles all notification delivery
- Integrates with all services

---

## ✅ Assignment Requirements Verification

### Learning Outcome 1: Design a Simple Microservice
- ✅ 6 independently deployable microservices
- ✅ Clear responsibilities per service
- ✅ Well-defined API contracts (Swagger/OpenAPI)
- ✅ Database per service (no shared database)

### Learning Outcome 2: Implement Basic DevOps Practices
- ✅ GitHub repository (public): https://github.com/B4S1NDU/HomeEssentials_CTSE_Microservices
- ✅ CI/CD pipelines (GitHub Actions - 6 workflows)
- ✅ Automated quality checks (ESLint, Jest)
- ✅ Automated security scans (SonarCloud, Snyk, Trivy)
- ✅ Automated testing on pull requests

### Learning Outcome 3: Containerize the Microservice
- ✅ Dockerfile per service (multi-stage builds)
- ✅ Optimized images (Alpine base, non-root user)
- ✅ Container Registry (Azure Container Registry)
- ✅ Automated image builds on code push

### Learning Outcome 4: Deploy the Microservice & Security
- ✅ Deployed on Azure (Container Apps)
- ✅ Public HTTPS endpoints for each service
- ✅ JWT authentication with RBAC
- ✅ Azure Key Vault for secrets
- ✅ Health checks and auto-scaling
- ✅ Security scanning in CI/CD
- ✅ Inter-service communication working

---

## 📋 Viva Presentation Checklist

**Duration:** 10 minutes  
**Location:** Single laptop demo  
**Attendees:** 4 group members + Examiner

### Demo Flow (Recommended Sequence)

**1. System Overview (1 min)**
```
Show: Architecture diagram with all 6 services
Explain: How services integrate & communicate
```

**2. Azure Deployment (1 min)**
```
Show: All 6 services running in Azure Portal
Display: Container Apps list with Status = "Succeeded"
```

**3. Live API Testing (3 mins)**
```
Open: Browser with 6 service URLs
Test: 
  - Product Service: GET /health → 200 OK
  - Inventory Service: GET /health → 200 OK
  - Order Service: GET /health → 200 OK
  - Payment Service: GET /health → 200 OK
  - Notification Service: GET /health → 200 OK
  - User Service: GET /health → 200 OK
```

**4. Inter-Service Communication Demo (2 mins)**
```
Flow: Create an order (triggers all services)

Example Request:
POST https://order-service.xxx.azurecontainerapps.io/api/orders
{
  "userId": "user-123",
  "items": [
    { "productId": "prod-456", "quantity": 2 }
  ]
}

Show: Order created with:
- Product details fetched from Product Service
- Stock reserved from Inventory Service
- Payment processed via Payment Service
- Confirmation email sent via Notification Service

Response displays entire order with all service interactions
```

**5. CI/CD Pipeline Demo (2 mins)**
```
Show: GitHub Actions workflow
- Code Quality stage passed
- Build & Push stage passed
- Deploy stage showing latest deployment
- Timeline of recent deployments
- Demonstrate: Make a code change and git push
- Show: Workflow triggering automatically
```

**6. Security Implementation (1 min)**
```
Explain:
- GitHub Secrets (never shown in logs)
- JWT authentication
- Azure Key Vault for MongoDB URI
- Container image scanning with Trivy
- Code scanning with SonarCloud
- Dependency scanning with Snyk
- HTTPS enforced on all endpoints
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| **README.md** | This file - Complete system overview |
| **AZURE_DEPLOYMENT_COMPLETE_GUIDE.md** | Step-by-step Azure setup (10 phases) |
| **AZURE_DEPLOYMENT.md** | Technical Azure configuration details |
| **LEARNING_OUTCOMES_ASSESSMENT.md** | Verification against 4 learning outcomes |
| **SETUP_GUIDE.md** | Local development setup |
| **INTEGRATION_TESTING.md** | Inter-service testing procedures |
| **PROJECT_SUMMARY.md** | High-level project overview |
| **Endpoints_Postman.md** | Postman collection for API testing |

---

## 🔗 Important Links

| Link | Purpose |
|------|---------|
| **GitHub Repository** | https://github.com/B4S1NDU/HomeEssentials_CTSE_Microservices |
| **Azure Portal** | https://portal.azure.com/ |
| **Azure Deployment Guide** | See `AZURE_DEPLOYMENT_COMPLETE_GUIDE.md` |
| **Project Report** | To be submitted separately |
| **API Documentation** | Swagger/OpenAPI at `/api-docs` on each service |

---

## 🎯 Key Success Metrics for Viva

Your viva will be assessed on:

✅ **Functionality (10%)** - All services working correctly  
✅ **DevOps (30%)** - CI/CD pipeline, automated deployment, GitHub Actions  
✅ **Inter-Service Communication (10%)** - Services calling each other successfully  
✅ **Security (20%)** - JWT, Key Vault, HTTPS, scanning tools implemented  
✅ **Code Quality (20%)** - Clean code, proper error handling, logging  
✅ **Presentation (10%)** - Clear explanation of architecture and workflow  

---

## 🚀 Quick Reference Commands

### Local Development
```bash
# Clone repository
git clone https://github.com/B4S1NDU/HomeEssentials_CTSE_Microservices.git

# Start all services locally
docker-compose up --build

# Run specific service
cd product-service && npm install && npm run dev

# Run tests
npm test
```

### Azure Deployment
```powershell
# Login to Azure
az login

# Create resources
az group create --name homeessentials-rg --location eastus

# View deployed services
az containerapp list --resource-group homeessentials-rg --output table

# View service logs
az containerapp logs show --name product-service --resource-group homeessentials-rg --follow

# Deploy service manually
az containerapp create --name "product-service" --resource-group homeessentials-rg --environment homeessentials --image <image-url> --registry-username <user> --registry-password <pass> --target-port 3002 --ingress external
```

### Service Testing
```bash
# Test Product Service health
curl https://product-service.xxx.azurecontainerapps.io/health

# Test Product Service API
curl https://product-service.xxx.azurecontainerapps.io/api/products

# Test inter-service communication (Order Service calls Product Service)
curl -X POST https://order-service.xxx.azurecontainerapps.io/api/orders \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-123","items":[{"productId":"prod-456","quantity":2}]}'
```

---

## 📄 License

This is an academic project for SLIIT Module SE4010 - Current Trends in Software Engineering (Semester 1, 2026).

**Group:** 4 Students  
**Institution:** Sri Lanka Institute of Information Technology (SLIIT)  
**Course:** CTSE Advanced Microservices & Cloud Computing  
**Assessment:** Cloud Computing Assignment

---

**Last Updated:** March 15, 2026  
**Version:** 2.0 - Complete System with Azure Integration  
<br/>

### 🎓 Learning Outcomes Covered
✅ Design and implement a secure microservice-based application component  
✅ Apply fundamental DevOps practices and cloud capabilities  
✅ Demonstrate containerization with Docker  
✅ Deploy on a public cloud provider (Azure) with security  
✅ Implement inter-service communication patterns  
✅ Apply DevSecOps practices with SAST tools  
✅ Present a working prototype with 10-minute live demonstration
