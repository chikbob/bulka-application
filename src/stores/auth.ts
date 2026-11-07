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
  const changingSession = ref(false)
  let generation = 0
  let loadSequence = 0
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
    if (changingSession.value) return
    const attempt = generation
    const sequence = ++loadSequence
    if (!ready.value) {
      useOrdersStore().reset()
      useLoyaltyStore().reset()
      useFavoritesStore().reset()
    }
    try {
      const result = await authService.current()
      if (attempt === generation && sequence === loadSequence) await switchUser(result.user)
    } catch {
      if (attempt === generation && sequence === loadSequence) {
        await refresh()
        syncError.value = 'Нет связи с сервером. Доступны сохранённые данные.'
      }
    } finally {
      ready.value = true
    }
  }
  async function changeSession(operation: () => Promise<User | null>) {
    if (changingSession.value) throw new Error('Дождитесь завершения текущего действия')
    changingSession.value = true
    generation += 1
    try {
      const value = await operation()
      generation += 1
      await switchUser(value)
    } finally {
      generation += 1
      changingSession.value = false
    }
  }
  async function login(email: string, password: string) {
    await changeSession(async () => (await authService.login(email, password)).user)
  }
  async function register(name: string, email: string, password: string) {
    const favorites = storageGet<string[]>('bulka.favorites.v1', [])
    await changeSession(
      async () => (await authService.register({ name, email, password, favorites })).user,
    )
  }
  async function save(value: User) {
    const attempt = generation
    const result = await authService.update(value)
    if (attempt !== generation || changingSession.value) return
    user.value = result.user
    storageSet('bulka.session-profile.v2', user.value)
  }
  async function signOut() {
    await changeSession(async () => {
      await authService.signOut()
      return null
    })
  }
  return {
    user,
    authenticated,
    ready,
    changingSession,
    syncError,
    load,
    login,
    register,
    save,
    signOut,
    refresh,
  }
})
