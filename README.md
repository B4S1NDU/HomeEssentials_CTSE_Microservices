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
| **Notification Service** | Student 1 | Node.js + Express | 3006 | Notification delivery |

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
