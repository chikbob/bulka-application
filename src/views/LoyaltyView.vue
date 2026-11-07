<script setup lang="ts">
import { useRouter } from 'vue-router'
import { IonIcon } from '@ionic/vue'
import { arrowBackOutline } from 'ionicons/icons'
import { useLoyaltyStore } from '../stores/loyalty'
import { formatDate } from '../utils'
import { useAuthStore } from '../stores/auth'
const auth = useAuthStore()
const router = useRouter()
const loyalty = useLoyaltyStore()
</script>
<template>
  <div class="screen loyalty-screen">
    <header class="sub-header">
      <button aria-label="Назад" @click="router.back()">
        <ion-icon :icon="arrowBackOutline" />
      </button>
      <h1>Булочки</h1>
      <span>Бонусы</span>
    </header>
    <section v-if="!auth.authenticated" class="account-invite">
      <h2>Булочки ждут знакомства</h2>
      <p>Войди или зарегистрируйся, чтобы копить бонусы и использовать их при заказе.</p>
      <router-link to="/auth?next=/loyalty" class="primary-button"
        >Войти или зарегистрироваться →</router-link
      >
    </section>
    <div v-else class="loyalty-hero">
      <span class="eyebrow">ТВОЙ БАЛАНС</span>
      <div class="balance-number">{{ loyalty.balance }}<span>✳</span></div>
      <h2>булочек</h2>
      <p>Копи с каждым заказом и оплачивай любимое</p>
    </div>
    <section class="section">
      <div class="section-heading">
        <div>
          <span class="eyebrow">ВСЁ ПРОСТО</span>
          <h2>Как это работает</h2>
        </div>
      </div>
      <div class="info-card">
        <span>01</span>
        <div>
          <strong>Заказывай любимое</strong>
          <p>Начисляем 5% после получения заказа и подтверждения оплаты в кафе.</p>
        </div>
      </div>
      <div class="info-card">
        <span>02</span>
        <div>
          <strong>Трать на вкусное</strong>
          <p>При оформлении можно списать до 30% суммы заказа.</p>
        </div>
      </div>
    </section>
    <section v-if="auth.authenticated" class="section">
      <p v-if="!loyalty.transactions.length" class="field-hint">
        Здесь появятся начисления и списания булочек.
      </p>
      <div class="section-heading">
        <div>
          <span class="eyebrow">ИСТОРИЯ</span>
          <h2>Движение булочек</h2>
        </div>
      </div>
      <div v-for="item in loyalty.transactions" :key="item.id" class="transaction">
        <div>
          <strong>{{ item.title }}</strong
          ><small>{{ formatDate(item.date) }}</small>
        </div>
        <b :class="{ positive: item.amount > 0 }"
          >{{ item.amount > 0 ? '+' : '' }}{{ item.amount }}</b
        >
      </div>
    </section>
  </div>
</template>
