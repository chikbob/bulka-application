<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { IonIcon } from '@ionic/vue'
import {
  chevronForwardOutline,
  heartOutline,
  receiptOutline,
  notificationsOutline,
  helpCircleOutline,
  giftOutline,
  logOutOutline,
} from 'ionicons/icons'
import LoyaltyCard from '../components/LoyaltyCard.vue'
import { useAuthStore } from '../stores/auth'
import { useAppStore } from '../stores/app'
const auth = useAuthStore()
const app = useAppStore()
const editing = ref(false)
const form = reactive({
  name: auth.user.name,
  phone: auth.user.phone,
  birthday: auth.user.birthday,
})
watch(
  () => auth.user,
  (user) => {
    form.name = user.name
    form.phone = user.phone
    form.birthday = user.birthday
  },
  { deep: true },
)
async function save() {
  await auth.save({
    ...auth.user,
    name: form.name.trim() || 'Гость Булки',
    phone: form.phone.trim(),
    birthday: form.birthday,
  })
  editing.value = false
  app.showToast('Профиль сохранён')
}
async function toggleNotifications() {
  await auth.save({ ...auth.user, notifications: !auth.user.notifications })
  app.showToast(auth.user.notifications ? 'Уведомления включены' : 'Уведомления выключены')
}
async function signOut() {
  await auth.signOut()
  app.showToast('Ты вышел из профиля')
}
</script>
<template>
  <div class="screen profile-screen">
    <header class="screen-header">
      <span class="eyebrow">ПРИВЕТ, ЭТО ТЫ</span>
      <h1>Моя Булка<span class="red-dot">.</span></h1>
      <p>Всё любимое — в одном месте</p>
    </header>
    <div class="profile-identity">
      <div class="avatar">{{ auth.user.name.charAt(0).toUpperCase() }}</div>
      <div>
        <h2>{{ auth.user.name }}</h2>
        <p>{{ auth.user.phone || 'Добавь телефон для заказа' }}</p>
      </div>
      <button @click="editing = !editing">{{ editing ? 'Закрыть' : 'Изменить' }}</button>
    </div>
    <div v-if="editing" class="profile-edit">
      <label class="field-label">Имя<input v-model="form.name" placeholder="Твоё имя" /></label
      ><label class="field-label"
        >Телефон<input v-model="form.phone" type="tel" placeholder="+7 999 123-45-67" /></label
      ><label class="field-label">День рождения<input v-model="form.birthday" type="date" /></label
      ><button class="primary-button" @click="save">Сохранить</button>
    </div>
    <LoyaltyCard />
    <div class="profile-links">
      <router-link to="/favorites"
        ><ion-icon :icon="heartOutline" /><span
          >Любимые товары<small>Сохранённое для тебя</small></span
        ><ion-icon :icon="chevronForwardOutline" /></router-link
      ><router-link to="/orders"
        ><ion-icon :icon="receiptOutline" /><span
          >История заказов<small>Всё, что уже пробовал</small></span
        ><ion-icon :icon="chevronForwardOutline" /></router-link
      ><button @click="toggleNotifications">
        <ion-icon :icon="notificationsOutline" /><span
          >Уведомления<small>{{ auth.user.notifications ? 'Включены' : 'Выключены' }}</small></span
        ><span class="setting-state">{{ auth.user.notifications ? 'Вкл' : 'Выкл' }}</span></button
      ><router-link to="/loyalty"
        ><ion-icon :icon="giftOutline" /><span
          >Условия программы<small>Как копить и тратить булочки</small></span
        ><ion-icon :icon="chevronForwardOutline" /></router-link
      ><a href="mailto:mariupol.kupimzavas@mail.ru?subject=Вопрос%20по%20заказу%20Булка"
        ><ion-icon :icon="helpCircleOutline" /><span>Поддержка<small>Вопрос по заказу</small></span
        ><ion-icon :icon="chevronForwardOutline" /></a
      ><button @click="signOut">
        <ion-icon :icon="logOutOutline" /><span>Выйти<small>Очистить данные профиля</small></span
        ><ion-icon :icon="chevronForwardOutline" />
      </button>
    </div>
    <p class="profile-footnote">Булка · сделано с любовью в Мариуполе</p>
  </div>
</template>
