<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { IonIcon } from '@ionic/vue'
import {
  chevronForwardOutline,
  heartOutline,
  receiptOutline,
  giftOutline,
  logOutOutline,
} from 'ionicons/icons'
import LoyaltyCard from '../components/LoyaltyCard.vue'
import { useAuthStore } from '../stores/auth'
import { useAppStore } from '../stores/app'
const auth = useAuthStore(),
  app = useAppStore()
const editing = ref(false),
  busy = ref(false),
  error = ref('')
const form = reactive({
  name: auth.user.name,
  phone: auth.user.phone,
  birthday: auth.user.birthday,
})
watch(
  () => auth.user,
  (user) => {
    if (!editing.value)
      Object.assign(form, { name: user.name, phone: user.phone, birthday: user.birthday })
  },
  { deep: true },
)
async function save() {
  busy.value = true
  error.value = ''
  try {
    await auth.save({ ...auth.user, ...form })
    editing.value = false
    app.showToast('Профиль сохранён')
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    busy.value = false
  }
}
async function signOut() {
  busy.value = true
  error.value = ''
  try {
    await auth.signOut()
    editing.value = false
    app.showToast('Вы вышли из аккаунта')
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <div class="screen profile-screen">
    <header class="screen-header">
      <span class="eyebrow">ТВОЁ МЕСТО</span>
      <h1>Моя Булка<span class="red-dot">.</span></h1>
      <p>Всё любимое — в одном месте</p>
    </header>
    <section v-if="!auth.authenticated" class="account-invite">
      <span class="account-illustration" aria-hidden="true">🥐</span>
      <h2>Загляни в свой аккаунт</h2>
      <p>
        Войди или зарегистрируйся, чтобы сохранять заказы, копить булочки и находить любимое на
        любом устройстве.
      </p>
      <router-link to="/auth?next=/profile" class="primary-button">Войти в аккаунт →</router-link>
      <router-link to="/auth?mode=register&next=/profile" class="secondary-button"
        >Зарегистрироваться</router-link
      >
    </section>
    <template v-else>
      <div class="profile-identity">
        <div class="avatar">{{ auth.user.name.charAt(0).toUpperCase() }}</div>
        <div>
          <h2>{{ auth.user.name }}</h2>
          <p>{{ auth.user.email }}</p>
        </div>
        <button @click="editing = !editing">{{ editing ? 'Закрыть' : 'Изменить' }}</button>
      </div>
      <form v-if="editing" class="profile-edit" @submit.prevent="save">
        <label class="field-label"
          >Имя<input v-model="form.name" autocomplete="name" required minlength="2" maxlength="80"
        /></label>
        <label class="field-label"
          >Телефон<input
            v-model="form.phone"
            type="tel"
            autocomplete="tel"
            maxlength="30"
            placeholder="+7 999 123-45-67"
        /></label>
        <label class="field-label">День рождения<input v-model="form.birthday" type="date" /></label
        ><button type="submit" class="primary-button" :disabled="busy">
          {{ busy ? 'Сохраняем…' : 'Сохранить' }}
        </button>
      </form>
      <LoyaltyCard />
    </template>
    <p v-if="auth.syncError" class="field-hint" role="status">{{ auth.syncError }}</p>
    <p v-if="error" class="form-error" role="alert">{{ error }}</p>
    <div class="profile-links">
      <router-link to="/favorites"
        ><ion-icon :icon="heartOutline" /><span
          >Любимые товары<small>{{
            auth.authenticated ? 'Сохранены в аккаунте' : 'Сохранены на этом устройстве'
          }}</small></span
        ><ion-icon :icon="chevronForwardOutline"
      /></router-link>
      <router-link to="/orders"
        ><ion-icon :icon="receiptOutline" /><span
          >История заказов<small>{{
            auth.authenticated ? 'Твои заказы на всех устройствах' : 'Заказы с этого устройства'
          }}</small></span
        ><ion-icon :icon="chevronForwardOutline"
      /></router-link>
      <router-link to="/loyalty"
        ><ion-icon :icon="giftOutline" /><span
          >Программа лояльности<small>Как копить и тратить булочки</small></span
        ><ion-icon :icon="chevronForwardOutline"
      /></router-link>
      <button v-if="auth.authenticated" :disabled="busy" @click="signOut">
        <ion-icon :icon="logOutOutline" /><span
          >Выйти из аккаунта<small>Данные останутся в твоём аккаунте</small></span
        ><ion-icon :icon="chevronForwardOutline" />
      </button>
    </div>
    <p class="profile-footnote">Булка · сделано с любовью в Мариуполе</p>
  </div>
</template>
