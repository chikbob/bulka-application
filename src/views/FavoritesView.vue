<script setup lang="ts">
import { useRouter } from 'vue-router'
import { IonIcon } from '@ionic/vue'
import { arrowBackOutline } from 'ionicons/icons'
import ProductCard from '../components/ProductCard.vue'
import EmptyState from '../components/EmptyState.vue'
import { useFavoritesStore } from '../stores/favorites'
import { useCatalogStore } from '../stores/catalog'
import { useAuthStore } from '../stores/auth'
const auth = useAuthStore()
const router = useRouter()
const favorites = useFavoritesStore()
const catalog = useCatalogStore()
</script>
<template>
  <div class="screen">
    <header class="sub-header">
      <button aria-label="Назад" @click="router.back()">
        <ion-icon :icon="arrowBackOutline" />
      </button>
      <h1>Моя Булка</h1>
      <span>Любимое</span>
    </header>
    <div class="section-heading">
      <div>
        <span class="eyebrow">ВСЕГДА ПОД РУКОЙ</span>
        <h2>Любимые вкусы</h2>
      </div>
    </div>
    <p class="favorites-note">
      {{
        auth.authenticated
          ? 'Любимое из твоего аккаунта — на всех устройствах.'
          : 'Сохранено на этом устройстве.'
      }}
      <router-link v-if="!auth.authenticated" to="/auth?next=/favorites"
        >Войти или создать аккаунт</router-link
      >
    </p>
    <div v-if="favorites.ids.length" class="catalog-grid">
      <ProductCard
        v-for="product in catalog.products.filter((item) => favorites.has(item.id))"
        :key="product.id"
        :product="product"
      />
    </div>
    <EmptyState
      v-else
      icon="♡"
      title="Здесь будет любимое"
      description="Нажми на сердечко у товара, чтобы сохранить его здесь"
      action="Открыть меню"
      to="/menu"
    />
  </div>
</template>
