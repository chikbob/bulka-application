<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { IonIcon } from '@ionic/vue'
import { arrowBackOutline, checkmarkOutline } from 'ionicons/icons'
import StoreSelector from '../components/StoreSelector.vue'
import { useCartStore } from '../stores/cart'
import { useAppStore } from '../stores/app'
import { useAuthStore } from '../stores/auth'
import { useOrdersStore } from '../stores/orders'
import { useLoyaltyStore } from '../stores/loyalty'
import { money, storageGet, storageSet } from '../utils'
const router = useRouter(),
  cart = useCartStore(),
  app = useAppStore(),
  auth = useAuthStore(),
  orders = useOrdersStore(),
  loyalty = useLoyaltyStore()
const draft = storageGet<{
  name: string
  phone: string
  id: string
  pickup: string
  payment: 'card' | 'cash'
}>('bulka.checkout.v2', {
  name: '',
  phone: '',
  id: crypto.randomUUID(),
  pickup: 'asap',
  payment: 'card',
})
const name = ref(auth.authenticated ? auth.user.name : draft.name)
const phone = ref(auth.authenticated ? auth.user.phone || draft.phone : draft.phone)
const pickup = ref(draft.pickup),
  payment = ref(draft.payment)
const useBonuses = ref(false),
  guestCheckout = ref(false),
  submitting = ref(false),
  error = ref('')
let guestToken = storageGet<string>('bulka.guest-token.v2', '')
if (!guestToken) {
  guestToken = [...crypto.getRandomValues(new Uint8Array(32))]
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('')
  storageSet('bulka.guest-token.v2', guestToken)
}
watch([name, phone, pickup, payment], () =>
  storageSet('bulka.checkout.v2', {
    id: draft.id,
    name: name.value,
    phone: phone.value,
    pickup: pickup.value,
    payment: payment.value,
  }),
)
watch(
  () => auth.authenticated,
  () => {
    useBonuses.value = false
    if (auth.authenticated) {
      name.value = auth.user.name
      phone.value = auth.user.phone || phone.value
    }
  },
)
const pickupOptions = computed(() =>
  [15, 30, 45, 60].map((minutes) => {
    const date = new Date(Date.now() + minutes * 60000)
    return {
      value: date.toISOString(),
      label: new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(date),
    }
  }),
)
const bonusSpend = computed(() =>
  auth.authenticated && useBonuses.value
    ? Math.min(loyalty.balance, Math.floor(cart.total * 0.3))
    : 0,
)
const due = computed(() => cart.total - bonusSpend.value)
function continueAsGuest() {
  guestCheckout.value = true
  error.value = ''
}
async function submit() {
  if (submitting.value) return
  if (!cart.items.length) {
    router.replace('/cart')
    return
  }
  if (!auth.authenticated && !guestCheckout.value) {
    error.value = 'Войди в аккаунт или выбери «Продолжить без аккаунта»'
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
    const order = await orders.create({
      id: draft.id,
      items: cart.items,
      name: name.value.trim(),
      phone: phone.value.trim(),
      storeId: app.selectedStoreId,
      pickupTime: pickup.value,
      paymentMethod: payment.value,
      useBonuses: auth.authenticated && useBonuses.value,
      guestToken,
    })
    cart.clear()
    localStorage.removeItem('bulka.checkout.v2')
    void auth.refresh()
    router.replace(`/order/${order.id}`)
  } catch (e) {
    error.value = (e as Error).message
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
    <section v-if="!auth.authenticated && !guestCheckout" class="checkout-account account-invite">
      <span class="eyebrow">БОЛЬШЕ ПРИЯТНОГО</span>
      <h3>С булочками ещё вкуснее</h3>
      <p>Войди или создай аккаунт, чтобы копить булочки и списывать их в этом заказе.</p>
      <router-link to="/auth?next=/checkout" class="primary-button"
        >Войти или зарегистрироваться</router-link
      >
      <button class="text-link" @click="continueAsGuest">Продолжить без аккаунта →</button>
    </section>
    <p v-else-if="!auth.authenticated" class="guest-note">
      Оформляешь без аккаунта ·
      <router-link to="/auth?next=/checkout">Войти и воспользоваться булочками</router-link>
    </p>
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
      <p class="field-hint">Оплата при получении заказа</p>
    </section>
    <section class="form-section">
      <div class="step-heading">
        <span>05</span>
        <h3>Булочки</h3>
      </div>
      <label v-if="auth.authenticated" class="bonus-switch"
        ><span
          ><strong>Списать булочки</strong
          ><small>Доступно {{ loyalty.balance }} · можно списать до 30%</small></span
        ><input v-model="useBonuses" type="checkbox" :disabled="!loyalty.balance" /><span
          class="switch-track"
      /></label>
      <p v-if="!auth.authenticated" class="field-hint">
        Булочки доступны после <router-link to="/auth?next=/checkout">входа в аккаунт</router-link>.
        Заказ можно оформить без регистрации.
      </p>
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
