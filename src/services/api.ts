export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}
export async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20000)
  try {
    const response = await fetch(`/api/${path}`, {
      method,
      credentials: 'same-origin',
      cache: 'no-store',
      signal: controller.signal,
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const value = await response.json()
    if (!response.ok)
      throw new ApiError(response.status, value.error || 'Не удалось выполнить запрос')
    return value as T
  } catch (e) {
    if (e instanceof ApiError) throw e
    throw new ApiError(0, 'Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.')
  } finally {
    clearTimeout(timeout)
  }
}
