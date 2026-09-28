<script setup lang="ts">
import EmptyState from '../components/EmptyState.vue'
import OrderCard from '../components/OrderCard.vue'
import { useOrdersStore } from '../stores/orders'
const orders = useOrdersStore()
</script>
<template>
  <div class="screen orders-screen">
    <header class="screen-header">
      <span class="eyebrow">ПРИЯТНО ПОВТОРИТЬ</span>
      <h1>Мои заказы<span class="red-dot">.</span></h1>
      <p>Вся вкусная история в одном месте</p>
    </header>
    <EmptyState
      v-if="!orders.orders.length"
      icon="☕"
      title="Здесь пока тихо"
      description="Первый заказ станет началом вкусной традиции"
      action="Выбрать что-нибудь"
      to="/menu"
    />
    <div v-else class="order-list">
      <OrderCard v-for="order in orders.orders" :key="order.id" :order="order" />
    </div>
  </div>
</template>
