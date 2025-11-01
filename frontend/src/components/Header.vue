<!--
  HEADER COMPONENT

  PURPOSE: Navigation bar with cart and auth links

  FEATURES:
  - Logo and brand name
  - Navigation links
  - Shopping cart badge
  - Login/Logout buttons
  - Responsive mobile menu
-->

<template>
  <header class="header">
    <div class="container">
      <!-- Logo -->
      <router-link to="/" class="logo">
        🛒 CloudShop
      </router-link>

      <!-- Navigation -->
      <nav class="nav">
        <router-link to="/" class="nav-link">Products</router-link>

        <router-link to="/cart" class="nav-link cart-link">
          Cart
          <!-- Cart badge showing item count -->
          <span v-if="cartStore.itemCount > 0" class="badge">
            {{ cartStore.itemCount }}
          </span>
        </router-link>

        <!-- Auth-dependent navigation -->
        <template v-if="authStore.isAuthenticated">
          <router-link to="/orders" class="nav-link">My Orders</router-link>
          <button @click="handleLogout" class="btn btn-secondary">
            Logout
          </button>
        </template>
        <template v-else>
          <router-link to="/login" class="btn btn-primary">Login</router-link>
        </template>
      </nav>
    </div>
  </header>
</template>

<script setup>
/**
 * SCRIPT SETUP
 *
 * Uses Composition API with stores
 */
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import { useCartStore } from '../store/cart'

const router = useRouter()
const authStore = useAuthStore()
const cartStore = useCartStore()

/**
 * Handle logout
 * WHY: Clears auth state and redirects to home
 */
function handleLogout() {
  authStore.logout()
  router.push('/')
}
</script>

<style scoped>
.header {
  background-color: #2c3e50;
  color: white;
  padding: 1rem 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logo:hover {
  color: #3498db;
}

.nav {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.3s;
  position: relative;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-link.router-link-active {
  background-color: #3498db;
}

.cart-link {
  position: relative;
}

.badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: #e74c3c;
  color: white;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 0.75rem;
  font-weight: bold;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-primary:hover {
  background-color: #2980b9;
}

.btn-secondary {
  background-color: transparent;
  color: white;
  border: 1px solid white;
}

.btn-secondary:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

/* Responsive design for mobile */
@media (max-width: 768px) {
  .container {
    flex-direction: column;
    gap: 1rem;
  }

  .nav {
    flex-wrap: wrap;
    justify-content: center;
  }

  .nav-link {
    padding: 0.5rem;
  }
}
</style>
