export interface Category {
  id: string
  name: string
  emoji: string
}
export interface ProductVariant {
  id: string
  name: string
  priceDelta: number
}
export interface Modifier {
  id: string
  name: string
  options: ProductVariant[]
}
export interface Product {
  id: string
  categoryId: string
  name: string
  description: string
  composition: string
  weight: string
  price: number
  image: string
  popular?: boolean
  fresh?: boolean
  variants?: ProductVariant[]
  modifiers?: Modifier[]
}
export interface CartItem {
  key: string
  productId: string
  quantity: number
  variantId?: string
  modifierIds: string[]
  unitPrice: number
}
export interface OrderItem extends CartItem {
  name: string
  image: string
}
export type OrderStatus = 'accepted' | 'preparing' | 'ready' | 'received'
export interface Order {
  id: string
  number: number
  items: OrderItem[]
  total: number
  earnedBonuses: number
  spentBonuses: number
  storeId: string
  pickupTime: string
  paymentMethod: 'card' | 'cash'
  status: OrderStatus
  createdAt: string
}
export interface User {
  id?: string
  email?: string
  name: string
  phone: string
  birthday: string
  notifications: boolean
}
export interface Store {
  id: string
  name: string
  address: string
  preparationMinutes: number
  hours: string
}
export interface Promotion {
  id: string
  eyebrow: string
  title: string
  description: string
  image: string
  background: string
}
export interface LoyaltyTransaction {
  id: string
  title: string
  date: string
  amount: number
}
