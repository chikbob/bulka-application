import { createRouter, createWebHashHistory, createWebHistory } from '@ionic/vue-router'
import HomeView from '../views/HomeView.vue'

export default createRouter({
  history:
    import.meta.env.VITE_ROUTER_MODE === 'hash'
      ? createWebHashHistory(import.meta.env.BASE_URL)
      : createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: HomeView },
    { path: '/menu', component: () => import('../views/MenuView.vue') },
    { path: '/orders', component: () => import('../views/OrdersView.vue') },
    { path: '/profile', component: () => import('../views/ProfileView.vue') },
    { path: '/product/:id', component: () => import('../views/ProductView.vue') },
    { path: '/cart', component: () => import('../views/CartView.vue') },
    { path: '/checkout', component: () => import('../views/CheckoutView.vue') },
    { path: '/order/:id', component: () => import('../views/OrderView.vue') },
    { path: '/favorites', component: () => import('../views/FavoritesView.vue') },
    { path: '/loyalty', component: () => import('../views/LoyaltyView.vue') },
  ],
  scrollBehavior: () => ({ top: 0 }),
})
