# HomeEssentials+ Cloud-Native Household Ordering System

A cloud-native microservices-based e-commerce platform for household essentials built with DevOps and DevSecOps practices.

## 🏗️ System Architecture

### Microservices (6 Services, 4 Students)

| Service | Student | Technology | Port | Responsibility |
|---------|---------|------------|------|----------------|
| **User Service** | Student 1 | Node.js + Express | 3001 | User authentication & management |
| **Product Service** | **Your Service** | Node.js + Express | 3002 | Product catalog management |
| **Inventory Service** | **Your Service** | Node.js + Express | 3003 | Stock & inventory management |
| **Order Service** | Student 2 | Node.js + Express | 3004 | Order orchestration & lifecycle |
| **Payment Service** | Student 3 | Node.js + Express | 3005 | Payment processing |
| **Notification Service** | Student 4 | Node.js + Express | 3006 | Notification delivery |

## 🔄 Service Communication Flow

```
User Service ←→ Order Service
Product Service ←→ Order Service
Inventory Service ←→ Order Service
Order Service ←→ Payment Service
Payment Service ←→ Notification Service
```

## 🚀 Tech Stack

- **Backend:** Node.js + Express.js
- **Database:** MongoDB Atlas (separate DB per service)
- **Containerization:** Docker + Docker Hub
- **Cloud Provider:** AWS (ECS Fargate, ECR, ALB)
- **CI/CD:** GitHub Actions
- **Security:** SonarCloud, Snyk, JWT, bcrypt
- **API Documentation:** Swagger/OpenAPI

## 📁 Project Structure

```
HomeEssentials_CTSE_Microservices/
├── user-service/              # Student 1
├── product-service/           # Your responsibility
├── inventory-service/         # Your responsibility
├── order-service/             # Student 2
├── payment-service/           # Student 3
├── notification-service/      # Student 4
├── architecture-diagram.png   # System architecture
├── docker-compose.yml         # Local development
└── README.md
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

## 📊 Service Details

### Product Service (Your Responsibility)
Manages product catalog for household essentials.

**Endpoints:**
- `POST /products` - Create product (Admin)
- `GET /products` - List all products
- `GET /products/:id` - Get product details
- `PUT /products/:id` - Update product (Admin)
- `DELETE /products/:id` - Delete product (Admin)
- `GET /products/category/:category` - Filter by category

### Inventory Service (Your Responsibility)
Manages stock levels and inventory operations.

**Endpoints:**
- `GET /inventory/:productId` - Check stock
- `POST /inventory` - Initialize inventory
- `PUT /inventory/:productId` - Update stock
- `POST /inventory/reserve` - Reserve stock (Order Service)
- `POST /inventory/release` - Release reserved stock
- `POST /inventory/deduct` - Deduct stock after payment

## 🧪 Testing

Each service includes:
- Unit tests
- Integration tests
- API tests with Postman collections

```bash
npm test
npm run test:coverage
```

---

## 📮 Postman API Testing Guide

> **Base URLs:** Product Service → `http://localhost:3002` | Inventory Service → `http://localhost:3003`
>
> **Header required on all POST/PUT requests:** `Content-Type: application/json`
>
> **Tip:** After creating a product, copy its `_id` and use it as `productId` in all inventory requests.

---

### 🛒 Product Service Endpoints

#### System

| # | Method | URL | Description |
|---|--------|-----|-------------|
| 1 | `GET` | `http://localhost:3002/health` | Liveness check |
| 2 | `GET` | `http://localhost:3002/readiness` | DB connectivity check |
| 3 | `GET` | `http://localhost:3002/api-docs` | Swagger UI (open in browser) |

#### Products — CRUD

**4. Get All Products**
```
GET http://localhost:3002/api/products
```
Optional query params: `?page=1&limit=10` · `?category=soap` · `?isActive=true` · `?search=sunlight`

---

**5. Get Single Product**
```
GET http://localhost:3002/api/products/:id
```
Replace `:id` with the MongoDB `_id` of the product.

---

