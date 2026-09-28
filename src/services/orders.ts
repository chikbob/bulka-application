import type { Order } from '../types'
import { storageGet, storageSet } from '../utils'

const key = 'bulka.orders.v1'
export const ordersService = {
  async list(): Promise<Order[]> {
    const orders = storageGet<Order[]>(key, []).map((order) =>
      order.status === 'preparing' && new Date(order.pickupTime).getTime() <= Date.now()
        ? { ...order, status: 'ready' as const }
        : order,
    )
    storageSet(key, orders)
    return orders
  },
  async save(order: Order): Promise<void> {
    storageSet(key, [order, ...storageGet<Order[]>(key, [])])
  },
  async update(order: Order): Promise<void> {
    storageSet(
      key,
      storageGet<Order[]>(key, []).map((item) => (item.id === order.id ? order : item)),
    )
  },
}
