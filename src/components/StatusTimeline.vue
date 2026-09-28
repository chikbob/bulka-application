<script setup lang="ts">
import type { OrderStatus } from '../types'
const props = defineProps<{ status: OrderStatus }>()
const statuses: { key: OrderStatus; label: string; caption: string }[] = [
  { key: 'accepted', label: 'Принят', caption: 'Заказ у нас' },
  { key: 'preparing', label: 'Готовим', caption: 'Уже на кухне' },
  { key: 'ready', label: 'Готов', caption: 'Можно забирать' },
  { key: 'received', label: 'Получен', caption: 'Приятного аппетита' },
]
const activeIndex = () => statuses.findIndex((item) => item.key === props.status)
</script>
<template>
  <div class="status-timeline">
    <div
      v-for="(item, index) in statuses"
      :key="item.key"
      class="status-step"
      :class="{ done: index <= activeIndex(), current: index === activeIndex() }"
    >
      <span class="status-dot">{{ index < activeIndex() ? '✓' : '' }}</span>
      <div>
        <strong>{{ item.label }}</strong
        ><small>{{ item.caption }}</small>
      </div>
    </div>
  </div>
</template>
