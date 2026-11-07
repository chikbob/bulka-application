/* global self, caches, Response, URL */
// One-time recovery for app versions that had a waiting worker but no update UI.
const migrationCache = 'bulka-app-migrations'
const migrationKey = '/pwa-migration/accounts-v1'
const safePages = new Set(['/', '/menu', '/profile', '/favorites', '/orders', '/loyalty'])
function isSafe(client) {
  const url = new URL(client.url)
  const path = url.hash.startsWith('#/') ? url.hash.slice(1).split('?')[0] : url.pathname
  return url.origin === self.location.origin && safePages.has(path)
}
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const markers = await caches.open(migrationCache)
      if (await markers.match(migrationKey)) return
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      // Do not interrupt checkout, account forms, or other unfinished work in any tab.
      if (windows.length && windows.every(isSafe)) await self.skipWaiting()
    })().catch(() => {}),
  )
})
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const markers = await caches.open(migrationCache)
      if (await markers.match(migrationKey)) return
      await markers.put(migrationKey, new Response('complete'))
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      windows.filter(isSafe).forEach((client) => {
        void client.navigate(client.url).catch(() => {})
      })
    })().catch(() => {}),
  )
})
