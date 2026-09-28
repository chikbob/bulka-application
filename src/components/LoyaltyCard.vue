<script setup lang="ts">
import { useLoyaltyStore } from '../stores/loyalty'
import { LOYALTY_NAME } from '../data/mock'
const loyalty = useLoyaltyStore()
</script>
<template>
  <router-link to="/loyalty" class="loyalty-card"
    ><div>
      <span class="eyebrow">МОЯ БУЛКА</span>
      <h3>{{ loyalty.balance }} {{ LOYALTY_NAME }}</h3>
      <p>Копи за заказы, трать на любимое</p>
    </div>
    <span class="loyalty-spark">✳</span></router-link
  >
</template>
