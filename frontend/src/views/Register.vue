<!--
  REGISTRATION PAGE

  PURPOSE: New user registration

  FEATURES:
  - Registration form
  - Form validation
  - Error messages
  - Auto-login after registration
  - Link to login
-->

<template>
  <div class="register-page">
    <div class="register-card">
      <h1>Create Account</h1>

      <!-- Registration form -->
      <form @submit.prevent="handleRegister">
        <!-- First Name -->
        <div class="form-group">
          <label for="firstName">First Name</label>
          <input
            id="firstName"
            v-model="form.firstName"
            type="text"
            required
            placeholder="Enter your first name"
          />
        </div>

        <!-- Last Name -->
        <div class="form-group">
          <label for="lastName">Last Name</label>
          <input
            id="lastName"
            v-model="form.lastName"
            type="text"
            required
            placeholder="Enter your last name"
          />
        </div>

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
            minlength="6"
            placeholder="Enter password (min 6 characters)"
          />
        </div>

        <!-- Error message -->
        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <!-- Submit button -->
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Creating Account...' : 'Register' }}
        </button>
      </form>

      <!-- Login link -->
      <p class="login-link">
        Already have an account?
        <router-link to="/login">Login here</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
/**
 * REGISTER VIEW
 *
 * Handles new user registration
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'

const router = useRouter()
const authStore = useAuthStore()

// Form state
const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  password: ''
})

const loading = ref(false)
const error = ref(null)

/**
 * Handle registration form submission
 */
async function handleRegister() {
  loading.value = true
  error.value = null

  const result = await authStore.register(form.value)

  if (result.success) {
    // Registration successful, redirect to home
    router.push('/')
  } else {
    // Registration failed, show error
    error.value = result.message
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  padding: 2rem;
}

.register-card {
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

.login-link {
  text-align: center;
  margin-top: 1.5rem;
  color: #7f8c8d;
}

.login-link a {
  color: #3498db;
  text-decoration: none;
}

.login-link a:hover {
  text-decoration: underline;
}
</style>
