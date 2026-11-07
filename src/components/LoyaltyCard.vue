<script setup lang="ts">
import { useLoyaltyStore } from '../stores/loyalty'
import { LOYALTY_NAME } from '../data/mock'
import { useAuthStore } from '../stores/auth'
const auth = useAuthStore()
const loyalty = useLoyaltyStore()
</script>
<template>
  <router-link :to="auth.authenticated ? '/loyalty' : '/auth?next=/loyalty'" class="loyalty-card"
    ><div>
      <span class="eyebrow">МОЯ БУЛКА</span>
      <h3>{{ auth.authenticated ? `${loyalty.balance} ${LOYALTY_NAME}` : 'Булочки за заказы' }}</h3>
      <p>
        {{
          auth.authenticated ? 'Копи за заказы, трать на любимое' : 'Войди, чтобы копить и тратить'
        }}
      </p>
    </div>
    <span class="loyalty-spark">✳</span></router-link
  >
</template>
