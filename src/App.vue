<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { IonApp, IonIcon } from '@ionic/vue'
import {
  homeOutline,
  restaurantOutline,
  heartOutline,
  receiptOutline,
  personOutline,
} from 'ionicons/icons'
import CartBar from './components/CartBar.vue'
import { useAppStore } from './stores/app'
import { useCatalogStore } from './stores/catalog'
import { useAuthStore } from './stores/auth'
import { updateAvailable, applyingUpdate, applyAppUpdate } from './pwa'

const route = useRoute()
const app = useAppStore()
const nav = [
  { path: '/', label: 'Главная', icon: homeOutline },
  { path: '/menu', label: 'Меню', icon: restaurantOutline },
  { path: '/favorites', label: 'Любимое', icon: heartOutline },
  { path: '/orders', label: 'Заказы', icon: receiptOutline },
  { path: '/profile', label: 'Профиль', icon: personOutline },
]
const showNav = computed(() => nav.some((item) => item.path === route.path))
watch(
  () => route.fullPath,
  async () => {
    await nextTick()
    const shell = document.querySelector<HTMLElement>('.app-shell')
    if (shell) shell.scrollTop = 0
  },
)
let syncTimer: ReturnType<typeof setInterval> | undefined
const sync = () => {
  if (document.visibilityState === 'visible') void useAuthStore().load()
}
const syncAcrossTabs = (event: StorageEvent) => {
  if (event.key === 'bulka.session-profile.v2') void useAuthStore().load()
}
onUnmounted(() => {
  clearInterval(syncTimer)
  document.removeEventListener('visibilitychange', sync)
  window.removeEventListener('online', sync)
  window.removeEventListener('storage', syncAcrossTabs)
})
onMounted(async () => {
  syncTimer = setInterval(sync, 30000)
  document.addEventListener('visibilitychange', sync)
  window.addEventListener('online', sync)
  window.addEventListener('storage', syncAcrossTabs)
  await Promise.all([useCatalogStore().load(), app.load(), useAuthStore().load()])
})
</script>

<template>
  <ion-app>
    <main class="app-shell" :class="{ 'with-nav': showNav }">
      <router-view v-slot="{ Component }"
        ><transition name="page" mode="out-in"><component :is="Component" /></transition
      ></router-view>
      <div v-if="showNav" class="mobile-cart"><CartBar /></div>
      <nav v-if="showNav" class="bottom-nav" aria-label="Основная навигация">
        <router-link to="/" class="desktop-brand" aria-label="Булка — главная">
          <img src="/images/logo-horizontal.png" alt="" />
        </router-link>
        <router-link
          v-for="item in nav"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: route.path === item.path }"
        >
          <ion-icon :icon="item.icon" /><span>{{ item.label }}</span>
        </router-link>
        <CartBar class="desktop-cart" />
      </nav>
      <div v-if="app.toast" class="toast" role="status">{{ app.toast }}</div>
      <aside v-if="updateAvailable" class="app-update-notice" role="status">
        <span>Доступна новая версия Булки</span>
        <button :disabled="applyingUpdate" @click="applyAppUpdate">
          {{ applyingUpdate ? 'Обновляем…' : 'Обновить' }}
        </button>
      </aside>
    </main>
  </ion-app>
</template>
