<script setup lang="ts">
defineProps<{ icon: string; title: string; description: string; action?: string; to?: string }>()
</script>
<template>
  <div class="empty-state">
    <span class="empty-icon">{{ icon }}</span>
    <h2>{{ title }}</h2>
    <p>{{ description }}</p>
    <router-link v-if="action && to" :to="to" class="primary-button">{{ action }}</router-link>
  </div>
</template>
