import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ordersService, type CheckoutRequest } from '../services/orders'
import type { Order } from '../types'
import { useAuthStore } from './auth'
import { storageGet, storageSet } from '../utils'
export const useOrdersStore = defineStore('orders', () => {
  const orders = ref<Order[]>([])
  const key = () =>
    useAuthStore().user.id ? `bulka.orders.account.${useAuthStore().user.id}` : 'bulka.orders.v1'
  function reset() {
    orders.value = storageGet<Order[]>(key(), [])
  }
  async function load() {
    const id = useAuthStore().user.id
    if (!id) {
      reset()
      const token = storageGet<string>('bulka.guest-token.v2', '')
      if (!token) return
      const result = await ordersService.guest(token)
      if (useAuthStore().user.id) return
      const remoteIds = new Set(result.orders.map((o) => o.id))
      orders.value = [...result.orders, ...orders.value.filter((o) => !remoteIds.has(o.id))]
      storageSet(key(), orders.value)
      return
    }
    const result = await ordersService.list()
    if (id !== useAuthStore().user.id) return
    orders.value = result.orders
    storageSet(key(), orders.value)
  }
  async function create(input: CheckoutRequest) {
    const owner = useAuthStore().user.id
    const { order } = await ordersService.create(input)
    if (owner !== useAuthStore().user.id)
      throw new Error('Аккаунт изменился. Откройте историю заказов.')
    orders.value = [order, ...orders.value.filter((item) => item.id !== order.id)]
    storageSet(key(), orders.value)
    return order
  }
  const get = (id: string) => orders.value.find((item) => item.id === id)
  return { orders, load, create, reset, get }
})
