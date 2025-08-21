<template>
  <UserLayout>
    <div class="mypage-container">
      <h2>{{ $t('charge.title') }}</h2>

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
      <div class="tab-content">
        <ChargeUsd v-if="activeTab === 'usd'" />
        <ChargeKrw v-if="activeTab === 'krw'" />
      </div>
    </div>
  </UserLayout>
</template>

<script setup>
import { ref } from 'vue'
import UserLayout from '@/components/UserLayout.vue'
import ChargeUsd from '@/components/transaction/tabs/ChargeUsd.vue'
import ChargeKrw from '@/components/transaction/tabs/ChargeKrw.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const tabs = ['usd', 'krw'] 
const activeTab = ref('usd')

const tabLabels = {
  usd: t('charge.usdPlatform'),
  krw: t('charge.krwPlatform')
}

</script>

<style scoped>
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
