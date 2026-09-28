import { categories, products, promotions, stores } from '../data/mock'
import type { Category, Product, Promotion, Store } from '../types'

export const productsService = {
  async list(): Promise<Product[]> {
    return products
  },
  async get(id: string): Promise<Product | undefined> {
    return products.find((item) => item.id === id)
  },
  async categories(): Promise<Category[]> {
    return categories
  },
  async promotions(): Promise<Promotion[]> {
    return promotions
  },
  async stores(): Promise<Store[]> {
    return stores
  },
}
