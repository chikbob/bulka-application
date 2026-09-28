import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { storageGet, storageSet } from '../utils'

export const useFavoritesStore = defineStore('favorites', () => {
  const ids = ref<string[]>(storageGet<string[]>('bulka.favorites.v1', ['992233', '1006038']))
  watch(ids, (value) => storageSet('bulka.favorites.v1', value), { deep: true })
  const has = (id: string) => ids.value.includes(id)
  function toggle(id: string) {
    ids.value = has(id) ? ids.value.filter((item) => item !== id) : [...ids.value, id]
  }
  return { ids, has, toggle }
})
