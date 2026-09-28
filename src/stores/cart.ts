import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { CartItem, Product } from '../types'
import { storageGet, storageSet } from '../utils'

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>(storageGet<CartItem[]>('bulka.cart.v1', []))
  watch(items, (value) => storageSet('bulka.cart.v1', value), { deep: true })
  const count = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))
  const total = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
  )
  const estimatedBonuses = computed(() => Math.floor(total.value * 0.05))
  function add(product: Product, variantId?: string, modifierIds: string[] = []) {
    const key = [product.id, variantId || '', ...modifierIds].join(':')
    const variant = product.variants?.find((item) => item.id === variantId)
    const modifierPrice =
      product.modifiers
        ?.flatMap((group) => group.options)
        .filter((option) => modifierIds.includes(option.id))
        .reduce((sum, option) => sum + option.priceDelta, 0) || 0
    const current = items.value.find((item) => item.key === key)
    if (current) current.quantity += 1
    else
      items.value.push({
        key,
        productId: product.id,
        quantity: 1,
        variantId,
        modifierIds,
        unitPrice: product.price + (variant?.priceDelta || 0) + modifierPrice,
      })
  }
  function change(key: string, delta: number) {
    const item = items.value.find((entry) => entry.key === key)
    if (!item) return
    item.quantity += delta
    if (item.quantity <= 0) remove(key)
  }
  function remove(key: string) {
    items.value = items.value.filter((item) => item.key !== key)
  }
  function clear() {
    items.value = []
  }
  return { items, count, total, estimatedBonuses, add, change, remove, clear }
})
