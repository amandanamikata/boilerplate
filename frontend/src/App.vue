<!--
  ROOT COMPONENT

  PURPOSE: Main application wrapper

  STRUCTURE:
  - Header navigation (always visible)
  - RouterView for page content (changes based on route)
  - Footer (optional)
-->

<template>
  <div id="app">
    <!-- Navigation Header -->
    <Header />

    <!-- Main Content Area -->
    <!-- RouterView renders the component for current route -->
    <main class="main-content">
      <router-view />
    </main>

    <!-- Footer -->
    <footer class="footer">
      <p>&copy; 2024 CloudShop. Built with Vue.js &amp; Microservices</p>
    </footer>
  </div>
</template>

<script setup>
/**
 * SCRIPT SETUP
 *
 * WHY: Vue 3 Composition API - cleaner, more maintainable code
 */
import Header from './components/Header.vue'
</script>

<style scoped>
/**
 * GLOBAL STYLES
 *
 * WHY scoped: Styles only apply to this component
 */

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  width: 100%;
}

.footer {
  background-color: #333;
  color: white;
  text-align: center;
  padding: 20px;
  margin-top: 40px;
}

/* Responsive design */
@media (max-width: 768px) {
  .main-content {
    padding: 10px;
  }
}
</style>
