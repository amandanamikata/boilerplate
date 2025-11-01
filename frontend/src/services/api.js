/**
 * API SERVICE
 *
 * PURPOSE: Centralized API communication with backend
 *
 * WHY:
 * - Single source of truth for API endpoints
 * - Automatic JWT token handling
 * - Error handling in one place
 * - Easy to modify API URL
 */

import axios from 'axios'

// Base API URL
// WHY: Can be configured via environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor: Add JWT token to requests
// WHY: Automatic authentication for protected routes
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor: Handle common errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized (token expired)
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

/**
 * PRODUCT API
 */
export const productAPI = {
  // Get all products
  getAll: () => apiClient.get('/api/products'),

  // Get single product
  getById: (id) => apiClient.get(`/api/products/${id}`),

  // Create product (admin only)
  create: (data) => apiClient.post('/api/products', data),

  // Update product (admin only)
  update: (id, data) => apiClient.put(`/api/products/${id}`, data),

  // Delete product (admin only)
  delete: (id) => apiClient.delete(`/api/products/${id}`)
}

/**
 * USER API
 */
export const userAPI = {
  // Register new user
  register: (data) => apiClient.post('/api/users/register', data),

  // Login user
  login: (data) => apiClient.post('/api/users/login', data),

  // Get user profile
  getProfile: (id) => apiClient.get(`/api/users/profile/${id}`),

  // Update user profile
  update: (id, data) => apiClient.put(`/api/users/${id}`, data)
}

/**
 * ORDER API
 */
export const orderAPI = {
  // Get all orders (admin)
  getAll: () => apiClient.get('/api/orders'),

  // Get user's orders
  getByUser: (userId) => apiClient.get(`/api/orders/user/${userId}`),

  // Get single order
  getById: (id) => apiClient.get(`/api/orders/${id}`),

  // Create order
  create: (data) => apiClient.post('/api/orders', data),

  // Update order status (admin)
  updateStatus: (id, status) => apiClient.patch(`/api/orders/${id}/status`, { status }),

  // Cancel order
  cancel: (id) => apiClient.delete(`/api/orders/${id}`)
}

export default apiClient
