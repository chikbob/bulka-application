import type { LoyaltyTransaction } from '../types'
import { api } from './api'
export const loyaltyService = {
  list: () => api<{ transactions: LoyaltyTransaction[] }>('loyalty'),
}
