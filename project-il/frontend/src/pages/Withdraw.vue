<template>
  <UserLayout>
    <div class="mypage-container">
      <h2>{{ $t('withdraw.title') }}</h2>

      <div v-if="hasPending" class="pending-banner">
         <i class="icon-warning" />
        {{ $t('alert.pendingMoneyRequest') }}
        <a href="/trade/history">{{ $t('alert.checkStatus') }}</a>
    </div>

      <!-- 탭 버튼 -->
      <div class="tab-buttons">
        <button
          v-for="(tab, idx) in tabs"
          :key="idx"
          
          @click="activeTab = tab"
          
          :class="['tab-button', { active: activeTab === tab }]"
        >
          {{ tabLabels[tab] }}
        </button>
      </div>

      <!-- 탭 콘텐츠 -->
       <div class="tab-content" style="position:relative;">
        <ChargeUsd v-if="activeTab === 'usd'" />
        <ChargeKrw v-if="activeTab === 'krw'" />
        <div v-if="hasPending" class="blur-overlay">
        </div>
      </div>
    </div>
  </UserLayout>
</template> 

<script setup>
import { ref, onMounted } from 'vue'
import UserLayout from '@/components/UserLayout.vue'
import ChargeUsd from '@/components/transaction/tabs/WithdrawUsd.vue'
import ChargeKrw from '@/components/transaction/tabs/WithdrawKrw.vue'
import { useI18n } from 'vue-i18n'
import axios from '@/axiosUser'

const hasPending = ref(false)

const { t } = useI18n()
const tabs = ['usd', 'krw']
const activeTab = ref('usd')

const tabLabels = {
  usd: t('withdraw.usdPlatform'),
  krw: t('withdraw.krwPlatform')
}

const checkPending = async () => {
  try {
const res = await axios.get('/users/me/transactions/pending-check?status=pending');
    const arr = Array.isArray(res.data.transactions) ? res.data.transactions : []
    const pendingTypes = [
  'charge', 'withdraw',
  'wallet_to_platform', 'platform_to_wallet', 'platform_to_platform',
  'platform_charge', 'wallet_charge', 'platform_withdraw', 'wallet_withdraw'
]
hasPending.value = arr.some(tx => tx.status === 'pending' && pendingTypes.includes(tx.type))
  } catch(e) {
    console.log('axios 에러:', e)
    hasPending.value = false
  }
}

onMounted(checkPending)
</script>

<style scoped>
.pending-banner {
  background-color: #fff3cd; /* 연한 노랑 (경고 느낌) */
  color: #856404;            /* 어두운 갈색 텍스트 */
  border: 1px solid #ffeeba;
  padding: 12px 16px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  margin-bottom: 1rem;
}

.pending-banner i {
  color: #856404;
  font-size: 18px;
}

.pending-banner a {
  margin-left: auto;
  color: #0d6efd; /* 파란색 링크 */
  font-weight: 500;
  text-decoration: underline;
}


.blur-overlay {
  position: absolute; top:0; left:0; right:0; bottom:0;
  background: rgba(255,255,255,0.8);
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  font-size: 17px; z-index:10;
  pointer-events: all;
}
.tab-content[aria-disabled="true"] { filter: blur(2px); pointer-events: none; }

.mypage-container {
  background-color: #fff;
  max-width: 420px;
  margin: auto;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.04);
  border-radius: 12px;
}
.tab-buttons {
  display: flex;
  border-bottom: 1px solid #ccc;
   margin-bottom: 20px;
}

.tab-button {
   flex: 1;
   text-align: center;
   padding: 12px 0;
  font-weight: 500;
  color: #666;
  border: none;
  background: transparent;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
  border-radius: 0;
}

.tab-button:hover {
  color: #000;
}

.tab-button.active {
  color: #3b49df;
  border-bottom: 2px solid #3b49df;
  font-weight: bold;
}

.tab-content {
  padding: 1rem;
}
@media screen and (max-width: 768px) {
  .tab-content {
    padding: 0.5rem;
  }
}
</style>
