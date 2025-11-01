<!--
  HOME PAGE / PRODUCT CATALOG

  PURPOSE: Display all products in a grid

  FEATURES:
  - Product grid layout
  - Loading state
  - Error handling
  - Search/filter (future enhancement)
-->

<template>
  <div class="home">
    <h1>Welcome to CloudShop</h1>
    <p class="subtitle">Browse our products and start shopping!</p>

    <!-- Loading state -->
    <div v-if="loading" class="loading">
      <p>Loading products...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="fetchProducts" class="btn btn-primary">Retry</button>
    </div>

    <!-- Products grid -->
    <div v-else-if="products.length > 0" class="products-grid">
      <ProductCard
        v-for="product in products"
        :key="product._id"
        :product="product"
      />
    </div>

    <!-- Empty state -->
    <div v-else class="empty">
      <p>No products available.</p>
    </div>
  </div>
</template>

<script setup>
/**
 * HOME VIEW
 *
 * Fetches and displays all products from API
 */
import { ref, onMounted } from 'vue'
import { productAPI } from '../services/api'
import ProductCard from '../components/ProductCard.vue'

// State
const products = ref([])
const loading = ref(true)
const error = ref(null)

/**
 * Fetch products from API
 * WHY: Gets product catalog on page load
 */
async function fetchProducts() {
  loading.value = true
  error.value = null

  try {
    const response = await productAPI.getAll()
    products.value = response.data
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load products'
  } finally {
    loading.value = false
  }
}

// Fetch products when component mounts
onMounted(() => {
  fetchProducts()
})
</script>

<style scoped>
.home {
  padding: 2rem 0;
}

h1 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.subtitle {
  text-align: center;
  color: #7f8c8d;
  margin-bottom: 2rem;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.loading,
.error,
.empty {
  text-align: center;
  padding: 3rem;
  color: #7f8c8d;
}

.error {
  color: #e74c3c;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
  margin-top: 1rem;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-primary:hover {
  background-color: #2980b9;
}

/* Responsive design */
@media (max-width: 768px) {
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }
}

@media (max-width: 480px) {
  .products-grid {
    grid-template-columns: 1fr;
  }
}
</style>
