<script setup lang="ts">
defineProps<{ quantity: number }>()
defineEmits<{ decrease: []; increase: [] }>()
</script>
<template>
  <div class="quantity-selector">
    <button aria-label="Уменьшить количество" @click="$emit('decrease')">−</button
    ><span>{{ quantity }}</span
    ><button aria-label="Увеличить количество" @click="$emit('increase')">+</button>
  </div>
</template>
