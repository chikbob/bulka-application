import { ref } from 'vue'
import { registerSW } from 'virtual:pwa-register'

export const updateAvailable = ref(false)
export const applyingUpdate = ref(false)
let updateWorker: ReturnType<typeof registerSW> | undefined
let reloadRequested = false
function reloadApp() {
  if (reloadRequested) return
  reloadRequested = true
  window.location.reload()
}

export async function applyAppUpdate() {
  applyingUpdate.value = true
  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (!registration?.waiting) {
      reloadApp()
      return
    }
    navigator.serviceWorker.addEventListener('controllerchange', reloadApp, { once: true })
    await updateWorker?.(true)
  } catch {
    navigator.serviceWorker.removeEventListener('controllerchange', reloadApp)
    applyingUpdate.value = false
  }
}

export async function registerPwaUpdates() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  // Fresh installs already have this interface; the migration is for older clients only.
  try {
    const existing = await navigator.serviceWorker.getRegistration()
    if (!navigator.serviceWorker.controller && !existing?.active) {
      const markers = await caches.open('bulka-app-migrations')
      await markers.put('/pwa-migration/accounts-v1', new Response('complete'))
    }
  } catch {
    /* Cache storage can be restricted; registration should still proceed. */
  }
  updateWorker = registerSW({
    immediate: true,
    onNeedRefresh: () => {
      updateAvailable.value = true
    },
    onNeedReload: () => {
      updateAvailable.value = true
      if (applyingUpdate.value) reloadApp()
    },
    onRegisteredSW: (_url, registration) => {
      if (!registration) return
      const check = () => {
        if (document.visibilityState === 'visible' && navigator.onLine)
          void registration.update().catch(() => {})
      }
      document.addEventListener('visibilitychange', check)
      window.addEventListener('online', check)
      setInterval(check, 60 * 60 * 1000)
      if (registration.waiting) updateAvailable.value = true
    },
  })
}
