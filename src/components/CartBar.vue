<script setup lang="ts">
import { computed } from 'vue'
import { IonIcon } from '@ionic/vue'
import { arrowForwardOutline, bagHandleOutline } from 'ionicons/icons'
import { useCartStore } from '../stores/cart'
import { money } from '../utils'
const cart = useCartStore()
const countLabel = computed(() => {
  const count = cart.count
  const lastTwo = count % 100
  if (lastTwo >= 11 && lastTwo <= 14) return 'товаров'
  if (count % 10 === 1) return 'товар'
  if (count % 10 >= 2 && count % 10 <= 4) return 'товара'
  return 'товаров'
})
</script>
<template>
  <router-link v-if="cart.count" to="/cart" class="cart-bar" aria-label="Открыть корзину">
    <span class="cart-bar-icon">
      <ion-icon :icon="bagHandleOutline" />
      <span class="cart-bar-count">{{ cart.count }}</span>
    </span>
    <span class="cart-bar-copy">
      <strong>Корзина</strong>
      <small>{{ cart.count }} {{ countLabel }}</small>
    </span>
    <span class="cart-bar-total">{{ money(cart.total) }}</span>
    <span class="cart-bar-arrow"><ion-icon :icon="arrowForwardOutline" /></span>
  </router-link>
</template>
