import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { loyaltyService } from '../services/loyalty'
import type { LoyaltyTransaction } from '../types'

export const useLoyaltyStore = defineStore('loyalty', () => {
  const transactions = ref<LoyaltyTransaction[]>([])
  const balance = computed(() => transactions.value.reduce((sum, item) => sum + item.amount, 0))
  async function load() {
    transactions.value = await loyaltyService.list()
  }
  async function add(item: LoyaltyTransaction) {
    transactions.value = [item, ...transactions.value]
    await loyaltyService.save(transactions.value)
  }
  return { transactions, balance, load, add }
})