**6. Get Products by Category**
```
GET http://localhost:3002/api/products/category/soap
```
Valid values: `rice` `soap` `detergent` `cooking-oil` `spices` `cleaning` `personal-care` `other`

---

**7. Get All Categories**
```
GET http://localhost:3002/api/products/categories/list
```

---

**8. Create Product**
```
POST http://localhost:3002/api/products
```
```json
{
  "name": "Sunlight Soap",
  "description": "Premium quality soap bar for household cleaning",
  "category": "soap",
  "price": 85,
  "unit": "piece",
  "brand": "Sunlight",
  "isActive": true
}
```
> Copy the `_id` from the response — needed for all inventory requests.

---

**9. Update Product**
```
PUT http://localhost:3002/api/products/:id
```
```json
{
  "name": "Sunlight Soap Bar",
  "description": "Premium quality soap bar for household cleaning and hygiene",
  "category": "soap",
  "price": 90,
  "unit": "piece",
  "brand": "Sunlight",
  "isActive": true
}
```

---

**10. Delete Product**
```
DELETE http://localhost:3002/api/products/:id
```
No body required.

---

#### Products — Validation Error Tests

**11. Missing Required Fields → expect `400`**
```
POST http://localhost:3002/api/products
```
```json
{ "name": "Soap" }
```

**12. Invalid Category → expect `400`**
```
POST http://localhost:3002/api/products
```
```json
{
  "name": "Some Product",
  "description": "Some description here that is long enough",
  "category": "furniture",
  "price": 100,
  "unit": "piece"
}
```

**13. Invalid ID Format → expect `400`**
```
GET http://localhost:3002/api/products/not-a-valid-id
```

**14. Non-Existent ID → expect `404`**
```
GET http://localhost:3002/api/products/65a1b2c3d4e5f6a7b8c9d0e1
```

---

### 📦 Inventory Service Endpoints

#### System

| # | Method | URL | Description |
|---|--------|-----|-------------|
| 15 | `GET` | `http://localhost:3003/health` | Liveness check |
| 16 | `GET` | `http://localhost:3003/readiness` | DB connectivity check |
| 17 | `GET` | `http://localhost:3003/api-docs` | Swagger UI (open in browser) |

#### Inventory — CRUD

**18. Get All Inventory**
```
GET http://localhost:3003/api/inventory
```
Optional query params: `?page=1&limit=10` · `?status=IN_STOCK` · `?status=LOW_STOCK` · `?status=OUT_OF_STOCK`

---

**19. Get Inventory for a Product**
```
GET http://localhost:3003/api/inventory/:productId
```

---

**20. Get All Low Stock Items**
```
GET http://localhost:3003/api/inventory/low-stock
```

---

**21. Create Inventory (Normal Stock)**
```
POST http://localhost:3003/api/inventory
```
```json
{
  "productId": "<product _id here>",
  "productName": "Sunlight Soap",
  "quantity": 500,
  "lowStockThreshold": 50,
  "location": {
    "warehouse": "Main Warehouse",
    "shelf": "B3"
  }
}
```

---

**22. Create Inventory (Low Stock Scenario)**
```
POST http://localhost:3003/api/inventory
```
```json
{
  "productId": "<vim product _id here>",
  "productName": "Vim Dishwashing Bar",
  "quantity": 8,
  "lowStockThreshold": 10
}
```
> `quantity (8) ≤ lowStockThreshold (10)` → response will show `stockStatus: "LOW_STOCK"`

---

**23. Create Inventory (Out of Stock Scenario)**
```
POST http://localhost:3003/api/inventory
```
```json
{
  "productId": "<rice product _id here>",
  "productName": "Samba Rice 5kg",
  "quantity": 0,
  "lowStockThreshold": 20
}
```
> `quantity = 0` → response will show `stockStatus: "OUT_OF_STOCK"`

---

**24. Update Inventory (Restock)**
```
PUT http://localhost:3003/api/inventory/:productId
```
```json
{
  "quantity": 1000,
  "lowStockThreshold": 100,
  "location": {
    "warehouse": "Warehouse B",
    "shelf": "A5"
  }
}
```

