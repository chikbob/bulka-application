/* global Response, console */
import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { createPinia, setActivePinia } from 'pinia'

function deferred() {
  let resolve
  const promise = new Promise((r) => {
    resolve = r
  })
  return { promise, resolve }
}

test('logout ignores stale session responses and prevents polling during logout', async () => {
  const values = new Map()
  const previousStorage = globalThis.localStorage
  const previousFetch = globalThis.fetch
  globalThis.localStorage = {
    getItem: (k) => values.get(k) ?? null,
    setItem: (k, v) => values.set(k, v),
    removeItem: (k) => values.delete(k),
  }
  const profile = {
    id: 'account-a',
    email: 'test@example.invalid',
    name: 'Проверка',
    phone: '',
    birthday: '',
    notifications: false,
  }
  let requests = 0,
    holdSession = null,
    holdLogout = null
  globalThis.fetch = async (path) => {
    if (path === '/api/auth/session') {
      requests += 1
      if (holdSession) await holdSession.promise
      return Response.json({ user: profile })
    }
    if (path === '/api/auth/logout') {
      if (holdLogout) await holdLogout.promise
      return Response.json({ ok: true })
    }
    return Response.json({ orders: [], transactions: [], ids: [] })
  }
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { useAuthStore } = await vite.ssrLoadModule('/src/stores/auth.ts')
    setActivePinia(createPinia())
    const auth = useAuthStore()
    await auth.load()
    assert.equal(auth.authenticated, true)
    holdSession = deferred()
    const stale = auth.load()
    assert.equal(requests, 2)
    holdLogout = deferred()
    const logout = auth.signOut()
    await auth.load()
    assert.equal(requests, 2, 'no session read may start while logout is pending')
    holdLogout.resolve()
    await logout
    assert.equal(auth.authenticated, false)
    assert.equal(auth.user.id, undefined)
    holdSession.resolve()
    await stale
    assert.equal(auth.authenticated, false, 'late response must not restore the old profile')
    assert.equal(JSON.parse(values.get('bulka.session-profile.v2')).id, undefined)
    console.log('Logout stays signed out after delayed session requests')
  } finally {
    await vite.close()
    globalThis.fetch = previousFetch
    if (previousStorage === undefined) delete globalThis.localStorage
    else globalThis.localStorage = previousStorage
  }
})
