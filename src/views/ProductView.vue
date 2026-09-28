<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonIcon } from '@ionic/vue'
import { arrowBackOutline, heart, heartOutline } from 'ionicons/icons'
import { useCatalogStore } from '../stores/catalog'
import { useCartStore } from '../stores/cart'
import { useFavoritesStore } from '../stores/favorites'
import { useAppStore } from '../stores/app'
import { money } from '../utils'
const route = useRoute()
const router = useRouter()
const catalog = useCatalogStore()
const cart = useCartStore()
const favorites = useFavoritesStore()
const app = useAppStore()
const product = computed(() => catalog.get(String(route.params.id)))
const variantId = ref<string | undefined>()
const selections = ref<Record<string, string>>({})
watch(
  product,
  (value) => {
    variantId.value = value?.variants?.[0]?.id
    selections.value = Object.fromEntries(
      value?.modifiers?.map((group) => [group.id, group.options[0]?.id || '']) || [],
    )
  },
  { immediate: true },
)
const modifiers = computed(() => Object.values(selections.value))
const price = computed(
  () =>
    (product.value?.price || 0) +
    (product.value?.variants?.find((item) => item.id === variantId.value)?.priceDelta || 0) +
    (product.value?.modifiers
      ?.flatMap((group) => group.options)
      .filter((option) => modifiers.value.includes(option.id))
      .reduce((sum, option) => sum + option.priceDelta, 0) || 0),
)
function addProduct() {
  if (!product.value) return
  cart.add(product.value, variantId.value, modifiers.value)
  app.showToast(`${product.value.name} · добавлено`)
  router.back()
}
</script>
<template>
  <div v-if="product" class="screen detail-screen">
    <div class="detail-image">
      <img :src="product.image" :alt="product.name" /><button
        class="round-back"
        aria-label="Назад"
        @click="router.back()"
      >
        <ion-icon :icon="arrowBackOutline" /></button
      ><button class="round-favorite" aria-label="Избранное" @click="favorites.toggle(product.id)">
        <ion-icon :icon="favorites.has(product.id) ? heart : heartOutline" />
      </button>
    </div>
    <div class="detail-body">
      <span class="eyebrow">{{
        catalog.categories.find((item) => item.id === product?.categoryId)?.name.toUpperCase()
      }}</span>
      <h1>{{ product.name }}</h1>
      <p class="detail-description">{{ product.description }}</p>
      <div class="detail-meta">
        <span>Вес / объём</span><strong>{{ product.weight }}</strong>
      </div>
      <div class="detail-meta">
        <span>Состав</span><strong>{{ product.composition }}</strong>
      </div>
      <div v-if="product.variants?.length" class="option-group">
        <h3>Размер</h3>
        <div class="option-row">
          <button
            v-for="variant in product.variants"
            :key="variant.id"
            :class="{ selected: (variantId || product.variants?.[0]?.id) === variant.id }"
            @click="variantId = variant.id"
          >
            {{ variant.name
            }}<small v-if="variant.priceDelta">+{{ money(variant.priceDelta) }}</small>
          </button>
        </div>
      </div>
      <div v-for="modifier in product.modifiers" :key="modifier.id" class="option-group">
        <h3>{{ modifier.name }}</h3>
        <div class="option-row">
          <button
            v-for="option in modifier.options"
            :key="option.id"
            :class="{
              selected: (selections[modifier.id] || modifier.options[0]?.id) === option.id,
            }"
            @click="selections[modifier.id] = option.id"
          >
            {{ option.name }}<small v-if="option.priceDelta">+{{ money(option.priceDelta) }}</small>
          </button>
        </div>
      </div>
    </div>
    <div class="sticky-action">
      <div>
        <small>Итого</small><strong>{{ money(price) }}</strong>
      </div>
      <button class="primary-button" @click="addProduct">Добавить в корзину <span>＋</span></button>
    </div>
  </div>
  <div v-else class="screen">
    <button class="text-back" @click="router.back()">← Назад</button>
    <div class="empty-state">
      <h2>Товар не найден</h2>
      <router-link to="/menu" class="primary-button">Открыть меню</router-link>
    </div>
  </div>
</template>
