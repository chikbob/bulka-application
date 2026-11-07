import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { loyaltyService } from '../services/loyalty'
import type { LoyaltyTransaction } from '../types'
import { useAuthStore } from './auth'
import { storageGet, storageSet } from '../utils'
export const useLoyaltyStore = defineStore('loyalty', () => {
  const transactions = ref<LoyaltyTransaction[]>([])
  const balance = computed(() => transactions.value.reduce((sum, item) => sum + item.amount, 0))
  const key = () => `bulka.loyalty.account.${useAuthStore().user.id}`
  function reset() {
    transactions.value = useAuthStore().authenticated ? storageGet(key(), []) : []
  }
  async function load() {
    const id = useAuthStore().user.id
    if (!id) {
      reset()
      return
    }
    const result = await loyaltyService.list()
    if (id !== useAuthStore().user.id) return
    transactions.value = result.transactions
    storageSet(key(), transactions.value)
  }
  return { transactions, balance, load, reset }
})
