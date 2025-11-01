/**
 * VUE ROUTER CONFIGURATION
 *
 * PURPOSE: Defines application routes and navigation
 *
 * ROUTES:
 * - / : Home page (product catalog)
 * - /login : Login page
 * - /register : Registration page
 * - /cart : Shopping cart
 * - /checkout : Order placement
 * - /orders : Order history (auth required)
 * - /product/:id : Product details
 *
 * NAVIGATION GUARDS:
 * - requiresAuth: Redirects to login if not authenticated
 */

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth'

// Lazy-loaded views for better performance
const Home = () => import('../views/Home.vue')
const Login = () => import('../views/Login.vue')
const Register = () => import('../views/Register.vue')
const Cart = () => import('../views/Cart.vue')
const Checkout = () => import('../views/Checkout.vue')
const Orders = () => import('../views/Orders.vue')
const ProductDetail = () => import('../views/ProductDetail.vue')

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { title: 'CloudShop - Home' }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { title: 'Login' }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { title: 'Register' }
  },
  {
    path: '/cart',
    name: 'Cart',
    component: Cart,
    meta: { title: 'Shopping Cart' }
  },
  {
    path: '/checkout',
    name: 'Checkout',
    component: Checkout,
    meta: {
      title: 'Checkout',
      requiresAuth: true // Must be logged in
    }
  },
  {
    path: '/orders',
    name: 'Orders',
    component: Orders,
    meta: {
      title: 'My Orders',
      requiresAuth: true // Must be logged in
    }
  },
  {
    path: '/product/:id',
    name: 'ProductDetail',
    component: ProductDetail,
    meta: { title: 'Product Details' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

/**
 * NAVIGATION GUARD
 *
 * WHY: Protects routes that require authentication
 * Checks if route requires auth and user is logged in
 * Redirects to login if not authenticated
 */
router.beforeEach((to, from, next) => {
  // Set page title
  document.title = to.meta.title || 'CloudShop'

  // Check if route requires authentication
  if (to.meta.requiresAuth) {
    const authStore = useAuthStore()

    if (!authStore.isAuthenticated) {
      // Not logged in, redirect to login
      next({
        name: 'Login',
        query: { redirect: to.fullPath } // Save intended destination
      })
    } else {
      // Logged in, proceed
      next()
    }
  } else {
    // Route doesn't require auth, proceed
    next()
  }
})

export default router
