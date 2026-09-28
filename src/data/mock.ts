import type { Category, LoyaltyTransaction, Order, Promotion, Store, User } from '../types'
import productsJson from './products.json'
import type { Product } from '../types'

export const products = productsJson as Product[]
export const categories: Category[] = [
  { id: 'popular', name: 'Популярное', emoji: '✦' },
  { id: 'breakfast', name: 'Завтраки', emoji: '☀' },
  { id: 'croissants', name: 'Круассаны', emoji: '🥐' },
  { id: 'sweet', name: 'Сладкое', emoji: '♡' },
  { id: 'pizza', name: 'Пицца', emoji: '🍕' },
  { id: 'hot', name: 'Горячее', emoji: '♨' },
  { id: 'coffee', name: 'Кофе', emoji: '☕' },
  { id: 'drinks', name: 'Напитки', emoji: '◉' },
]
export const stores: Store[] = [
  {
    id: 'lenina',
    name: 'Булка · проспект Ленина',
    address: 'Мариуполь, проспект Ленина, 95В',
    preparationMinutes: 14,
    hours: 'Ежедневно · 10:00–20:00',
  },
]
export const promotions: Promotion[] = [
  {
    id: 'morning',
    eyebrow: 'ДОБРОЕ УТРО',
    title: 'Утро вкуснее с Булкой',
    description: 'Круассан и кофе — маленький повод улыбнуться',
    image: '/images/pistachio-croissant.webp',
    background: '#eee6d9',
  },
  {
    id: 'sweet',
    eyebrow: 'СЛАДКИЙ МОМЕНТ',
    title: 'Выбери десерт к кофе',
    description: 'Моти, круассаны и любимые сладости',
    image: '/images/992267.webp',
    background: '#f1e9e9',
  },
]
export const initialUser: User = {
  name: 'Гость Булки',
  phone: '',
  birthday: '',
  notifications: true,
}
export const initialLoyalty: LoyaltyTransaction[] = [
  { id: 'welcome', title: 'Приветственные булочки', date: '2026-09-20', amount: 430 },
]
export const initialOrders: Order[] = []
export const LOYALTY_NAME = 'булочек'
