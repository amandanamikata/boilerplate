<!--
  LOGIN PAGE

  PURPOSE: User authentication

  FEATURES:
  - Email and password form
  - Form validation
  - Error messages
  - Link to registration
  - Redirect after login
-->

<template>
  <div class="login-page">
    <div class="login-card">
      <h1>Login to CloudShop</h1>

      <!-- Login form -->
      <form @submit.prevent="handleLogin">
        <!-- Email -->
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            placeholder="Enter your email"
          />
        </div>

        <!-- Password -->
        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            required
            placeholder="Enter your password"
          />
        </div>

        <!-- Error message -->
        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <!-- Submit button -->
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
      </form>

      <!-- Register link -->
      <p class="register-link">
        Don't have an account?
        <router-link to="/register">Register here</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
/**
 * LOGIN VIEW
 *
 * Handles user authentication
 */
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../store/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Form state
const form = ref({
  email: '',
  password: ''
})

const loading = ref(false)
const error = ref(null)

/**
 * Handle login form submission
 */
async function handleLogin() {
  loading.value = true
  error.value = null

  const result = await authStore.login(form.value)

  if (result.success) {
    // Login successful, redirect
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } else {
    // Login failed, show error
    error.value = result.message
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  padding: 2rem;
}

.login-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 400px;
}

h1 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #2c3e50;
  font-weight: 500;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

input:focus {
  outline: none;
  border-color: #3498db;
}

.error-message {
  background-color: #ffe6e6;
  color: #e74c3c;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.btn {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2980b9;
}

.btn:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.register-link {
  text-align: center;
  margin-top: 1.5rem;
  color: #7f8c8d;
}

.register-link a {
  color: #3498db;
  text-decoration: none;
}

.register-link a:hover {
  text-decoration: underline;
}
</style>
