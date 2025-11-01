<!--
  PRODUCT CARD COMPONENT

  PURPOSE: Display single product in grid/list

  FEATURES:
  - Product image
  - Name and price
  - Stock status
  - Add to cart button
  - Click to view details
-->

<template>
  <div class="product-card" @click="goToDetail">
    <!-- Product Image -->
    <div class="product-image">
      <img
        :src="product.imageUrl || '/placeholder.png'"
        :alt="product.name"
        @error="handleImageError"
      />
    </div>

    <!-- Product Info -->
    <div class="product-info">
      <h3 class="product-name">{{ product.name }}</h3>
      <p class="product-category">{{ product.category }}</p>
      <p class="product-price">${{ product.price.toFixed(2) }}</p>

      <!-- Stock status -->
      <p class="product-stock" :class="stockClass">
        {{ stockText }}
      </p>

      <!-- Add to cart button -->
      <button
        @click.stop="addToCart"
        class="btn btn-primary"
        :disabled="product.stock === 0"
      >
        {{ product.stock > 0 ? 'Add to Cart' : 'Out of Stock' }}
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * SCRIPT SETUP
 *
 * Props: product object
 * Emits: None
 */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../store/cart'

const props = defineProps({
  product: {
    type: Object,
    required: true
  }
})

const router = useRouter()
const cartStore = useCartStore()

/**
 * Stock status styling
 */
const stockClass = computed(() => {
  if (props.product.stock === 0) return 'out-of-stock'
  if (props.product.stock < 10) return 'low-stock'
  return 'in-stock'
})

/**
 * Stock status text
 */
const stockText = computed(() => {
  if (props.product.stock === 0) return 'Out of Stock'
  if (props.product.stock < 10) return `Only ${props.product.stock} left`
  return 'In Stock'
})

/**
 * Navigate to product detail page
 */
function goToDetail() {
  router.push(`/product/${props.product._id}`)
}

/**
 * Add product to cart
 */
function addToCart() {
  if (props.product.stock > 0) {
    cartStore.addItem(props.product, 1)
    // Show success feedback (you could add a toast notification here)
    alert('Added to cart!')
  }
}

/**
 * Handle broken image
 */
function handleImageError(event) {
  event.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E'
}
</script>

<style scoped>
.product-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.product-image {
  width: 100%;
  height: 200px;
  overflow: hidden;
  background-color: #f5f5f5;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info {
  padding: 1rem;
}

.product-name {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.product-category {
  color: #7f8c8d;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.product-price {
  font-size: 1.3rem;
  font-weight: bold;
  color: #27ae60;
  margin-bottom: 0.5rem;
}

.product-stock {
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.in-stock {
  color: #27ae60;
}

.low-stock {
  color: #f39c12;
}

.out-of-stock {
  color: #e74c3c;
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
</style>
