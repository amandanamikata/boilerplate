<!--
  PRODUCT DETAIL PAGE

  PURPOSE: Show detailed product information
-->

<template>
  <div class="product-detail">
    <div v-if="loading" class="loading">Loading...</div>

    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else-if="product" class="product-container">
      <div class="product-image">
        <img :src="product.imageUrl || '/placeholder.png'" :alt="product.name" />
      </div>

      <div class="product-info">
        <h1>{{ product.name }}</h1>
        <p class="category">{{ product.category }}</p>
        <p class="price">${{ product.price.toFixed(2) }}</p>
        <p class="stock" :class="stockClass">{{ stockText }}</p>
        <p class="description">{{ product.description }}</p>

        <div class="actions">
          <button
            @click="addToCart"
            class="btn btn-primary"
            :disabled="product.stock === 0"
          >
            {{ product.stock > 0 ? 'Add to Cart' : 'Out of Stock' }}
          </button>
          <router-link to="/" class="btn btn-secondary">Back to Products</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCartStore } from '../store/cart'
import { productAPI } from '../services/api'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()

const product = ref(null)
const loading = ref(true)
const error = ref(null)

const stockClass = computed(() => {
  if (!product.value) return ''
  if (product.value.stock === 0) return 'out-of-stock'
  if (product.value.stock < 10) return 'low-stock'
  return 'in-stock'
})

const stockText = computed(() => {
  if (!product.value) return ''
  if (product.value.stock === 0) return 'Out of Stock'
  if (product.value.stock < 10) return `Only ${product.value.stock} left`
  return 'In Stock'
})

async function fetchProduct() {
  try {
    const response = await productAPI.getById(route.params.id)
    product.value = response.data
  } catch (err) {
    error.value = 'Product not found'
  } finally {
    loading.value = false
  }
}

function addToCart() {
  cartStore.addItem(product.value, 1)
  router.push('/cart')
}

onMounted(fetchProduct)
</script>

<style scoped>
.product-detail {
  padding: 2rem 0;
}

.product-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  max-width: 1000px;
  margin: 0 auto;
}

.product-image img {
  width: 100%;
  border-radius: 8px;
}

h1 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.category {
  color: #7f8c8d;
  margin-bottom: 1rem;
}

.price {
  font-size: 2rem;
  font-weight: bold;
  color: #27ae60;
  margin-bottom: 1rem;
}

.stock {
  margin-bottom: 1rem;
}

.in-stock { color: #27ae60; }
.low-stock { color: #f39c12; }
.out-of-stock { color: #e74c3c; }

.description {
  color: #555;
  line-height: 1.6;
  margin-bottom: 2rem;
}

.actions {
  display: flex;
  gap: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

@media (max-width: 768px) {
  .product-container {
    grid-template-columns: 1fr;
  }
}
</style>