---

#### Stock Operations — Order Lifecycle

> **Flow:** Check → Reserve → (Deduct on success | Release on failure)

---

**25. Check Stock Availability**
```
POST http://localhost:3003/api/inventory/check
```
```json
{
  "productId": "<product _id here>",
  "quantity": 20
}
```
Expected: `available: true`, shows current `availableQuantity`.

---

**26. Check Stock — Request More Than Available → expect `available: false`**
```
POST http://localhost:3003/api/inventory/check
```
```json
{
  "productId": "<product _id here>",
  "quantity": 99999
}
```

---

**27. Reserve Stock (Order Placed)**
```
POST http://localhost:3003/api/inventory/reserve
```
```json
{
  "productId": "<product _id here>",
  "orderId": "ORDER-001",
  "quantity": 20
}
```
Expected: `reservedQuantity` increases by 20, `availableQuantity` drops by 20.

---

**28. Reserve Stock (Second Order)**
```
POST http://localhost:3003/api/inventory/reserve
```
```json
{
  "productId": "<product _id here>",
  "orderId": "ORDER-002",
  "quantity": 15
}
```

---

**29. Deduct Stock — Payment SUCCESS**
```
POST http://localhost:3003/api/inventory/deduct
```
```json
{
  "orderId": "ORDER-001"
}
```
Expected: `quantity` permanently decreases by 20. Reservation status → `CONFIRMED`.

---

**30. Release Stock — Payment FAILED**
```
POST http://localhost:3003/api/inventory/release
```
```json
{
  "orderId": "ORDER-002"
}
```
Expected: `reservedQuantity` drops by 15, `availableQuantity` restored. Reservation status → `RELEASED`.

---

#### Stock Operations — Error Tests

**31. Reserve — Insufficient Stock → expect `400`**
```
POST http://localhost:3003/api/inventory/reserve
```
```json
{
  "productId": "<product _id here>",
  "orderId": "ORDER-BAD",
  "quantity": 99999
}
```

**32. Create Inventory — Duplicate → expect `400`**
```
POST http://localhost:3003/api/inventory
```
```json
{
  "productId": "<existing product _id>",
  "productName": "Sunlight Soap",
  "quantity": 100
}
```

**33. Release — No Pending Reservation → expect `404`**
```
POST http://localhost:3003/api/inventory/release
```
```json
{
  "orderId": "ORDER-NONEXISTENT"
}
```

**34. Get Inventory — Product Not Found → expect `404`**
```
GET http://localhost:3003/api/inventory/65a1b2c3d4e5f6a7b8c9d0e1
```

---

### ⚡ Postman Auto-Variable Tip

In the **Tests** tab of your Create Product request, add this script to automatically set the `productId` variable for all subsequent requests:

```javascript
const response = pm.response.json();
pm.collectionVariables.set("productId", response.data._id);
```

Then use `{{productId}}` in all inventory request URLs and bodies instead of pasting the ID manually.

## 📖 API Documentation

Each service has Swagger documentation available at:
- Product Service: `http://localhost:3002/api-docs`
- Inventory Service: `http://localhost:3003/api-docs`

## 👥 Team Distribution

- **Student 1:** User Service
- **Student 2:** Order Service
- **Student 3:** Payment Service
- **Student 4:** Notification Service
- **You:** Product + Inventory Services

## 📝 Assignment Deliverables

- ✅ Source code in GitHub repository
- ✅ Dockerfile per service
- ✅ CI/CD pipeline configuration
- ✅ API documentation (Swagger)
- ✅ Architecture diagram
- ✅ Security implementation
- ✅ Live deployment on AWS
- ✅ Project report

## 🔗 Important Links

- **GitHub Repository:** https://github.com/B4S1NDU/HomeEssentials_CTSE_Microservices
- **SonarCloud:** [To be added]
- **AWS Deployment:** [To be added]
- **API Documentation:** [To be added]

## 📄 License

This is an academic project for SLIIT SE4010 - Current Trends in Software Engineering.
