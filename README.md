# CloudShop - Microservices on Kubernetes

A simple e-commerce store built with microservices architecture, running on Kubernetes with automated CI/CD using GitHub Actions.

## Architecture

The application consists of a **Vue.js frontend** and four backend microservices:

- **Frontend** (Port 80) - Vue.js web interface for customers
- **API Gateway** (Port 3000) - Entry point for all API requests
- **Product Service** (Port 3001) - Manages product catalog and inventory
- **User Service** (Port 3002) - Handles user authentication and profiles
- **Order Service** (Port 3003) - Processes and manages orders

Each service has its own MongoDB database and communicates via REST APIs.

## Tech Stack

- **Frontend**: Vue.js 3, Vite, Pinia, Vue Router, Nginx
- **Backend**: Node.js with Express
- **Database**: MongoDB
- **Container**: Docker
- **Orchestration**: Kubernetes
- **CI/CD**: GitHub Actions
- **Registry**: GitHub Container Registry (GHCR)

## Project Structure

```
cloudshop/
├── frontend/             # Vue.js frontend application
├── api-gateway/          # API Gateway service
├── product-service/      # Product microservice
├── user-service/         # User microservice
├── order-service/        # Order microservice
├── k8s/                  # Kubernetes manifests
│   ├── mongodb/          # MongoDB StatefulSet
│   ├── namespace.yaml    # Kubernetes namespace
│   ├── secrets.yaml      # Application secrets
│   ├── frontend.yaml     # Frontend deployment
│   ├── product-service.yaml
│   ├── user-service.yaml
│   ├── order-service.yaml
│   └── api-gateway.yaml
├── .github/workflows/    # GitHub Actions workflows
├── ARCHITECTURE.md       # Complete system architecture documentation
└── FRONTEND_SETUP.md     # Frontend quick start guide
```

## Prerequisites

- Docker Desktop or Docker Engine
- Kubernetes cluster (GKE, EKS, AKS, or local with Minikube/Kind)
- kubectl CLI
- Node.js 18+ (for local development)
- GitHub account (for CI/CD)

## Local Development

### Running Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at `http://localhost:8080`

See **[FRONTEND_SETUP.md](FRONTEND_SETUP.md)** for detailed frontend guide.

### Running Backend Services

Each service can be run locally:

```bash
cd product-service
npm install
cp .env.example .env
npm run dev
```

Repeat for `user-service`, `order-service`, and `api-gateway`.

### Running with Docker Compose (Optional)

Create a `docker-compose.yaml` in the root directory for local testing.

## Kubernetes Deployment

### 1. Configure kubectl

Make sure your kubectl is configured to connect to your cluster:

```bash
# For GKE
gcloud container clusters get-credentials YOUR_CLUSTER_NAME --region YOUR_REGION

# For EKS
aws eks update-kubeconfig --name YOUR_CLUSTER_NAME --region YOUR_REGION

# For AKS
az aks get-credentials --resource-group YOUR_RG --name YOUR_CLUSTER_NAME
```

### 2. Update Image Registry

Edit the Kubernetes manifests in `k8s/` directory and replace `YOUR_REGISTRY` with your actual container registry:

```bash
# Example for GitHub Container Registry
sed -i 's|YOUR_REGISTRY|ghcr.io/YOUR_USERNAME|g' k8s/*.yaml
```

### 3. Deploy to Kubernetes

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Deploy secrets
kubectl apply -f k8s/secrets.yaml -n simple-store
kubectl apply -f k8s/mongodb/mongodb-secret.yaml -n simple-store

# Deploy MongoDB
kubectl apply -f k8s/mongodb/mongodb-statefulset.yaml -n simple-store

# Wait for MongoDB to be ready
kubectl wait --for=condition=ready pod -l app=mongodb -n simple-store --timeout=300s

# Deploy microservices
kubectl apply -f k8s/product-service.yaml -n simple-store
kubectl apply -f k8s/user-service.yaml -n simple-store
kubectl apply -f k8s/order-service.yaml -n simple-store
kubectl apply -f k8s/api-gateway.yaml -n simple-store

# Check deployment status
kubectl get pods -n simple-store
kubectl get services -n simple-store
```

### 4. Access the Application

Get the external IP of the frontend:

```bash
kubectl get service frontend -n simple-store
```

The web application will be available at `http://EXTERNAL-IP/`

You can also access the API Gateway directly:

```bash
kubectl get service api-gateway -n simple-store
```

The API will be available at `http://EXTERNAL-IP/`

## CI/CD with GitHub Actions

### Setup

1. **Fork/Clone the repository** to your GitHub account

2. **Configure GitHub Secrets**:
   - Go to Settings > Secrets and variables > Actions
   - Add the following secrets:
     - `KUBE_CONFIG`: Your base64-encoded kubeconfig file
       ```bash
       cat ~/.kube/config | base64 | pbcopy  # macOS
       cat ~/.kube/config | base64 -w 0       # Linux
       ```

3. **Enable GitHub Packages**:
   - The workflow uses GHCR (GitHub Container Registry)
   - No additional setup needed, it uses `GITHUB_TOKEN`

### Workflows

**Main CI/CD Pipeline** (`.github/workflows/ci-cd.yaml`):
- Triggers on push to `main` or `develop` branches
- Runs tests for all services
- Builds and pushes Docker images to GHCR
- Deploys to Kubernetes cluster
- Verifies deployment

**Local Build Test** (`.github/workflows/docker-build-local.yaml`):
- Manual trigger only
- Builds Docker images without pushing
- Useful for testing build process

### Triggering Deployment

Simply push to the `main` branch:

```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

GitHub Actions will automatically:
1. Run tests
2. Build Docker images
3. Push to container registry
4. Deploy to Kubernetes
5. Verify all pods are running

## API Endpoints

### Product Service
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### User Service
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `GET /api/users/profile/:id` - Get user profile
- `PUT /api/users/:id` - Update user

### Order Service
- `GET /api/orders` - Get all orders
- `GET /api/orders/user/:userId` - Get orders by user
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create order
- `PATCH /api/orders/:id/status` - Update order status
- `DELETE /api/orders/:id` - Cancel order

### Health Checks
- `GET /health` - Available on all services
- `GET /status` - API Gateway service status

## Scaling

Scale individual services:

```bash
kubectl scale deployment product-service --replicas=3 -n simple-store
kubectl scale deployment user-service --replicas=3 -n simple-store
kubectl scale deployment order-service --replicas=3 -n simple-store
kubectl scale deployment api-gateway --replicas=3 -n simple-store
```

## Monitoring

View logs:

```bash
# All pods
kubectl logs -l app=product-service -n simple-store --tail=100 -f

# Specific pod
kubectl logs POD_NAME -n simple-store -f
```

## Security Considerations

**IMPORTANT**: Before deploying to production:

1. Change MongoDB credentials in `k8s/mongodb/mongodb-secret.yaml`
2. Change JWT secret in `k8s/secrets.yaml`
3. Use proper secret management (e.g., HashiCorp Vault, AWS Secrets Manager)
4. Enable network policies
5. Set up TLS/SSL certificates
6. Implement proper authentication middleware
7. Add rate limiting (already included in API Gateway)

## Troubleshooting

### Pods not starting

```bash
kubectl describe pod POD_NAME -n simple-store
kubectl logs POD_NAME -n simple-store
```

### Service not accessible

```bash
kubectl get endpoints -n simple-store
kubectl get services -n simple-store
```

### Database connection issues

```bash
kubectl exec -it mongodb-0 -n simple-store -- mongosh
```

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
