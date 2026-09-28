import { initialLoyalty } from '../data/mock'
import type { LoyaltyTransaction } from '../types'
import { storageGet, storageSet } from '../utils'

const key = 'bulka.loyalty.v1'
export const loyaltyService = {
  async list(): Promise<LoyaltyTransaction[]> {
    return storageGet<LoyaltyTransaction[]>(key, initialLoyalty)
  },
  async save(items: LoyaltyTransaction[]): Promise<void> {
    storageSet(key, items)
  },
}
