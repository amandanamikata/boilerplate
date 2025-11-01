<!--
  CHECKOUT PAGE

  PURPOSE: Place order with shipping info

  FEATURES:
  - Shipping address form
  - Order summary
  - Place order button
  - Clear cart after successful order
-->

<template>
  <div class="checkout-page">
    <h1>Checkout</h1>

    <div class="checkout-grid">
      <!-- Shipping Form -->
      <div class="shipping-section">
        <h2>Shipping Address</h2>
        <form @submit.prevent="placeOrder">
          <div class="form-group">
            <label>Street Address</label>
            <input v-model="shippingAddress.street" required />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>City</label>
              <input v-model="shippingAddress.city" required />
            </div>

            <div class="form-group">
              <label>State</label>
              <input v-model="shippingAddress.state" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>ZIP Code</label>
              <input v-model="shippingAddress.zipCode" required />
            </div>

            <div class="form-group">
              <label>Country</label>
              <input v-model="shippingAddress.country" required />
            </div>
          </div>

          <div v-if="error" class="error-message">{{ error }}</div>

          <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
            {{ loading ? 'Placing Order...' : 'Place Order' }}
          </button>
        </form>
      </div>

      <!-- Order Summary -->
      <div class="summary-section">
        <h2>Order Summary</h2>
        <div class="order-items">
          <div v-for="item in cartStore.items" :key="item.product._id" class="order-item">
            <span>{{ item.product.name }} × {{ item.quantity }}</span>
            <span>${{ (item.product.price * item.quantity).toFixed(2) }}</span>
          </div>
        </div>
        <div class="order-total">
          <strong>Total:</strong>
          <strong>${{ cartStore.totalPrice.toFixed(2) }}</strong>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../store/cart'
import { useAuthStore } from '../store/auth'
import { orderAPI } from '../services/api'

const router = useRouter()
const cartStore = useCartStore()
const authStore = useAuthStore()

const shippingAddress = ref({
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: ''
})

const loading = ref(false)
const error = ref(null)

async function placeOrder() {
  loading.value = true
  error.value = null

  try {
    const orderData = {
      userId: authStore.user._id,
      items: cartStore.items.map(item => ({
        productId: item.product._id,
        quantity: item.quantity
      })),
      shippingAddress: shippingAddress.value
    }

    await orderAPI.create(orderData)
    cartStore.clearCart()
    router.push('/orders')
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to place order'
    loading.value = false
  }
}
</script>

<style scoped>
.checkout-page {
  padding: 2rem 0;
  max-width: 1000px;
  margin: 0 auto;
}

h1 { margin-bottom: 2rem; }
h2 { margin-bottom: 1rem; }

.checkout-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

.shipping-section,
.summary-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
}

.form-group {
  margin-bottom: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.order-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #eee;
}

.order-total {
  display: flex;
  justify-content: space-between;
  padding-top: 1rem;
  margin-top: 1rem;
  border-top: 2px solid #eee;
  font-size: 1.2rem;
}

.error-message {
  background: #ffe6e6;
  color: #e74c3c;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-block {
  width: 100%;
}

@media (max-width: 768px) {
  .checkout-grid {
    grid-template-columns: 1fr;
  }
}
</style>
