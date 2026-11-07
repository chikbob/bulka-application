/* global URL, Response */
import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { readFile } from 'node:fs/promises'
const source = await readFile(new URL('../public/sw-migrate.js', import.meta.url), 'utf8')
function worker(paths, migrated = false) {
  const events = {},
    markers = new Map(),
    navigations = []
  let skips = 0
  if (migrated) markers.set('/pwa-migration/accounts-v1', true)
  const windows = paths.map((path) => ({
    url: 'https://bulka.example' + path,
    navigate: (url) => {
      navigations.push(url)
      return Promise.resolve()
    },
  }))
  vm.runInNewContext(source, {
    URL,
    Response,
    self: {
      location: { origin: 'https://bulka.example' },
      addEventListener: (name, fn) => {
        events[name] = fn
      },
      skipWaiting: async () => {
        skips++
      },
      clients: { matchAll: async () => windows },
    },
    caches: {
      open: async (name) => {
        assert.equal(name, 'bulka-app-migrations')
        return {
          match: async (key) => markers.get(key),
          put: async (key, value) => {
            markers.set(key, value)
          },
        }
      },
    },
  })
  return {
    navigations,
    get skips() {
      return skips
    },
    dispatch: async (name) => {
      let pending
      events[name]({
        waitUntil: (promise) => {
          pending = promise
        },
      })
      await pending
    },
  }
}
test('legacy profile and hash routes can activate the migration with multiple tabs open', async () => {
  const sw = worker(['/profile', '/#/menu'])
  await sw.dispatch('install')
  assert.equal(sw.skips, 1)
  await sw.dispatch('activate')
  assert.equal(sw.navigations.length, 2)
  await sw.dispatch('activate')
  assert.equal(sw.navigations.length, 2, 'migration cannot reload in a loop')
})
test('an open checkout or account form prevents automatic activation', async () => {
  for (const path of ['/checkout', '/auth', '/cart', '/#/checkout']) {
    const sw = worker(['/profile', path])
    await sw.dispatch('install')
    assert.equal(sw.skips, 0)
  }
})
test('subsequent deployments use the update prompt rather than automatic navigation', async () => {
  const sw = worker(['/profile'], true)
  await sw.dispatch('install')
  await sw.dispatch('activate')
  assert.equal(sw.skips, 0)
  assert.deepEqual(sw.navigations, [])
})
