<script setup lang="ts">
import type { Order } from '../types'
import { money, formatDate } from '../utils'
import { useCartStore } from '../stores/cart'
import { useCatalogStore } from '../stores/catalog'
import { useAppStore } from '../stores/app'
const props = defineProps<{ order: Order }>()
const cart = useCartStore()
const catalog = useCatalogStore()
const app = useAppStore()
function repeat() {
  for (const item of props.order.items) {
    const product = catalog.get(item.productId)
    if (product)
      for (let i = 0; i < item.quantity; i++) cart.add(product, item.variantId, item.modifierIds)
  }
  app.showToast('Заказ добавлен в корзину')
}
</script>
<template>
  <article class="order-card">
    <div class="order-card-head">
      <div>
        <small>{{ formatDate(order.createdAt) }}</small>
        <h3>Заказ №{{ order.number }}</h3>
      </div>
      <span class="order-badge">{{ order.status === 'received' ? 'Получен' : 'Готовим' }}</span>
    </div>
    <div class="order-images">
      <img
        v-for="(item, index) in order.items.slice(0, 3)"
        :key="index"
        :src="item.image"
        :alt="item.name"
      />
    </div>
    <p>{{ order.items.map((item) => item.name).join(' · ') }}</p>
    <div class="order-card-foot">
      <strong>{{ money(order.total) }}</strong
      ><button @click="repeat">Повторить заказ ↗</button>
    </div>
    <router-link :to="`/order/${order.id}`" class="order-details-link"
      >Подробнее о заказе →</router-link
    >
  </article>
</template>
