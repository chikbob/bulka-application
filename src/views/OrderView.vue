<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonIcon } from '@ionic/vue'
import { arrowBackOutline, timeOutline } from 'ionicons/icons'
import StatusTimeline from '../components/StatusTimeline.vue'
import { useOrdersStore } from '../stores/orders'
import { useAppStore } from '../stores/app'
import { useCartStore } from '../stores/cart'
import { useCatalogStore } from '../stores/catalog'
import { money } from '../utils'
const route = useRoute()
const router = useRouter()
const orders = useOrdersStore()
const app = useAppStore()
const cart = useCartStore()
const catalog = useCatalogStore()
const order = computed(() => orders.get(String(route.params.id)))
const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  timer = setInterval(() => {
    now.value = Date.now()
  }, 30000)
})
onUnmounted(() => clearInterval(timer))
const minutes = computed(() =>
  order.value
    ? Math.max(0, Math.ceil((new Date(order.value.pickupTime).getTime() - now.value) / 60000))
    : 0,
)
const displayStatus = computed(() =>
  order.value?.status === 'preparing' && minutes.value === 0
    ? 'ready'
    : order.value?.status || 'accepted',
)
async function receive() {
  if (order.value) await orders.update({ ...order.value, status: 'received' })
}
function repeat() {
  if (!order.value) return
  for (const item of order.value.items) {
    const product = catalog.get(item.productId)
    if (product)
      for (let i = 0; i < item.quantity; i++) cart.add(product, item.variantId, item.modifierIds)
  }
  app.showToast('Заказ добавлен в корзину')
  router.push('/cart')
}
</script>
<template>
  <div v-if="order" class="screen order-screen">
    <header class="sub-header">
      <button aria-label="Назад" @click="router.push('/orders')">
        <ion-icon :icon="arrowBackOutline" />
      </button>
      <h1>Заказ №{{ order.number }}</h1>
      <span>Самовывоз</span>
    </header>
    <div class="order-success">
      <div class="success-mark">✳</div>
      <span class="eyebrow">СПАСИБО ЗА ЗАКАЗ</span>
      <h2>
        {{
          displayStatus === 'ready'
            ? 'Твоя Булка готова'
            : displayStatus === 'received'
              ? 'Приятного аппетита!'
              : 'Готовим твой заказ'
        }}
      </h2>
      <p>Совсем скоро будет вкусно</p>
    </div>
    <div class="ready-card">
      <ion-icon :icon="timeOutline" />
      <div>
        <strong>{{
          displayStatus === 'ready'
            ? 'Заказ готов — можно забирать'
            : displayStatus === 'received'
              ? 'Спасибо, что заглянул!'
              : `Будет готов примерно через ${minutes} минут`
        }}</strong
        ><span>{{ app.stores.find((item) => item.id === order?.storeId)?.address }}</span>
      </div>
    </div>
    <section class="section">
      <div class="section-heading">
        <div>
          <span class="eyebrow">ТВОЙ ЗАКАЗ</span>
          <h2>Как продвигается</h2>
        </div>
      </div>
      <StatusTimeline :status="displayStatus" />
    </section>
    <section class="section">
      <div class="section-heading">
        <div>
          <span class="eyebrow">ЧТО ВНУТРИ</span>
          <h2>Твой выбор</h2>
        </div>
      </div>
      <div v-for="item in order.items" :key="item.key" class="order-line">
        <img :src="item.image" :alt="item.name" />
        <div>
          <strong>{{ item.name }}</strong
          ><small>{{ item.quantity }} шт.</small>
        </div>
        <b>{{ money(item.unitPrice * item.quantity) }}</b>
      </div>
      <div class="order-line total-line">
        <strong>Итого</strong><strong>{{ money(order.total) }}</strong>
      </div>
      <p class="earned-note">+{{ order.earnedBonuses }} булочек уже на твоём счёте ✳</p>
    </section>
    <button v-if="displayStatus === 'ready'" class="primary-button receive-button" @click="receive">
      Я забрал заказ ✓</button
    ><button class="secondary-button" @click="repeat">Повторить заказ →</button
    ><router-link to="/" class="text-link">На главную</router-link>
  </div>
  <div v-else class="screen">
    <div class="empty-state">
      <h2>Заказ не найден</h2>
      <router-link to="/orders" class="primary-button">Мои заказы</router-link>
    </div>
  </div>
</template>
