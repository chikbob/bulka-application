<script setup lang="ts">
import { ref } from 'vue'
import { IonIcon } from '@ionic/vue'
import { locationOutline, chevronDownOutline } from 'ionicons/icons'
import { useAppStore } from '../stores/app'
const app = useAppStore()
const open = ref(false)
function choose(id: string) {
  app.selectStore(id)
  open.value = false
}
</script>
<template>
  <div class="store-selector">
    <button class="store-current" @click="open = !open">
      <ion-icon :icon="locationOutline" /><span
        ><small>Заберу из</small
        ><strong>{{ app.selectedStore()?.name || 'Выбрать точку' }}</strong></span
      ><ion-icon :icon="chevronDownOutline" />
    </button>
    <div v-if="open" class="store-options">
      <button v-for="store in app.stores" :key="store.id" @click="choose(store.id)">
        <strong>{{ store.name }}</strong
        ><small>{{ store.address }}</small>
      </button>
    </div>
  </div>
</template>
