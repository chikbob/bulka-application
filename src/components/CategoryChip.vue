<script setup lang="ts">
import type { Category } from '../types'
defineProps<{ category: Category; active?: boolean }>()
defineEmits<{ select: [id: string] }>()
</script>
<template>
  <button class="category-chip" :class="{ active }" @click="$emit('select', category.id)">
    <span class="category-chip__emoji" aria-hidden="true">{{ category.emoji }}</span
    >{{ category.name }}
  </button>
</template>
