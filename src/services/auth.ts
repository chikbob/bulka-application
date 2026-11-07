import type { User } from '../types'
import { api } from './api'
export const authService = {
  current: () => api<{ user: User | null }>('auth/session'),
  login: (email: string, password: string) =>
    api<{ user: User }>('auth/login', 'POST', { email, password }),
  register: (data: { name: string; email: string; password: string; favorites: string[] }) =>
    api<{ user: User }>('auth/register', 'POST', data),
  update: (user: User) => api<{ user: User }>('auth/profile', 'PATCH', user),
  signOut: () => api<{ ok: boolean }>('auth/logout', 'POST', {}),
}
