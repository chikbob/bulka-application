<script setup lang="ts">
import EmptyState from '../components/EmptyState.vue'
import OrderCard from '../components/OrderCard.vue'
import { useOrdersStore } from '../stores/orders'
import { useAuthStore } from '../stores/auth'
const auth = useAuthStore()
const orders = useOrdersStore()
</script>
<template>
  <div class="screen orders-screen">
    <header class="screen-header">
      <span class="eyebrow">ПРИЯТНО ПОВТОРИТЬ</span>
      <h1>Мои заказы<span class="red-dot">.</span></h1>
      <p>Вся вкусная история в одном месте</p>
    </header>
    <p v-if="!auth.authenticated" class="guest-note">
      Заказы с этого устройства.
      <router-link to="/auth?next=/orders">Войти, чтобы увидеть заказы аккаунта</router-link>
    </p>
    <p v-if="auth.syncError" class="field-hint" role="status">{{ auth.syncError }}</p>
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
