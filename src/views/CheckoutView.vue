<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IonIcon } from '@ionic/vue'
import { arrowBackOutline, checkmarkOutline } from 'ionicons/icons'
import StoreSelector from '../components/StoreSelector.vue'
import { useCartStore } from '../stores/cart'
import { useCatalogStore } from '../stores/catalog'
import { useAppStore } from '../stores/app'
import { useAuthStore } from '../stores/auth'
import { useOrdersStore } from '../stores/orders'
import { useLoyaltyStore } from '../stores/loyalty'
import type { Order, OrderItem } from '../types'
import { money } from '../utils'
const router = useRouter()
const cart = useCartStore()
const catalog = useCatalogStore()
const app = useAppStore()
const auth = useAuthStore()
const orders = useOrdersStore()
const loyalty = useLoyaltyStore()
const name = ref(auth.user.name === 'Гость Булки' ? '' : auth.user.name)
const phone = ref(auth.user.phone)
const pickup = ref('asap')
const payment = ref<'card' | 'cash'>('card')
const useBonuses = ref(false)
const submitting = ref(false)
const error = ref('')
const pickupOptions = computed(() => {
  const now = new Date()
  return [15, 30, 45, 60].map((minutes) => {
    const date = new Date(now.getTime() + minutes * 60000)
    return {
      value: date.toISOString(),
      label: new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(date),
    }
  })
})
const bonusSpend = computed(() =>
  useBonuses.value ? Math.min(loyalty.balance, Math.floor(cart.total * 0.3)) : 0,
)
const due = computed(() => cart.total - bonusSpend.value)
async function submit() {
  if (!cart.items.length) {
    router.replace('/cart')
    return
  }
  if (!name.value.trim()) {
    error.value = 'Укажи имя, чтобы мы узнали тебя при выдаче'
    return
  }
  if (phone.value.replace(/\D/g, '').length < 10) {
    error.value = 'Укажи номер телефона для связи'
    return
  }
  error.value = ''
  submitting.value = true
  try {
    await auth.save({ ...auth.user, name: name.value.trim(), phone: phone.value.trim() })
    const items: OrderItem[] = cart.items.map((item) => ({
      ...item,
      name: catalog.get(item.productId)?.name || 'Товар',
      image: catalog.get(item.productId)?.image || '',
    }))
    const number = Math.max(123, ...orders.orders.map((item) => item.number)) + 1
    const order: Order = {
      id: crypto.randomUUID(),
      number,
      items,
      total: due.value,
      earnedBonuses: Math.floor(due.value * 0.05),
      spentBonuses: bonusSpend.value,
      storeId: app.selectedStoreId,
      pickupTime:
        pickup.value === 'asap'
          ? new Date(
              Date.now() + (app.selectedStore()?.preparationMinutes || 14) * 60000,
            ).toISOString()
          : pickup.value,
      paymentMethod: payment.value,
      status: 'preparing',
      createdAt: new Date().toISOString(),
    }
    await orders.create(order)
    if (bonusSpend.value)
      await loyalty.add({
        id: `${order.id}-spent`,
        title: `Заказ №${number} · списание`,
        date: order.createdAt,
        amount: -bonusSpend.value,
      })
    await loyalty.add({
      id: `${order.id}-earned`,
      title: `Заказ №${number} · начисление`,
      date: order.createdAt,
      amount: order.earnedBonuses,
    })
    cart.clear()
    router.replace(`/order/${order.id}`)
  } finally {
    submitting.value = false
  }
}
</script>
<template>
  <div class="screen checkout-screen">
    <header class="sub-header">
      <button aria-label="Назад" @click="router.back()">
        <ion-icon :icon="arrowBackOutline" />
      </button>
      <h1>Оформление</h1>
      <span>Самовывоз</span>
    </header>
    <div class="checkout-intro">
      <span class="eyebrow">ПОЧТИ ГОТОВО</span>
      <h2>Заберёшь<br />свою Булку?</h2>
      <p>Пара деталей — и мы начнём готовить</p>
    </div>
    <section class="form-section">
      <div class="step-heading">
        <span>01</span>
        <h3>Где забрать</h3>
      </div>
      <StoreSelector />
    </section>
    <section class="form-section">
      <div class="step-heading">
        <span>02</span>
        <h3>Когда забрать</h3>
      </div>
      <div class="choice-row">
        <button :class="{ selected: pickup === 'asap' }" @click="pickup = 'asap'">
          <ion-icon v-if="pickup === 'asap'" :icon="checkmarkOutline" /> Как можно скорее</button
        ><select v-model="pickup" aria-label="Время получения">
          <option value="asap">Выбрать время</option>
          <option v-for="option in pickupOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>
      <p class="field-hint">
        Примерно через {{ app.selectedStore()?.preparationMinutes || 14 }} минут
      </p>
    </section>
    <section class="form-section">
      <div class="step-heading">
        <span>03</span>
        <h3>Как с тобой связаться</h3>
      </div>
      <label class="field-label"
        >Имя<input v-model="name" autocomplete="name" placeholder="Как тебя зовут?" /></label
      ><label class="field-label"
        >Телефон<input v-model="phone" type="tel" autocomplete="tel" placeholder="+7 999 123-45-67"
      /></label>
    </section>
    <section class="form-section">
      <div class="step-heading">
        <span>04</span>
        <h3>Оплата</h3>
      </div>
      <div class="choice-row">
        <button :class="{ selected: payment === 'card' }" @click="payment = 'card'">
          Картой при получении</button
        ><button :class="{ selected: payment === 'cash' }" @click="payment = 'cash'">
          Наличными
        </button>
      </div>
      <p class="field-hint">Оплата в прототипе не проводится</p>
    </section>
    <section class="form-section">
      <div class="step-heading">
        <span>05</span>
        <h3>Булочки</h3>
      </div>
      <label class="bonus-switch"
        ><span
          ><strong>Списать булочки</strong
          ><small>Доступно {{ loyalty.balance }} · можно списать до 30%</small></span
        ><input v-model="useBonuses" type="checkbox" :disabled="!loyalty.balance" /><span
          class="switch-track"
      /></label>
    </section>
    <div class="cart-summary">
      <div>
        <span>Товары</span><strong>{{ money(cart.total) }}</strong>
      </div>
      <div v-if="bonusSpend">
        <span>Списываем булочки</span><strong>−{{ money(bonusSpend) }}</strong>
      </div>
      <div class="cart-total">
        <span>К оплате при получении</span><strong>{{ money(due) }}</strong>
      </div>
    </div>
    <p v-if="error" class="form-error" role="alert">{{ error }}</p>
    <div class="sticky-action">
      <div>
        <small>Итого</small><strong>{{ money(due) }}</strong>
      </div>
      <button class="primary-button" :disabled="submitting || !cart.count" @click="submit">
        {{ submitting ? 'Оформляем…' : 'Подтвердить заказ →' }}
      </button>
    </div>
  </div>
</template>
