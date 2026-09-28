export const money = (value: number) => `${new Intl.NumberFormat('ru-RU').format(value)} ₽`
export const formatDate = (value: string) =>
  new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(new Date(value))
export const greeting = () => {
  const hour = new Date().getHours()
  return hour < 11 ? 'Доброе утро' : hour < 17 ? 'Добрый день' : 'Добрый вечер'
}
export const productImage = (name: string) => `/images/${name}.webp`
export const demoId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`
export function storageGet<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}
export function storageSet(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}
