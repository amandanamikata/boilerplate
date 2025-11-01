<!--
  ORDERS PAGE

  PURPOSE: Display user's order history
-->

<template>
  <div class="orders-page">
    <h1>My Orders</h1>

    <div v-if="loading" class="loading">Loading orders...</div>

    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else-if="orders.length === 0" class="empty">
      <p>No orders yet</p>
      <router-link to="/" class="btn btn-primary">Start Shopping</router-link>
    </div>

    <div v-else class="orders-list">
      <div v-for="order in orders" :key="order._id" class="order-card">
        <div class="order-header">
          <div>
            <strong>Order #{{ order._id.slice(-8) }}</strong>
            <p class="order-date">{{ formatDate(order.createdAt) }}</p>
          </div>
          <span class="order-status" :class="`status-${order.status}`">
            {{ order.status.toUpperCase() }}
          </span>
        </div>

        <div class="order-items">
          <div v-for="item in order.items" :key="item.productId" class="order-item">
            {{ item.productName }} × {{ item.quantity }} - ${{ (item.price * item.quantity).toFixed(2) }}
          </div>
        </div>

        <div class="order-footer">
          <span class="order-total">Total: ${{ order.totalAmount.toFixed(2) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../store/auth'
import { orderAPI } from '../services/api'

const authStore = useAuthStore()
const orders = ref([])
const loading = ref(true)
const error = ref(null)

async function fetchOrders() {
  try {
    const response = await orderAPI.getByUser(authStore.user._id)
    orders.value = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  } catch (err) {
    error.value = 'Failed to load orders'
  } finally {
    loading.value = false
  }
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

onMounted(fetchOrders)
</script>

<style scoped>
.orders-page {
  padding: 2rem 0;
  max-width: 800px;
  margin: 0 auto;
}

.loading, .error, .empty {
  text-align: center;
  padding: 3rem;
}

.order-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.order-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.order-date {
  color: #7f8c8d;
  margin: 0.25rem 0 0 0;
}

.order-status {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: bold;
}

.status-pending { background: #f39c12; color: white; }
.status-processing { background: #3498db; color: white; }
.status-shipped { background: #9b59b6; color: white; }
.status-delivered { background: #27ae60; color: white; }
.status-cancelled { background: #e74c3c; color: white; }

.order-item {
  padding: 0.5rem 0;
  color: #555;
}

.order-footer {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
  text-align: right;
}

.order-total {
  font-size: 1.2rem;
  font-weight: bold;
  color: #27ae60;
}
</style>
