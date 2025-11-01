<!--
  SHOPPING CART PAGE

  PURPOSE: View and manage cart items

  FEATURES:
  - List all cart items
  - Update quantities
  - Remove items
  - Show total price
  - Proceed to checkout
-->

<template>
  <div class="cart-page">
    <h1>Shopping Cart</h1>

    <!-- Empty cart message -->
    <div v-if="cartStore.isEmpty" class="empty-cart">
      <p>Your cart is empty</p>
      <router-link to="/" class="btn btn-primary">Start Shopping</router-link>
    </div>

    <!-- Cart items -->
    <div v-else>
      <div class="cart-items">
        <div
          v-for="item in cartStore.items"
          :key="item.product._id"
          class="cart-item"
        >
          <!-- Product info -->
          <div class="item-info">
            <h3>{{ item.product.name }}</h3>
            <p class="item-price">${{ item.product.price.toFixed(2) }} each</p>
          </div>

          <!-- Quantity control -->
          <div class="item-quantity">
            <button @click="decreaseQuantity(item)" class="qty-btn">-</button>
            <input
              type="number"
              :value="item.quantity"
              @change="updateQuantity(item, $event)"
              min="1"
              :max="item.product.stock"
            />
            <button
              @click="increaseQuantity(item)"
              class="qty-btn"
              :disabled="item.quantity >= item.product.stock"
            >
              +
            </button>
          </div>

          <!-- Item total -->
          <div class="item-total">
            ${{ (item.product.price * item.quantity).toFixed(2) }}
          </div>

          <!-- Remove button -->
          <button
            @click="removeItem(item)"
            class="remove-btn"
            title="Remove from cart"
          >
            ×
          </button>
        </div>
      </div>

      <!-- Cart summary -->
      <div class="cart-summary">
        <div class="summary-row">
          <span>Total Items:</span>
          <span>{{ cartStore.itemCount }}</span>
        </div>
        <div class="summary-row total">
          <span>Total Price:</span>
          <span>${{ cartStore.totalPrice.toFixed(2) }}</span>
        </div>

        <router-link to="/checkout" class="btn btn-primary btn-block">
          Proceed to Checkout
        </router-link>

        <router-link to="/" class="btn btn-secondary btn-block">
          Continue Shopping
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * CART VIEW
 *
 * Displays cart items and allows quantity management
 */
import { useCartStore } from '../store/cart'

const cartStore = useCartStore()

/**
 * Decrease item quantity
 */
function decreaseQuantity(item) {
  if (item.quantity > 1) {
    cartStore.updateQuantity(item.product._id, item.quantity - 1)
  } else {
    removeItem(item)
  }
}

/**
 * Increase item quantity
 */
function increaseQuantity(item) {
  if (item.quantity < item.product.stock) {
    cartStore.updateQuantity(item.product._id, item.quantity + 1)
  }
}

/**
 * Update quantity from input
 */
function updateQuantity(item, event) {
  const newQuantity = parseInt(event.target.value)
  if (newQuantity > 0 && newQuantity <= item.product.stock) {
    cartStore.updateQuantity(item.product._id, newQuantity)
  }
}

/**
 * Remove item from cart
 */
function removeItem(item) {
  if (confirm(`Remove ${item.product.name} from cart?`)) {
    cartStore.removeItem(item.product._id)
  }
}
</script>

<style scoped>
.cart-page {
  padding: 2rem 0;
  max-width: 900px;
  margin: 0 auto;
}

h1 {
  margin-bottom: 2rem;
  color: #2c3e50;
}

.empty-cart {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 8px;
}

.empty-cart p {
  font-size: 1.2rem;
  color: #7f8c8d;
  margin-bottom: 2rem;
}

.cart-items {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 2rem;
}

.cart-item {
  display: grid;
  grid-template-columns: 2fr 150px 100px 40px;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.cart-item:last-child {
  border-bottom: none;
}

.item-info h3 {
  margin: 0;
  color: #2c3e50;
}

.item-price {
  color: #7f8c8d;
  margin: 0.5rem 0 0 0;
}

.item-quantity {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.qty-btn {
  width: 30px;
  height: 30px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  border-radius: 4px;
  font-size: 1.2rem;
}

.qty-btn:hover:not(:disabled) {
  background: #f5f5f5;
}

.qty-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

input[type="number"] {
  width: 60px;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: center;
}

.item-total {
  font-weight: bold;
  color: #27ae60;
  text-align: right;
}

.remove-btn {
  width: 30px;
  height: 30px;
  border: none;
  background: #e74c3c;
  color: white;
  cursor: pointer;
  border-radius: 4px;
  font-size: 1.5rem;
  line-height: 1;
}

.remove-btn:hover {
  background: #c0392b;
}

.cart-summary {
  background: white;
  border-radius: 8px;
  padding: 2rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  color: #7f8c8d;
}

.summary-row.total {
  font-size: 1.3rem;
  font-weight: bold;
  color: #2c3e50;
  padding-top: 1rem;
  border-top: 2px solid #eee;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  text-decoration: none;
  display: inline-block;
  text-align: center;
  transition: background-color 0.3s;
}

.btn-block {
  width: 100%;
  margin-top: 1rem;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-primary:hover {
  background-color: #2980b9;
}

.btn-secondary {
  background-color: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background-color: #7f8c8d;
}

/* Responsive */
@media (max-width: 768px) {
  .cart-item {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .item-quantity {
    justify-content: center;
  }

  .item-total {
    text-align: center;
  }
}
</style>
