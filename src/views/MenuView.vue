<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { IonIcon } from '@ionic/vue'
import { searchOutline, closeOutline } from 'ionicons/icons'
import ProductCard from '../components/ProductCard.vue'
import CategoryChip from '../components/CategoryChip.vue'
import { useCatalogStore } from '../stores/catalog'
const route = useRoute()
const catalog = useCatalogStore()
const selected = ref(String(route.query.category || 'popular'))
const search = ref('')
function chooseCategory(id: string) {
  selected.value = id
  search.value = ''
}
watch(
  () => route.query.category,
  (value) => {
    if (value) selected.value = String(value)
  },
)
const visible = computed(() =>
  catalog.products.filter(
    (item) =>
      (selected.value === 'popular' ? item.popular : item.categoryId === selected.value) &&
      `${item.name} ${item.description}`
        .toLocaleLowerCase('ru')
        .includes(search.value.toLocaleLowerCase('ru')),
  ),
)
const searchResults = computed(() =>
  catalog.products.filter((item) =>
    `${item.name} ${item.description}`
      .toLocaleLowerCase('ru')
      .includes(search.value.toLocaleLowerCase('ru')),
  ),
)
const displayed = computed(() => (search.value ? searchResults.value : visible.value))
const title = computed(() =>
  search.value
    ? 'Результаты поиска'
    : catalog.categories.find((item) => item.id === selected.value)?.name || 'Популярное',
)
</script>
<template>
  <div class="screen menu-screen">
    <header class="screen-header">
      <span class="eyebrow">ВЫБИРАЙ ПО НАСТРОЕНИЮ</span>
      <h1>Меню<span class="red-dot">.</span></h1>
      <p>Любимые вкусы — в пару касаний</p>
    </header>
    <div class="search-field">
      <ion-icon :icon="searchOutline" /><input
        v-model="search"
        type="search"
        placeholder="Что сегодня хочется?"
        aria-label="Поиск по меню"
      /><button v-if="search" aria-label="Очистить поиск" @click="search = ''">
        <ion-icon :icon="closeOutline" />
      </button>
    </div>
    <div class="horizontal-scroll chip-scroll menu-chips">
      <CategoryChip
        v-for="category in catalog.categories"
        :key="category.id"
        :category="category"
        :active="selected === category.id && !search"
        @select="chooseCategory"
      />
    </div>
    <div class="section-heading menu-heading">
      <div>
        <span class="eyebrow">{{ displayed.length }} ПОЗИЦИЙ</span>
        <h2>{{ title }}</h2>
      </div>
    </div>
    <div v-if="catalog.loading" class="catalog-grid">
      <div v-for="i in 4" :key="i" class="skeleton product-skeleton" />
    </div>
    <div v-else-if="displayed.length" class="catalog-grid">
      <ProductCard v-for="product in displayed" :key="product.id" :product="product" />
    </div>
    <div v-else class="no-results">
      <span>🥐</span>
      <h3>Пока ничего не нашли</h3>
      <p>Попробуй другое название или выбери категорию</p>
    </div>
  </div>
</template>
