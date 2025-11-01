/**
 * SHOPPING CART STORE (Pinia)
 *
 * PURPOSE: Manages shopping cart state
 *
 * STATE:
 * - items: Array of cart items
 * - Each item: { product, quantity }
 *
 * WHY LOCAL STORAGE:
 * - Persists cart across page refreshes
 * - No backend needed for cart storage
 * - Instant updates
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
  // STATE
  const items = ref([])

  // GETTERS

  /**
   * Total number of items in cart
   */
  const itemCount = computed(() => {
    return items.value.reduce((total, item) => total + item.quantity, 0)
  })

  /**
   * Total price of all items
   */
  const totalPrice = computed(() => {
    return items.value.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    )
  })

  /**
   * Check if cart is empty
   */
  const isEmpty = computed(() => items.value.length === 0)

  // ACTIONS

  /**
   * Initialize cart from localStorage
   */
  function init() {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      items.value = JSON.parse(savedCart)
    }
  }

  /**
   * Add product to cart
   * WHY: Increases quantity if product already in cart
   */
  function addItem(product, quantity = 1) {
    const existingItem = items.value.find(
      (item) => item.product._id === product._id
    )

    if (existingItem) {
      // Product already in cart, increase quantity
      existingItem.quantity += quantity
    } else {
      // New product, add to cart
      items.value.push({
        product,
        quantity
      })
    }

    saveCart()
  }

  /**
   * Remove product from cart
   */
  function removeItem(productId) {
    items.value = items.value.filter(
      (item) => item.product._id !== productId
    )
    saveCart()
  }

  /**
   * Update item quantity
   */
  function updateQuantity(productId, quantity) {
    const item = items.value.find(
      (item) => item.product._id === productId
    )

    if (item) {
      if (quantity <= 0) {
        removeItem(productId)
      } else {
        item.quantity = quantity
        saveCart()
      }
    }
  }

  /**
   * Clear entire cart
   * WHY: After successful order placement
   */
  function clearCart() {
    items.value = []
    localStorage.removeItem('cart')
  }

  /**
   * Save cart to localStorage
   * WHY: Persist across page refreshes
   */
  function saveCart() {
    localStorage.setItem('cart', JSON.stringify(items.value))
  }

  // Initialize on store creation
  init()

  return {
    // State
    items,
    // Getters
    itemCount,
    totalPrice,
    isEmpty,
    // Actions
    addItem,
    removeItem,
    updateQuantity,
    clearCart
  }
})
