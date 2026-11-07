import { defineStore } from 'pinia'
import { ref } from 'vue'
import { storageGet, storageSet } from '../utils'
import { api } from '../services/api'
import { useAuthStore } from './auth'
import { useAppStore } from './app'
export const useFavoritesStore = defineStore('favorites', () => {
  const ids = ref<string[]>([])
  const pending = ref<string[]>([])
  let revision = 0
  const key = () =>
    useAuthStore().user.id
      ? `bulka.favorites.account.${useAuthStore().user.id}`
      : 'bulka.favorites.v1'
  function reset() {
    revision += 1
    ids.value = storageGet<string[]>(key(), [])
    pending.value = []
  }
  async function load() {
    const owner = useAuthStore().user.id
    if (!owner) {
      reset()
      return
    }
    if (pending.value.length) return
    const version = revision
    const result = await api<{ ids: string[] }>('favorites')
    if (owner !== useAuthStore().user.id || pending.value.length || version !== revision) return
    ids.value = result.ids
    storageSet(key(), ids.value)
  }
  const has = (id: string) => ids.value.includes(id)
  async function toggle(id: string) {
    if (pending.value.includes(id)) return
    const owner = useAuthStore().user.id
    revision += 1
    const saved = !has(id)
    ids.value = saved ? [...ids.value, id] : ids.value.filter((v) => v !== id)
    storageSet(key(), ids.value)
    if (!owner) return
    pending.value.push(id)
    try {
      await api('favorites', 'POST', { id, saved })
    } catch (e) {
      if (owner === useAuthStore().user.id) {
        ids.value = saved ? ids.value.filter((v) => v !== id) : [...new Set([...ids.value, id])]
        storageSet(key(), ids.value)
        useAppStore().showToast((e as Error).message)
      }
    } finally {
      if (owner === useAuthStore().user.id) pending.value = pending.value.filter((v) => v !== id)
    }
  }
  return { ids, pending, has, toggle, load, reset }
})
