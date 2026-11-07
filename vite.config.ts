import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      manifest: false,
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['manifest.webmanifest', 'apple-touch-icon.png', 'icons/*.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        importScripts: ['/sw-migrate.js'],
        runtimeCaching: [
          {
            urlPattern: ({ url, request }) =>
              url.origin === self.location.origin && request.destination === 'image',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'bulka-product-images',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],
})
