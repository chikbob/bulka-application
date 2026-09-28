<script setup lang="ts">
import type { Promotion } from '../types'
defineProps<{ promotion: Promotion }>()
</script>
<template>
  <router-link to="/menu" class="promo-card" :style="{ background: promotion.background }"
    ><div>
      <small>{{ promotion.eyebrow }}</small>
      <h3>{{ promotion.title }}</h3>
      <p>{{ promotion.description }}</p>
      <span>Смотреть меню ↗</span>
    </div>
    <img :src="promotion.image" alt=""
  /></router-link>
</template>
