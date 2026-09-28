<script setup lang="ts">
import { computed, nextTick, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { IonApp, IonIcon } from '@ionic/vue'
import { homeOutline, restaurantOutline, receiptOutline, personOutline } from 'ionicons/icons'
import CartBar from './components/CartBar.vue'
import { useAppStore } from './stores/app'
import { useCatalogStore } from './stores/catalog'
import { useAuthStore } from './stores/auth'
import { useOrdersStore } from './stores/orders'
import { useLoyaltyStore } from './stores/loyalty'

const route = useRoute()
const app = useAppStore()
const nav = [
  { path: '/', label: 'Главная', icon: homeOutline },
  { path: '/menu', label: 'Меню', icon: restaurantOutline },
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
onMounted(async () => {
  await Promise.all([
    useCatalogStore().load(),
    app.load(),
    useAuthStore().load(),
    useOrdersStore().load(),
    useLoyaltyStore().load(),
  ])
})
</script>

<template>
  <ion-app>
    <main class="app-shell" :class="{ 'with-nav': showNav }">
      <router-view v-slot="{ Component }"
        ><transition name="page" mode="out-in"><component :is="Component" /></transition
      ></router-view>
      <CartBar v-if="showNav" />
      <nav v-if="showNav" class="bottom-nav" aria-label="Основная навигация">
        <router-link
          v-for="item in nav"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: route.path === item.path }"
        >
          <ion-icon :icon="item.icon" /><span>{{ item.label }}</span>
        </router-link>
      </nav>
      <div v-if="app.toast" class="toast" role="status">{{ app.toast }}</div>
    </main>
  </ion-app>
</template>
