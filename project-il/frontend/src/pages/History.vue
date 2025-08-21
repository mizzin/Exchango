<template>
  <UserLayout>
    <div class="history-page">
   <h2>📄 {{ $t('history.title') }}</h2>
    <div class="tabs">
      <button :class="{ active: activeTab === 'recharge' }" @click="activeTab = 'recharge'">
        {{ $t('history.rechargeTab') }}
      </button>
      <button :class="{ active: activeTab === 'withdraw' }" @click="activeTab = 'withdraw'">
        {{ $t('history.withdrawTab') }}
      </button>
    </div>
      <div class="tab-content">
        <RechargeHistory v-if="activeTab === 'recharge'" />
        <WithdrawHistory v-else />
      </div>
    </div>
  </UserLayout>
</template>

<script setup>
import axios from '@/axiosUser'
import UserLayout from '@/components/UserLayout.vue'
import RechargeHistory from '@/components/history/RechargeHistory.vue'
import WithdrawHistory from '@/components/history/WithdrawHistory.vue'
import { ref } from 'vue'

const activeTab = ref('recharge')
</script>

<style scoped>
.history-page {
  max-width: 1000px;
  margin: auto;
  padding: 0rem 1rem;
}

.tabs {
  display: flex;
  border-bottom: 2px solid #ccc;
  margin-bottom: 1rem;
}

.tabs button {
  padding: 0.6rem 1.2rem;
  margin-right: 1rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  font-size: 1rem;
  cursor: pointer;
  font-weight: 500;
  color: #555;
}

.tabs button.active {
  color: #4a6cf7;
  border-color: #4a6cf7;
      border-radius: 0;
}

.tab-content {
  margin-top: 1.5rem;
}
</style>
