<script setup lang="ts">
import { useCartStore } from '../stores/cart'
import { money } from '../utils'
const cart = useCartStore()
</script>
<template>
  <router-link v-if="cart.count" to="/cart" class="cart-bar"
    ><span class="cart-bar-count">{{ cart.count }}</span
    ><span>Корзина</span><strong>{{ money(cart.total) }}</strong
    ><span class="cart-arrow">→</span></router-link
  >
</template>
