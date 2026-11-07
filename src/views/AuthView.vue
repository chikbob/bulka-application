<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonIcon } from '@ionic/vue'
import { arrowBackOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons'
import { useAuthStore } from '../stores/auth'
const route = useRoute(),
  router = useRouter(),
  auth = useAuthStore()
const registering = computed(() => route.query.mode === 'register')
const name = ref(''),
  email = ref(''),
  password = ref(''),
  confirmation = ref('')
const visible = ref(false),
  busy = ref(false),
  error = ref('')
const destination = computed(() =>
  typeof route.query.next === 'string' &&
  /^\/(?!\/)/.test(route.query.next) &&
  !route.query.next.startsWith('/auth')
    ? route.query.next
    : '/profile',
)
function mode(register: boolean) {
  error.value = ''
  password.value = ''
  confirmation.value = ''
  router.replace({
    path: '/auth',
    query: { next: destination.value, ...(register ? { mode: 'register' } : {}) },
  })
}
async function submit() {
  error.value = ''
  if (registering.value && password.value !== confirmation.value) {
    error.value = 'Пароли не совпадают'
    return
  }
  busy.value = true
  try {
    if (registering.value)
      await auth.register(name.value.trim(), email.value.trim(), password.value)
    else await auth.login(email.value.trim(), password.value)
    password.value = ''
    confirmation.value = ''
    await router.replace(destination.value)
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <div class="screen auth-screen">
    <header class="sub-header">
      <button aria-label="Назад" @click="router.push(destination)">
        <ion-icon :icon="arrowBackOutline" /></button
      ><span>Моя Булка</span>
    </header>
    <div class="auth-panel">
      <img src="/images/logo-horizontal.png" alt="Булка" class="auth-logo" />
      <span class="eyebrow">ВСЁ ЛЮБИМОЕ — С ТОБОЙ</span>
      <h1>
        {{ registering ? 'Давай знакомиться' : 'С возвращением' }}<span class="red-dot">.</span>
      </h1>
      <p>Заказы, любимые вкусы и булочки — в твоём аккаунте на любом устройстве.</p>
      <div class="auth-tabs">
        <button :class="{ selected: !registering }" :disabled="busy" @click="mode(false)">
          Вход</button
        ><button :class="{ selected: registering }" :disabled="busy" @click="mode(true)">
          Регистрация
        </button>
      </div>
      <form @submit.prevent="submit">
        <label v-if="registering" class="field-label"
          >Имя<input
            v-model="name"
            name="name"
            autocomplete="name"
            required
            minlength="2"
            maxlength="80"
            placeholder="Как тебя зовут?"
        /></label>
        <label class="field-label"
          >Почта<input
            v-model="email"
            name="email"
            type="email"
            autocomplete="email"
            required
            maxlength="254"
            placeholder="you@example.ru"
            autocapitalize="none"
        /></label>
        <label class="field-label"
          >Пароль<span class="password-field"
            ><input
              v-model="password"
              name="password"
              :type="visible ? 'text' : 'password'"
              :autocomplete="registering ? 'new-password' : 'current-password'"
              required
              :minlength="registering ? 10 : 1"
              maxlength="128"
              :placeholder="registering ? 'Не менее 10 символов' : 'Твой пароль'" /><button
              type="button"
              :aria-label="visible ? 'Скрыть пароль' : 'Показать пароль'"
              @click="visible = !visible"
            >
              <ion-icon :icon="visible ? eyeOffOutline : eyeOutline" /></button></span
        ></label>
        <label v-if="registering" class="field-label"
          >Повтори пароль<input
            v-model="confirmation"
            name="confirmation"
            :type="visible ? 'text' : 'password'"
            autocomplete="new-password"
            required
            minlength="10"
            maxlength="128"
            placeholder="Ещё раз, чтобы без ошибок"
        /></label>
        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
        <button class="primary-button" type="submit" :disabled="busy">
          {{ busy ? 'Секунду…' : registering ? 'Создать аккаунт →' : 'Войти →' }}
        </button>
      </form>
      <router-link :to="destination" class="text-link">{{
        destination === '/checkout' ? 'Продолжить без аккаунта' : 'Вернуться к просмотру'
      }}</router-link>
    </div>
  </div>
</template>
