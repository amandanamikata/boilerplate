# CloudShop Frontend

Vue.js-based frontend for the CloudShop e-commerce platform.

## Technology Stack

- **Vue 3** - Progressive JavaScript framework
- **Vue Router** - Client-side routing
- **Pinia** - State management
- **Vite** - Build tool and dev server
- **Axios** - HTTP client
- **Nginx** - Production web server

## Features

✅ Product catalog with search
✅ Shopping cart management
✅ User authentication (register/login)
✅ Order placement and tracking
✅ Responsive design (mobile-friendly)
✅ JWT-based authentication
✅ Persistent cart (localStorage)

## Project Structure

```
frontend/
├── src/
│   ├── components/      # Reusable components
│   │   ├── Header.vue
│   │   └── ProductCard.vue
│   ├── views/           # Page components
│   │   ├── Home.vue
│   │   ├── Login.vue
│   │   ├── Register.vue
│   │   ├── Cart.vue
│   │   ├── Checkout.vue
│   │   ├── Orders.vue
│   │   └── ProductDetail.vue
│   ├── store/           # State management
│   │   ├── auth.js      # Authentication state
│   │   └── cart.js      # Shopping cart state
│   ├── services/        # API communication
│   │   └── api.js
│   ├── router/          # Route configuration
│   │   └── index.js
│   ├── App.vue          # Root component
│   └── main.js          # Application entry
├── public/              # Static assets
├── index.html           # HTML template
├── vite.config.js       # Vite configuration
├── package.json         # Dependencies
├── Dockerfile           # Docker image
└── nginx.conf           # Nginx configuration

```

## Local Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

The app will be available at `http://localhost:8080`

### Environment Variables

Create `.env` file:

```env
VITE_API_URL=http://localhost:3000
```

## Building for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

Output is in `dist/` directory.

## Docker

### Build Image

```bash
docker build -t cloudshop-frontend .
```

### Run Container

```bash
docker run -p 8080:80 cloudshop-frontend
```

## State Management

### Authentication Store (Pinia)

Manages user authentication:
- Login/logout
- Token storage
- User profile

```javascript
import { useAuthStore } from '@/store/auth'

const authStore = useAuthStore()

// Login
await authStore.login({ email, password })

// Check if authenticated
if (authStore.isAuthenticated) {
  // User is logged in
}

// Logout
authStore.logout()
```

### Cart Store (Pinia)

Manages shopping cart:
- Add/remove items
- Update quantities
- Calculate totals

```javascript
import { useCartStore } from '@/store/cart'

const cartStore = useCartStore()

// Add to cart
cartStore.addItem(product, quantity)

// Get total
console.log(cartStore.totalPrice)

// Clear cart
cartStore.clearCart()
```

## Routing

Routes are defined in `src/router/index.js`:

| Route | Component | Auth Required |
|-------|-----------|---------------|
| `/` | Home | No |
| `/login` | Login | No |
| `/register` | Register | No |
| `/cart` | Cart | No |
| `/checkout` | Checkout | Yes |
| `/orders` | Orders | Yes |
| `/product/:id` | ProductDetail | No |

Protected routes redirect to login if user is not authenticated.

## API Communication

API service in `src/services/api.js` provides:

**Product API:**
- `productAPI.getAll()` - Get all products
- `productAPI.getById(id)` - Get single product

**User API:**
- `userAPI.register(data)` - Register new user
- `userAPI.login(data)` - Login user

**Order API:**
- `orderAPI.create(data)` - Create order
- `orderAPI.getByUser(userId)` - Get user's orders

JWT token is automatically added to requests via Axios interceptor.

## Deployment

### Kubernetes

Frontend is deployed as a Kubernetes Deployment with:
- 2 replicas for high availability
- Nginx serving static files
- LoadBalancer service for external access

```bash
kubectl apply -f k8s/frontend.yaml -n simple-store
kubectl get service frontend -n simple-store
```

Access via LoadBalancer external IP.

### CI/CD

Automated deployment via GitHub Actions:
1. Tests run on every push
2. Docker image built and pushed to registry
3. Deployed to Kubernetes cluster
4. Health checks verify deployment

## Troubleshooting

### API Connection Issues

If API calls fail, check:
1. API Gateway is running
2. VITE_API_URL is correct
3. Network connectivity

### Build Failures

```bash
# Clear cache and reinstall
rm -rf node_modules dist
npm install
npm run build
```

### CORS Errors

In development, Vite proxy handles CORS.
In production, nginx proxies `/api` to backend.

## Contributing

1. Create feature branch
2. Make changes
3. Test locally
4. Create pull request

## License

MIT
