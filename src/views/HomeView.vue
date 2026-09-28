<script setup lang="ts">
import { computed } from 'vue'
import { IonIcon } from '@ionic/vue'
import { arrowForwardOutline, timeOutline } from 'ionicons/icons'
import { useRouter } from 'vue-router'
import ProductCard from '../components/ProductCard.vue'
import CategoryChip from '../components/CategoryChip.vue'
import PromoCard from '../components/PromoCard.vue'
import LoyaltyCard from '../components/LoyaltyCard.vue'
import StoreSelector from '../components/StoreSelector.vue'
import { useCatalogStore } from '../stores/catalog'
import { useCartStore } from '../stores/cart'
import { useAppStore } from '../stores/app'
import { useOrdersStore } from '../stores/orders'
import { greeting } from '../utils'
const router = useRouter()
const catalog = useCatalogStore()
const cart = useCartStore()
const app = useAppStore()
const orders = useOrdersStore()
const repeat = computed(() => orders.orders[0])
function repeatOrder() {
  if (!repeat.value) return
  for (const item of repeat.value.items) {
    const product = catalog.get(item.productId)
    if (product)
      for (let i = 0; i < item.quantity; i++) cart.add(product, item.variantId, item.modifierIds)
  }
  app.showToast('Любимый заказ в корзине')
  router.push('/cart')
}
</script>
<template>
  <div class="screen home-screen">
    <header class="home-header">
      <div>
        <span class="eyebrow">КАФЕ В МАРИУПОЛЕ</span>
        <h1>{{ greeting() }}<span class="red-dot">.</span></h1>
      </div>
      <img class="header-logo" src="/images/logo-horizontal.png" alt="Булка" />
    </header>
    <StoreSelector />
    <section class="hero-order">
      <div class="hero-copy">
        <span class="eyebrow">ВКУСНОЕ РЯДОМ</span>
        <h2>Твоя Булка<br />уже ждёт</h2>
        <p>Закажи сейчас — забери без ожидания</p>
        <router-link to="/menu" class="hero-button"
          >Заказать заранее <ion-icon :icon="arrowForwardOutline"
        /></router-link>
      </div>
      <img src="/images/pistachio-croissant.webp" alt="Круассан с фисташкой" />
    </section>
    <div class="prep-note">
      <ion-icon :icon="timeOutline" /> Приготовим примерно за
      {{ app.selectedStore()?.preparationMinutes || 14 }} минут
    </div>
    <section class="section">
      <div class="section-heading">
        <div>
          <span class="eyebrow">ТВОЙ РИТУАЛ</span>
          <h2>Как обычно?</h2>
        </div>
      </div>
      <div class="usual-card">
        <div class="usual-images">
          <img :src="repeat?.items[0]?.image || '/images/992233.webp'" alt="" /><img
            :src="repeat?.items[1]?.image || '/images/cappuccino.webp'"
            alt=""
          />
        </div>
        <div>
          <strong>{{
            repeat
              ? repeat.items.map((item) => item.name).join(' + ')
              : 'Круассан «Фисташка» + капучино'
          }}</strong>
          <p>Немного счастья — каждый день</p>
        </div>
        <button @click="repeat ? repeatOrder() : router.push('/menu')">
          {{ repeat ? 'Повторить' : 'В меню' }} →
        </button>
      </div>
    </section>
    <section class="section">
      <div class="section-heading">
        <div>
          <span class="eyebrow">НАЙДИ СВОЁ</span>
          <h2>Меню</h2>
        </div>
        <router-link to="/menu">Всё меню →</router-link>
      </div>
      <div class="horizontal-scroll chip-scroll">
        <CategoryChip
          v-for="category in catalog.categories"
          :key="category.id"
          :category="category"
          @select="router.push({ path: '/menu', query: { category: category.id } })"
        />
      </div>
    </section>
    <section class="section">
      <div class="section-heading">
        <div>
          <span class="eyebrow">ЛЮБЯТ ГОСТИ</span>
          <h2>Популярное</h2>
        </div>
        <router-link to="/menu">Смотреть →</router-link>
      </div>
      <div v-if="catalog.loading" class="product-row">
        <div v-for="i in 3" :key="i" class="skeleton product-skeleton" />
      </div>
      <div v-else class="horizontal-scroll product-row">
        <ProductCard
          v-for="product in catalog.popular.slice(0, 7)"
          :key="product.id"
          :product="product"
          compact
        />
      </div>
    </section>
    <section class="section">
      <div class="section-heading">
        <div>
          <span class="eyebrow">ТОЛЬКО ЧТО ИЗ ПЕЧИ</span>
          <h2>Из печи</h2>
        </div>
      </div>
      <router-link to="/product/992233" class="fresh-feature"
        ><img src="/images/992233.webp" alt="Круассан Фисташка" />
        <div>
          <span class="eyebrow">ХРУСТЯЩИЙ ФАВОРИТ</span>
          <h3>Круассан<br />«Фисташка»</h3>
          <p>С кремом и ягодным конфитюром</p>
          <strong>350 ₽ <span>↗</span></strong>
        </div></router-link
      >
    </section>
    <section class="section">
      <div class="section-heading">
        <div>
          <span class="eyebrow">ЕЩЁ ВКУСНЕЕ</span>
          <h2>Для тебя</h2>
        </div>
      </div>
      <div class="horizontal-scroll promo-row">
        <PromoCard
          v-for="promotion in catalog.promotions"
          :key="promotion.id"
          :promotion="promotion"
        />
      </div>
    </section>
    <section class="section"><LoyaltyCard /></section>
  </div>
</template>
