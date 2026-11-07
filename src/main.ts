import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { IonicVue } from '@ionic/vue'
import '@ionic/vue/css/core.css'
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'
import '@fontsource-variable/manrope/index.css'
import '@fontsource-variable/unbounded/index.css'
import './styles/main.css'
import App from './App.vue'
import router from './router'
import { registerPwaUpdates } from './pwa'

createApp(App).use(IonicVue).use(createPinia()).use(router).mount('#app')
void registerPwaUpdates()
