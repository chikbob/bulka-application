<script setup lang="ts">
import { useRouter } from 'vue-router'
import { IonIcon } from '@ionic/vue'
import { arrowBackOutline } from 'ionicons/icons'
import { useLoyaltyStore } from '../stores/loyalty'
import { formatDate } from '../utils'
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
    <div class="loyalty-hero">
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
          <p>Возвращаем 5% от стоимости заказа булочками.</p>
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
    <section class="section">
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
