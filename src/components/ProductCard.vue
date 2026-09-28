<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { add, heart, heartOutline } from 'ionicons/icons'
import type { Product } from '../types'
import { money } from '../utils'
import { useCartStore } from '../stores/cart'
import { useFavoritesStore } from '../stores/favorites'
import { useAppStore } from '../stores/app'

const props = defineProps<{ product: Product; compact?: boolean }>()
const cart = useCartStore()
const favorites = useFavoritesStore()
const app = useAppStore()
function addProduct() {
  cart.add(props.product)
  app.showToast(`${props.product.name} · добавлено в корзину`)
}
</script>
<template>
  <article class="product-card" :class="{ compact }">
    <router-link
      class="product-image-wrap"
      :to="`/product/${product.id}`"
      :aria-label="product.name"
      ><img :src="product.image" :alt="product.name" loading="lazy"
    /></router-link>
    <button
      class="favorite-button"
      :aria-label="favorites.has(product.id) ? 'Убрать из избранного' : 'В избранное'"
      @click="favorites.toggle(product.id)"
    >
      <ion-icon :icon="favorites.has(product.id) ? heart : heartOutline" />
    </button>
    <div class="product-info">
      <router-link :to="`/product/${product.id}`" class="product-title">{{
        product.name
      }}</router-link>
      <p>{{ product.description }}</p>
      <div class="product-footer">
        <div>
          <strong>{{ money(product.price) }}</strong
          ><small>{{ product.weight }}</small>
        </div>
        <button class="add-button" :aria-label="`Добавить ${product.name}`" @click="addProduct">
          <ion-icon :icon="add" />
        </button>
      </div>
    </div>
  </article>
</template>
