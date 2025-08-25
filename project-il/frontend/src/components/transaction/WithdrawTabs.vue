<!-- ChargeForm.vue -->
<template>
  <UserLayout>
    <div class="mypage">
      <h2>충전하기</h2>
      <nav class="tab-menu">
        <button :class="{ active: tab === 'usd' }" @click="tab = 'usd'">USD</button>
        <button :class="{ active: tab === 'krw' }" @click="tab = 'krw'">KRW</button>
      </nav>

      <div class="tab-content">
        <ChargeUsd v-if="tab === 'usd'" />
        <ChargeKrw v-else />
      </div>
    </div>
  </UserLayout>
</template>

<script setup>
import { ref } from 'vue'
import UserLayout from '@/components/UserLayout.vue'
import ChargeUsd from '@/components/transaction/tabs/ChargeUsd.vue'
import ChargeKrw from '@/components/transaction/tabs/ChargeKrw.vue'

const tab = ref('usd')
</script>
