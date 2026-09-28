import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ordersService } from '../services/orders'
import type { Order } from '../types'

export const useOrdersStore = defineStore('orders', () => {
  const orders = ref<Order[]>([])
  async function load() {
    orders.value = await ordersService.list()
  }
  async function create(order: Order) {
    await ordersService.save(order)
    orders.value = [order, ...orders.value]
  }
  async function update(order: Order) {
    await ordersService.update(order)
    orders.value = orders.value.map((item) => (item.id === order.id ? order : item))
  }
  const get = (id: string) => orders.value.find((item) => item.id === id)
  return { orders, load, create, update, get }
})
