import { defineStore } from 'pinia'
import { ref } from 'vue'
import { productsService } from '../services/products'
import type { Store } from '../types'
import { storageGet, storageSet } from '../utils'

export const useAppStore = defineStore('app', () => {
  const stores = ref<Store[]>([])
  const selectedStoreId = ref(storageGet('bulka.store.v1', 'lenina'))
  const toast = ref('')
  let toastTimer: ReturnType<typeof setTimeout> | undefined
  async function load() {
    stores.value = await productsService.stores()
  }
  function selectStore(id: string) {
    selectedStoreId.value = id
    storageSet('bulka.store.v1', id)
  }
  function showToast(message: string) {
    toast.value = message
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => (toast.value = ''), 2300)
  }
  return {
    stores,
    selectedStoreId,
    selectedStore: () => stores.value.find((item) => item.id === selectedStoreId.value),
    toast,
    load,
    selectStore,
    showToast,
  }
})
