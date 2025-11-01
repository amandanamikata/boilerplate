# CloudShop Frontend - Quick Start Guide

## What Was Built

A complete **Vue.js 3 frontend** for your CloudShop e-commerce platform with:

### Pages & Features

1. **Home Page** (`/`)
   - Product catalog grid
   - Product cards with images, prices, stock status
   - Add to cart functionality
   - Click product to see details

2. **Product Detail** (`/product/:id`)
   - Full product information
   - Large product image
   - Stock availability
   - Add to cart button

3. **Shopping Cart** (`/cart`)
   - View all cart items
   - Update quantities
   - Remove items
   - See total price
   - Proceed to checkout

4. **Login** (`/login`)
   - Email and password authentication
   - JWT token-based auth
   - Redirect after login

5. **Register** (`/register`)
   - New user registration
   - Auto-login after registration
   - Form validation

6. **Checkout** (`/checkout`)
   - Shipping address form
   - Order summary
   - Place order
   - Requires authentication

7. **Order History** (`/orders`)
   - View all past orders
   - Order status tracking
   - Order details
   - Requires authentication

### Technical Features

✅ **State Management** (Pinia)
- Authentication state (login/logout)
- Shopping cart state (persistent via localStorage)

✅ **Routing** (Vue Router)
- Client-side navigation
- Protected routes (require login)
- Route guards

✅ **API Integration** (Axios)
- Centralized API service
- Automatic JWT token handling
- Error handling

✅ **Responsive Design**
- Mobile-friendly
- Tablet-optimized
- Desktop layout

✅ **Modern Build Tools** (Vite)
- Fast development server
- Hot module replacement
- Optimized production builds

✅ **Production Ready**
- Docker containerization
- Nginx web server
- Kubernetes deployment
- CI/CD integration

## How to Run Locally

### Option 1: Development Mode (with hot reload)

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Visit `http://localhost:8080`

**Note**: Make sure your backend services (API Gateway) are running on port 3000.

### Option 2: Production Build

```bash
cd frontend

# Build for production
npm run build

# Preview production build
npm run preview
```

### Option 3: Docker

```bash
cd frontend

# Build Docker image
docker build -t cloudshop-frontend .

# Run container
docker run -p 8080:80 cloudshop-frontend
```

Visit `http://localhost:8080`

## How to Deploy to Kubernetes

The frontend is already configured for Kubernetes deployment and integrated into your CI/CD pipeline.

### Manual Deployment

```bash
# Deploy frontend
kubectl apply -f k8s/frontend.yaml -n simple-store

# Check deployment
kubectl get pods -n simple-store
kubectl get svc frontend -n simple-store

# Get external URL
kubectl get service frontend -n simple-store
# Look for EXTERNAL-IP column
```

### Automated Deployment (CI/CD)

Simply push to the `main` branch:

```bash
git add .
git commit -m "Deploy frontend"
git push origin main
```

GitHub Actions will automatically:
1. Run tests
2. Build Docker image
3. Push to container registry
4. Deploy to Kubernetes
5. Verify deployment

## Project Structure Explained

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Header.vue       # Top navigation bar
│   │   └── ProductCard.vue  # Product display card
│   │
│   ├── views/               # Page components (one per route)
│   │   ├── Home.vue         # Product catalog
│   │   ├── Login.vue        # Login form
│   │   ├── Register.vue     # Registration form
│   │   ├── Cart.vue         # Shopping cart
│   │   ├── Checkout.vue     # Order placement
│   │   ├── Orders.vue       # Order history
│   │   └── ProductDetail.vue # Product details
│   │
│   ├── store/               # State management (Pinia)
│   │   ├── auth.js          # User authentication state
│   │   └── cart.js          # Shopping cart state
│   │
│   ├── services/            # API communication layer
│   │   └── api.js           # HTTP requests to backend
│   │
│   ├── router/              # Route configuration
│   │   └── index.js         # Route definitions
│   │
│   ├── App.vue              # Root component
│   └── main.js              # Application entry point
│
├── public/                  # Static assets
├── index.html               # HTML template
├── vite.config.js          # Build configuration
├── package.json            # Dependencies
├── Dockerfile              # Docker image definition
└── nginx.conf              # Production web server config
```

## How It Works

### Authentication Flow

1. User registers/logs in
2. Backend returns JWT token + user data
3. Token stored in localStorage
4. Token automatically added to all API requests
5. Protected routes check authentication
6. Logout clears token and redirects

### Shopping Cart Flow

1. User browses products
2. Clicks "Add to Cart"
3. Item added to Pinia cart store
4. Cart persisted to localStorage
5. Cart badge shows item count
6. Checkout creates order via API
7. Cart cleared after successful order

### Order Flow

1. User adds products to cart
2. Proceeds to checkout (login required)
3. Enters shipping address
4. Reviews order summary
5. Clicks "Place Order"
6. Frontend calls Order API
7. Order Service validates products with Product Service
8. Order created and saved
9. User redirected to order history
10. Can view order status

## API Integration

The frontend communicates with your backend microservices:

```
Frontend (Vue.js)
    ↓
Nginx (proxies /api requests)
    ↓
API Gateway (port 3000)
    ↓
Microservices (Product, User, Order)
```

In production, nginx proxies all `/api/*` requests to the `api-gateway` service, avoiding CORS issues.

## Environment Configuration

### Development (.env)

```env
VITE_API_URL=http://localhost:3000
```

### Production (Kubernetes)

Nginx configuration handles API proxying:
- Frontend: `http://frontend-external-ip/`
- API calls: `http://frontend-external-ip/api/*`
- Proxied to: `http://api-gateway/api/*`

## Next Steps

### Immediate

1. **Run locally** to test:
   ```bash
   cd frontend && npm install && npm run dev
   ```

2. **Add sample products** via API:
   ```bash
   curl -X POST http://localhost:3000/api/products \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Sample Product",
       "description": "A great product",
       "price": 29.99,
       "stock": 100,
       "category": "Electronics",
       "imageUrl": "https://via.placeholder.com/300"
     }'
   ```

3. **Test the complete flow**:
   - Browse products
   - Register account
   - Add items to cart
   - Place an order
   - View order history

### Enhancements (Optional)

1. **Add product images** - Use a CDN or cloud storage
2. **Add search/filter** - Filter by category, price range
3. **Add pagination** - For large product catalogs
4. **Add wishlist** - Save favorite products
5. **Add reviews** - Product ratings and reviews
6. **Add admin panel** - Manage products, orders
7. **Add payment integration** - Stripe, PayPal
8. **Add email notifications** - Order confirmations
9. **Add product recommendations** - AI-powered suggestions
10. **Add analytics** - Track user behavior

## Troubleshooting

### "Cannot GET /api/products"

**Problem**: Backend not running
**Solution**: Start backend services:
```bash
# Start API Gateway
cd api-gateway && npm run dev
```

### "CORS Error"

**Problem**: Browser blocking cross-origin requests
**Solution**:
- Development: Vite proxy handles this automatically
- Production: Nginx proxy handles this

### "401 Unauthorized"

**Problem**: JWT token expired or invalid
**Solution**:
- Login again
- Check token in localStorage (browser dev tools)

### Products Not Showing

**Problem**: No products in database
**Solution**: Add products via API (see "Add sample products" above)

## Support

All code is fully commented explaining:
- What each component does
- Why it exists
- How it works
- When to use it

Check inline code comments for detailed explanations!
