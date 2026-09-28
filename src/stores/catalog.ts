import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { productsService } from '../services/products'
import type { Category, Product, Promotion } from '../types'

export const useCatalogStore = defineStore('catalog', () => {
  const products = ref<Product[]>([])
  const categories = ref<Category[]>([])
  const promotions = ref<Promotion[]>([])
  const loading = ref(true)
  const popular = computed(() => products.value.filter((item) => item.popular))
  const fresh = computed(() => products.value.filter((item) => item.fresh).slice(0, 6))
  async function load() {
    loading.value = true
    try {
      ;[products.value, categories.value, promotions.value] = await Promise.all([
        productsService.list(),
        productsService.categories(),
        productsService.promotions(),
      ])
    } finally {
      loading.value = false
    }
  }
  const get = (id: string) => products.value.find((item) => item.id === id)
  return { products, categories, promotions, loading, popular, fresh, load, get }
})
