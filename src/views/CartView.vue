<script setup lang="ts">
import { useRouter } from 'vue-router'
import { IonIcon } from '@ionic/vue'
import { arrowBackOutline, trashOutline } from 'ionicons/icons'
import EmptyState from '../components/EmptyState.vue'
import QuantitySelector from '../components/QuantitySelector.vue'
import { useCartStore } from '../stores/cart'
import { useCatalogStore } from '../stores/catalog'
import { money } from '../utils'
const router = useRouter()
const cart = useCartStore()
const catalog = useCatalogStore()
</script>
<template>
  <div class="screen cart-screen">
    <header class="sub-header">
      <button aria-label="Назад" @click="router.back()">
        <ion-icon :icon="arrowBackOutline" />
      </button>
      <h1>Корзина</h1>
      <span>{{ cart.count }} шт.</span>
    </header>
    <EmptyState
      v-if="!cart.items.length"
      icon="🥐"
      title="Корзина ждёт вкусного"
      description="Добавь что-нибудь из меню — и забери, когда удобно"
      action="Открыть меню"
      to="/menu"
    /><template v-else
      ><div class="cart-list">
        <article v-for="item in cart.items" :key="item.key" class="cart-item">
          <img :src="catalog.get(item.productId)?.image" :alt="catalog.get(item.productId)?.name" />
          <div class="cart-item-info">
            <h3>{{ catalog.get(item.productId)?.name }}</h3>
            <small>{{ catalog.get(item.productId)?.weight }}</small
            ><strong>{{ money(item.unitPrice * item.quantity) }}</strong>
          </div>
          <div class="cart-item-actions">
            <button
              :aria-label="`Удалить ${catalog.get(item.productId)?.name}`"
              @click="cart.remove(item.key)"
            >
              <ion-icon :icon="trashOutline" /></button
            ><QuantitySelector
              :quantity="item.quantity"
              @decrease="cart.change(item.key, -1)"
              @increase="cart.change(item.key, 1)"
            />
          </div>
        </article>
      </div>
      <router-link to="/menu" class="add-more">＋ Добавить ещё что-нибудь</router-link>
      <div class="cart-summary">
        <div>
          <span>Товары</span><strong>{{ money(cart.total) }}</strong>
        </div>
        <div>
          <span>Начислим булочек</span
          ><strong class="red-text">+{{ cart.estimatedBonuses }}</strong>
        </div>
        <div class="cart-total">
          <span>Итого</span><strong>{{ money(cart.total) }}</strong>
        </div>
      </div>
      <div class="sticky-action">
        <div>
          <small>К оплате</small><strong>{{ money(cart.total) }}</strong>
        </div>
        <router-link to="/checkout" class="primary-button">Оформить заказ →</router-link>
      </div></template
    >
  </div>
</template>
