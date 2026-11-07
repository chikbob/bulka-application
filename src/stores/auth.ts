import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { initialUser } from '../data/mock'
import { authService } from '../services/auth'
import type { User } from '../types'
import { storageGet, storageSet } from '../utils'
import { useOrdersStore } from './orders'
import { useLoyaltyStore } from './loyalty'
import { useFavoritesStore } from './favorites'
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User>(storageGet('bulka.session-profile.v2', { ...initialUser }))
  const authenticated = computed(() => !!user.value.id)
  const ready = ref(false)
  const syncError = ref('')
  let generation = 0
  async function switchUser(value: User | null) {
    const changed = user.value.id !== value?.id
    user.value = value || { ...initialUser }
    storageSet('bulka.session-profile.v2', user.value)
    if (changed) {
      useOrdersStore().reset()
      useLoyaltyStore().reset()
      useFavoritesStore().reset()
    }
    await refresh()
  }
  async function refresh() {
    const owner = user.value.id
    const results = await Promise.allSettled([
      useOrdersStore().load(),
      useLoyaltyStore().load(),
      useFavoritesStore().load(),
    ])
    if (owner === user.value.id)
      syncError.value = results.some((r) => r.status === 'rejected')
        ? 'Не удалось обновить данные. Проверьте подключение к интернету.'
        : ''
  }
  async function load() {
    const attempt = generation
    if (!ready.value) {
      useOrdersStore().reset()
      useLoyaltyStore().reset()
      useFavoritesStore().reset()
    }
    try {
      const result = await authService.current()
      if (attempt === generation) await switchUser(result.user)
    } catch {
      if (attempt === generation) {
        await refresh()
        syncError.value = 'Нет связи с сервером. Доступны сохранённые данные.'
      }
    } finally {
      ready.value = true
    }
  }
  async function login(email: string, password: string) {
    generation += 1
    const result = await authService.login(email, password)
    await switchUser(result.user)
  }
  async function register(name: string, email: string, password: string) {
    generation += 1
    const favorites = storageGet<string[]>('bulka.favorites.v1', [])
    const result = await authService.register({ name, email, password, favorites })
    await switchUser(result.user)
  }
  async function save(value: User) {
    const result = await authService.update(value)
    user.value = result.user
    storageSet('bulka.session-profile.v2', user.value)
  }
  async function signOut() {
    generation += 1
    await authService.signOut()
    await switchUser(null)
  }
  return { user, authenticated, ready, syncError, load, login, register, save, signOut, refresh }
})
