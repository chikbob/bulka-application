import { initialUser } from '../data/mock'
import type { User } from '../types'
import { storageGet, storageSet } from '../utils'

const key = 'bulka.user.v1'
export const authService = {
  async current(): Promise<User> {
    return storageGet<User>(key, initialUser)
  },
  async update(user: User): Promise<User> {
    storageSet(key, user)
    return user
  },
  async signOut(): Promise<User> {
    storageSet(key, initialUser)
    return initialUser
  },
}
