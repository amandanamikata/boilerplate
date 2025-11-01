/**
 * VUE.JS APPLICATION ENTRY POINT
 *
 * PURPOSE: Initializes the Vue application with routing and state management
 *
 * SETUP:
 * - Creates Vue app instance
 * - Configures Pinia (state management)
 * - Configures Vue Router (navigation)
 * - Mounts app to DOM
 */

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Create Vue application instance
const app = createApp(App)

// Add Pinia for state management
// WHY: Centralized state for cart, user auth, etc.
app.use(createPinia())

// Add Vue Router for navigation
// WHY: Single-page application with multiple views
app.use(router)

// Mount to DOM element with id="app"
app.mount('#app')
