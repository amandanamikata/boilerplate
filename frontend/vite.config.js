/**
 * VITE CONFIGURATION
 *
 * WHY VITE: Fast build tool for Vue.js
 * - Lightning-fast hot module replacement (HMR)
 * - Optimized production builds
 * - Native ES modules support
 */

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],

  // Development server configuration
  server: {
    port: 8080,
    host: '0.0.0.0', // Allow external access (important for Docker)

    // Proxy API requests to backend
    // WHY: Avoids CORS issues during development
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },

  // Production build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Generate source maps for debugging
    sourcemap: true
  }
})
