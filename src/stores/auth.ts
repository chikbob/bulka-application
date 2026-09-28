import { defineStore } from 'pinia'
import { ref } from 'vue'
import { initialUser } from '../data/mock'
import { authService } from '../services/auth'
import type { User } from '../types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User>({ ...initialUser })
  async function load() {
    user.value = await authService.current()
  }
  async function save(value: User) {
    user.value = await authService.update(value)
  }
  async function signOut() {
    user.value = await authService.signOut()
  }
  return { user, load, save, signOut }
})
