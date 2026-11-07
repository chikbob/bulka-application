import type { CartItem, Order } from '../types'
import { api } from './api'
export interface CheckoutRequest {
  id: string
  name: string
  phone: string
  storeId: string
  pickupTime: string
  paymentMethod: 'card' | 'cash'
  useBonuses: boolean
  guestToken: string
  items: CartItem[]
}
export const ordersService = {
  guest: (guestToken: string) => api<{ orders: Order[] }>('orders/guest', 'POST', { guestToken }),
  list: () => api<{ orders: Order[] }>('orders'),
  create: (body: CheckoutRequest) => api<{ order: Order }>('orders', 'POST', body),
}
