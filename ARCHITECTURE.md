# CloudShop System Architecture Manual

## Table of Contents
- [Overview](#overview)
- [Architecture Patterns](#architecture-patterns)
- [System Components](#system-components)
- [Microservices](#microservices)
- [Data Management](#data-management)
- [Infrastructure](#infrastructure)
- [CI/CD Pipeline](#cicd-pipeline)
- [Security](#security)
- [Deployment Flow](#deployment-flow)
- [Scaling Strategy](#scaling-strategy)
- [Troubleshooting Guide](#troubleshooting-guide)

---

## Overview

CloudShop is an e-commerce platform built using microservices architecture, containerized with Docker, orchestrated by Kubernetes, and deployed via automated CI/CD pipelines.

### Core Architecture Principles

1. **Microservices Architecture**: Each service is independently deployable, scalable, and maintainable
2. **Database-per-Service**: Each microservice has its own database to ensure loose coupling
3. **API Gateway Pattern**: Single entry point for all client requests
4. **Container-First**: All services run in Docker containers for consistency
5. **Infrastructure as Code**: Kubernetes manifests define entire infrastructure
6. **Automated Deployment**: CI/CD pipeline handles testing, building, and deploying

### Technology Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Backend** | Node.js + Express | Fast, async, great for microservices |
| **Database** | MongoDB | Flexible schema, great for microservices |
| **Containerization** | Docker | Consistent environments, easy deployment |
| **Orchestration** | Kubernetes | Auto-scaling, self-healing, load balancing |
| **CI/CD** | GitHub Actions | Free, integrated with code, easy to configure |
| **Registry** | GitHub Container Registry | Free, integrated with GitHub |
| **Authentication** | JWT + bcrypt | Stateless, secure, industry standard |

---

## Architecture Patterns

### 1. Microservices Pattern

**What**: Application split into small, independent services

**Why We Use It**:
- Each service can be developed, deployed, and scaled independently
- Teams can work on different services simultaneously
- Technology choices can vary per service
- Failures are isolated (one service down doesn't crash everything)
- Easier to understand and maintain smaller codebases

**Implementation in CloudShop**:
```
Client → API Gateway → Product Service → MongoDB (products)
                    ├→ User Service → MongoDB (users)
                    └→ Order Service → MongoDB (orders)
                                    ↓
                              (calls Product Service)
```

### 2. API Gateway Pattern

**What**: Single entry point that routes requests to appropriate microservices

**Why We Use It**:
- Simplifies client code (one endpoint instead of many)
- Centralized cross-cutting concerns (CORS, rate limiting, authentication)
- Hides internal service structure from clients
- Can aggregate responses from multiple services
- Single point for monitoring and logging

**Implementation**: `/home/manda/cloudshop/api-gateway/src/index.js`

### 3. Database-per-Service Pattern

**What**: Each microservice has its own database

**Why We Use It**:
- Loose coupling between services
- Each service can choose best database for its needs
- Schema changes don't affect other services
- Independent scaling of data layer
- Failure isolation (one database down doesn't affect all services)

**Trade-off**: Cross-service queries require inter-service communication

### 4. Event-Driven Communication

**What**: Services communicate through API calls (could be upgraded to message queues)

**Current Implementation**: Synchronous HTTP calls
- Order Service calls Product Service to validate products

**Future Enhancement**: Message queues (RabbitMQ, Kafka) for async communication

---

## System Components

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        INTERNET                              │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │ LoadBalancer │ (Kubernetes Service type: LoadBalancer)
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌─────────┐  ┌─────────┐  ┌─────────┐
        │   API   │  │   API   │  │   API   │  (2 replicas for high availability)
        │ Gateway │  │ Gateway │  │ Gateway │
        │  Pod 1  │  │  Pod 2  │  │  Pod N  │
        └────┬────┘  └────┬────┘  └────┬────┘
             │            │            │
   ┌─────────┴────────────┴────────────┴─────────────┐
   │         Kubernetes Internal Network               │
   │                                                    │
   │  ┌───────────┐  ┌───────────┐  ┌───────────┐    │
   │  │  Product  │  │   User    │  │   Order   │    │
   │  │  Service  │  │  Service  │  │  Service  │    │
   │  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘    │
   │        │              │              │ │          │
   │        ▼              ▼              ▼ │          │
   │  ┌─────────┐    ┌─────────┐    ┌─────▼────┐     │
   │  │ MongoDB │    │ MongoDB │    │ MongoDB  │     │
   │  │(products│    │ (users) │    │ (orders) │     │
   │  │   DB)   │    │         │    │          │     │
   │  └─────────┘    └─────────┘    └──────────┘     │
   │                                                    │
   │  ┌──────────────────────────────────────────┐    │
   │  │     Persistent Volumes (Storage)         │    │
   │  └──────────────────────────────────────────┘    │
   └────────────────────────────────────────────────────┘
```

---

## Microservices

### API Gateway Service

**Location**: `/home/manda/cloudshop/api-gateway/`

**Purpose**: Routes client requests to appropriate backend services

**Port**: 3000

**Responsibilities**:
- Request routing to microservices
- Rate limiting (100 requests/15 minutes per IP)
- CORS handling
- Service health monitoring
- Error handling for unavailable services

**Key Features**:
- Uses `http-proxy-middleware` for transparent request forwarding
- Implements rate limiting to prevent DDoS attacks
- Graceful degradation when services are down (returns 503 instead of crashing)
- Health check aggregation across all services

**Why It's Needed**:
- Clients need only one endpoint to remember
- Centralizes security policies
- Simplifies client code
- Enables service reorganization without client changes

**Environment Variables**:
```bash
PORT=3000
PRODUCT_SERVICE_URL=http://product-service:3001
USER_SERVICE_URL=http://user-service:3002
ORDER_SERVICE_URL=http://order-service:3003
```

### Product Service

**Location**: `/home/manda/cloudshop/product-service/`

**Purpose**: Manages product catalog and inventory

**Port**: 3001

**Database**: MongoDB (products database)

**Data Model** (`/home/manda/cloudshop/product-service/src/models/Product.js`):
```javascript
{
  name: String (required, trimmed)
  description: String (required)
  price: Number (required, min: 0)
  stock: Number (required, min: 0, default: 0)
  category: String (required)
  imageUrl: String (optional)
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

**API Endpoints**:
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

**Why Separate Service**:
- Product catalog can be updated independently
- Can scale based on browsing traffic
- Product data isolated from orders and users
- Can optimize database for product searches

### User Service

**Location**: `/home/manda/cloudshop/user-service/`

**Purpose**: Manages user authentication, registration, and profiles

**Port**: 3002

**Database**: MongoDB (users database)

**Data Model** (`/home/manda/cloudshop/user-service/src/models/User.js`):
```javascript
{
  email: String (required, unique, lowercase)
  password: String (required, hashed with bcrypt)
  firstName: String (required)
  lastName: String (required)
  role: String (enum: customer/admin, default: customer)
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

**Security Features**:
1. **Password Hashing**: bcrypt with salt factor 10
2. **JWT Tokens**: 24-hour expiration
3. **Password Protection**: Automatically excluded from JSON responses
4. **Pre-save Hook**: Hashes password before saving to database

**API Endpoints**:
- `POST /api/users/register` - Register new user (returns JWT token)
- `POST /api/users/login` - Authenticate user (returns JWT token)
- `GET /api/users/profile/:id` - Get user profile
- `PUT /api/users/:id` - Update profile (password updates blocked)

**Authentication Flow**:
1. User registers/logs in
2. Service generates JWT token with user data
3. Token contains: userId, email, role
4. Token expires in 24 hours
5. Client includes token in subsequent requests

**Why Separate Service**:
- Security isolation for sensitive credential data
- Independent scaling for authentication load
- Can implement advanced features (2FA, OAuth) without affecting other services

### Order Service

**Location**: `/home/manda/cloudshop/order-service/`

**Purpose**: Manages order creation, tracking, and fulfillment

**Port**: 3003

**Database**: MongoDB (orders database)

**Data Model** (`/home/manda/cloudshop/order-service/src/models/Order.js`):
```javascript
{
  userId: String (references user)
  items: [{
    productId: String (references product)
    productName: String (snapshot at order time)
    quantity: Number (min: 1)
    price: Number (snapshot at order time)
  }]
  totalAmount: Number (calculated sum)
  status: String (enum: pending/processing/shipped/delivered/cancelled)
  shippingAddress: {
    street, city, state, zipCode, country
  }
  createdAt: Date (order placement time)
  updatedAt: Date (last status change)
}
```

**Inter-Service Communication**:
Order Service calls Product Service during order creation:
```javascript
// For each item in order:
1. GET /api/products/:id from Product Service
2. Verify product exists
3. Get current price (prevents client price manipulation)
4. Get product name (for order record)
5. Calculate total
6. Create order with enriched data
```

**API Endpoints**:
- `GET /api/orders` - List all orders (admin)
- `GET /api/orders/user/:userId` - Get user's orders
- `GET /api/orders/:id` - Get single order
- `POST /api/orders` - Create order (validates products first)
- `PATCH /api/orders/:id/status` - Update order status
- `DELETE /api/orders/:id` - Cancel order (soft delete)

**Why Data Denormalization**:
- Stores product name and price at order time
- Product might be deleted or price changed later
- Order must reflect what was actually purchased
- Historical accuracy for accounting and customer service

**Why Separate Service**:
- Complex business logic for order processing
- Can scale independently during sales events
- Isolates order data for security and compliance
- Enables future features (payment processing, shipping integration)

---

## Data Management

### Database Strategy: Database-per-Service

Each microservice has its own MongoDB database:

```
┌──────────────────┐     ┌─────────────┐
│ Product Service  │────▶│  MongoDB    │
│                  │     │  (products) │
└──────────────────┘     └─────────────┘

┌──────────────────┐     ┌─────────────┐
│  User Service    │────▶│  MongoDB    │
│                  │     │   (users)   │
└──────────────────┘     └─────────────┘

┌──────────────────┐     ┌─────────────┐
│  Order Service   │────▶│  MongoDB    │
│                  │     │  (orders)   │
└──────────────────┘     └─────────────┘
```

**Benefits**:
- Services can't directly access each other's data (loose coupling)
- Each service owns its data model
- Database failures are isolated
- Can use different databases for different services if needed
- Independent scaling and optimization

**Challenges**:
- No cross-database transactions
- Must use API calls for cross-service data
- Data consistency is eventual (not immediate)

### Data Denormalization

Order Service stores product data (name, price) instead of just IDs:

**Why**:
- Products can be deleted or renamed
- Prices change over time
- Orders must reflect purchase-time data
- Prevents broken order history

**Trade-off**:
- Duplicated data (product info in both Product and Order services)
- Accepts eventual consistency for better resilience

---

## Infrastructure

### Kubernetes Architecture

**Namespaces**:
```yaml
simple-store  # All CloudShop resources
```
Why: Isolates application from other cluster workloads

**Deployments** (Stateless Services):
```
api-gateway      (2 replicas)
product-service  (2 replicas)
user-service     (2 replicas)
order-service    (2 replicas)
```
Why Deployment: Stateless apps, pods are interchangeable, rolling updates

**StatefulSet** (Stateful Services):
```
mongodb  (1 replica)
```
Why StatefulSet: Needs stable storage and network identity

**Services**:
```
api-gateway  (LoadBalancer)  # External access
product-service  (ClusterIP)  # Internal only
user-service  (ClusterIP)     # Internal only
order-service  (ClusterIP)    # Internal only
mongodb  (Headless)           # Direct pod access
```

**Storage**:
```
PersistentVolumeClaim: mongodb-data (10Gi)
```
Why: Database data must survive pod restarts

### Resource Limits

Each microservice pod:
```yaml
requests:
  memory: 128Mi   # Guaranteed minimum
  cpu: 100m       # 0.1 CPU cores
limits:
  memory: 256Mi   # Maximum allowed
  cpu: 200m       # 0.2 CPU cores
```

**Why Resource Limits**:
- Prevents single pod from consuming all node resources
- Kubernetes uses requests for scheduling
- Limits prevent runaway processes

### Health Checks

**Liveness Probe**:
```yaml
httpGet: /health
initialDelaySeconds: 30
periodSeconds: 10
```
- If fails: Kubernetes restarts container
- Detects: Deadlocks, crashes, hung processes

**Readiness Probe**:
```yaml
httpGet: /health
initialDelaySeconds: 10
periodSeconds: 5
```
- If fails: Kubernetes removes pod from load balancer
- Detects: Pod alive but not ready (warming up, loading data)

---

## CI/CD Pipeline

### Pipeline Overview

**Location**: `/home/manda/cloudshop/.github/workflows/ci-cd.yaml`

**Stages**:
```
1. Test (parallel for all services)
2. Build & Push Docker Images (parallel for all services)
3. Deploy to Kubernetes (sequential)
4. Verify Deployment
```

### Stage 1: Test

**Runs**: On every push and pull request

**Process**:
```
For each service (parallel):
1. Checkout code
2. Setup Node.js 18
3. Install dependencies (npm ci)
4. Run tests (npm test)
```

**Why First**: Fail fast if code is broken

### Stage 2: Build & Push

**Runs**: Only on push to main (after tests pass)

**Process**:
```
For each service (parallel):
1. Checkout code
2. Setup Docker Buildx
3. Login to GitHub Container Registry
4. Extract metadata (generate tags)
5. Build Docker image
6. Push to ghcr.io
```

**Image Tags Created**:
```
ghcr.io/username/product-service:main
ghcr.io/username/product-service:main-abc123def
ghcr.io/username/product-service:latest
```

**Why Multiple Tags**:
- `main`: Latest on main branch
- `main-abc123def`: Specific commit (traceable)
- `latest`: Convenience tag

### Stage 3: Deploy

**Runs**: Only on push to main (after build)

**Process**:
```
1. Configure kubectl (from KUBE_CONFIG secret)
2. Update manifest image tags (YOUR_REGISTRY → ghcr.io/username, :latest → :main-abc123)
3. Apply Kubernetes manifests:
   - Namespace
   - Secrets
   - MongoDB
   - Microservices
4. Wait for rollout completion (5min timeout)
5. Verify all pods running
```

**Rolling Update**:
```
1. New pods created with new image
2. Wait for readiness probes to pass
3. Route traffic to new pods
4. Terminate old pods
5. Zero downtime deployment
```

### Required Secrets

**GitHub Repository Secrets**:
```
KUBE_CONFIG: Base64-encoded kubeconfig file
  Generation: cat ~/.kube/config | base64
```

---

## Security

### Authentication & Authorization

**Method**: JWT (JSON Web Tokens)

**Flow**:
```
1. User registers/logs in
2. User Service generates JWT token
3. Token contains: userId, email, role
4. Token expires in 24 hours
5. Client includes token in Authorization header
6. Services verify token signature
```

**Token Structure**:
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "role": "customer",
  "iat": 1672531200,
  "exp": 1672617600
}
```

### Password Security

**Hashing**: bcrypt with salt factor 10

**Process**:
```
1. User submits password
2. Pre-save hook intercepts
3. Generate salt (random data)
4. Hash password + salt
5. Store hash (never plain text)
6. For login: Hash attempt, compare hashes
```

**Why bcrypt**:
- Designed for passwords
- Computationally expensive (slows brute force)
- Automatic salt generation
- Timing-attack resistant

### Network Security

**Isolation**:
- Microservices use ClusterIP (internal only)
- Only API Gateway exposed via LoadBalancer
- Kubernetes network policies can restrict pod communication

**Rate Limiting**:
```
API Gateway: 100 requests per 15 minutes per IP
```
Why: Prevents DDoS and API abuse

### Secrets Management

**Kubernetes Secrets**:
```yaml
mongodb-secret: MongoDB credentials
jwt-secret: JWT signing key
```

**Why Secrets**:
- Never hardcode credentials in code
- Encrypted at rest (depending on cluster config)
- Can be rotated without code changes
- Access controlled via RBAC

**Production Recommendations**:
1. Use external secret management (HashiCorp Vault, AWS Secrets Manager)
2. Rotate secrets regularly
3. Use different secrets per environment
4. Enable encryption at rest for etcd

---

## Deployment Flow

### Local Development

```bash
# 1. Start service
cd product-service
npm install
cp .env.example .env
npm run dev

# 2. Service connects to local/remote MongoDB
# 3. Make code changes
# 4. Service auto-restarts (nodemon)
```

### Kubernetes Deployment (Manual)

```bash
# 1. Build Docker images
cd product-service
docker build -t my-registry/product-service:v1 .
docker push my-registry/product-service:v1

# 2. Update K8s manifests
# Change image tags to :v1

# 3. Apply to cluster
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml -n simple-store
kubectl apply -f k8s/mongodb/ -n simple-store
kubectl apply -f k8s/product-service.yaml -n simple-store
# ... (repeat for all services)

# 4. Verify
kubectl get pods -n simple-store
kubectl get services -n simple-store
```

### Automated Deployment (CI/CD)

```bash
# 1. Developer commits code
git add .
git commit -m "Add new feature"
git push origin main

# 2. GitHub Actions triggers
# - Runs tests
# - Builds Docker images
# - Pushes to ghcr.io
# - Deploys to Kubernetes
# - Verifies deployment

# 3. Check deployment status
kubectl get pods -n simple-store

# 4. Access application
kubectl get service api-gateway -n simple-store
# Visit http://EXTERNAL-IP/
```

---

## Scaling Strategy

### Horizontal Scaling (Add More Pods)

```bash
# Scale API Gateway to 5 replicas
kubectl scale deployment api-gateway --replicas=5 -n simple-store

# Auto-scaling (future)
kubectl autoscale deployment api-gateway --min=2 --max=10 --cpu-percent=70 -n simple-store
```

**When to Scale**:
- High CPU/memory usage
- Increased request latency
- Sales events or traffic spikes

### Vertical Scaling (Bigger Pods)

```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "200m"
  limits:
    memory: "512Mi"
    cpu: "400m"
```

**When to Scale**:
- Memory-intensive operations
- CPU-bound computations

### Database Scaling

**Current**: Single MongoDB instance

**Future**:
- MongoDB Replica Set (3+ replicas for high availability)
- Sharding (distribute data across multiple servers)
- Read replicas (separate read and write traffic)

---

## Troubleshooting Guide

### Pods Not Starting

```bash
# Check pod status
kubectl get pods -n simple-store

# View pod details
kubectl describe pod <POD-NAME> -n simple-store

# Check logs
kubectl logs <POD-NAME> -n simple-store

# Common issues:
# - Image pull errors (wrong registry/tag)
# - Insufficient resources (need bigger node)
# - Failed health checks (app not responding)
# - Missing secrets (MongoDB credentials)
```

### Service Not Accessible

```bash
# Check service
kubectl get services -n simple-store

# Check endpoints (are pods registered?)
kubectl get endpoints -n simple-store

# Test internal connectivity
kubectl run -it --rm debug --image=alpine --restart=Never -n simple-store -- sh
# Inside pod: wget -O- http://product-service:3001/health
```

### Database Connection Failures

```bash
# Check MongoDB pod
kubectl get pods -l app=mongodb -n simple-store

# Check MongoDB logs
kubectl logs mongodb-0 -n simple-store

# Test MongoDB connection
kubectl exec -it mongodb-0 -n simple-store -- mongosh

# Common issues:
# - MongoDB not ready yet
# - Wrong connection string
# - Missing secrets
# - Network policy blocking access
```

### CI/CD Pipeline Failures

**Test Failures**:
```
# Check GitHub Actions logs
# Fix failing tests
# Push updated code
```

**Build Failures**:
```
# Check Dockerfile syntax
# Verify all dependencies in package.json
# Test build locally: docker build -t test .
```

**Deployment Failures**:
```
# Check KUBE_CONFIG secret is set
# Verify cluster is accessible
# Check image tags match in manifests
# Verify namespace exists
```

---

## Summary

CloudShop demonstrates modern microservices architecture with:

✅ **Microservices**: Independent, scalable services
✅ **Containerization**: Docker for consistency
✅ **Orchestration**: Kubernetes for automation
✅ **CI/CD**: Automated deployment pipeline
✅ **Security**: JWT auth, password hashing, secrets management
✅ **Scalability**: Horizontal scaling, load balancing
✅ **Resilience**: Health checks, auto-restart, rolling updates

All code is now fully commented explaining:
- **What** each component does
- **Why** it exists
- **How** it works
- **When** to use it

Refer to inline code comments for detailed explanations of every function, configuration, and architectural decision.
