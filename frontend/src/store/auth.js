/**
 * AUTHENTICATION STORE (Pinia)
 *
 * PURPOSE: Manages user authentication state
 *
 * WHY PINIA:
 * - Simple, intuitive state management
 * - TypeScript support
 * - Composition API style
 * - Better than Vuex for Vue 3
 *
 * STATE:
 * - user: Current logged-in user
 * - token: JWT authentication token
 * - isAuthenticated: Boolean flag
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userAPI } from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  // STATE
  const user = ref(null)
  const token = ref(null)

  // GETTERS (computed properties)
  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  // ACTIONS

  /**
   * Initialize store from localStorage
   * WHY: Persist auth across page refreshes
   */
  function init() {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')

    if (savedToken && savedUser) {
      token.value = savedToken
      user.value = JSON.parse(savedUser)
    }
  }

  /**
   * Register new user
   */
  async function register(userData) {
    try {
      const response = await userAPI.register(userData)
      setAuth(response.data.user, response.data.token)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      }
    }
  }

  /**
   * Login user
   */
  async function login(credentials) {
    try {
      const response = await userAPI.login(credentials)
      setAuth(response.data.user, response.data.token)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      }
    }
  }

  /**
   * Logout user
   */
  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  /**
   * Set authentication data
   * WHY: Centralized auth state update
   */
  function setAuth(userData, authToken) {
    user.value = userData
    token.value = authToken
    localStorage.setItem('token', authToken)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  // Initialize on store creation
  init()

  return {
    // State
    user,
    token,
    // Getters
    isAuthenticated,
    isAdmin,
    // Actions
    register,
    login,
    logout
  }
})
