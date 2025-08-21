<template>
  <UserLayout>
    <div class="mypage-container">
      <h2 class="page-title">{{ $t('mypage.title') }}</h2>

      <!-- 탭 메뉴 -->
      <div class="tab-buttons">
        <button
          v-for="(tab, idx) in tabs"
          :key="idx"
          @click="activeTab = tab"
          :class="['tab-button', { active: activeTab === tab }]"
        >
          {{ $t(`mypage.tabs.${tab}`) }}
        </button>
      </div>

      <!-- 탭별 콘텐츠 -->
      <div class="tab-content">
        <MyInfo v-if="activeTab === 'info'" :user="user" />
        <PasswordChange v-if="activeTab === 'password'" />
        <MoneyPasswordChange v-if="activeTab === 'moneyPassword'" />
        <BankInfo v-if="activeTab === 'bank'" :user="user" @updated="fetchUserInfo" />
      </div>
    </div>
  </UserLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from '@/axiosUser'
import UserLayout from '@/components/UserLayout.vue'
import MyInfo from '@/components/mypage/MyInfo.vue'
import PasswordChange from '@/components/mypage/PasswordChange.vue'
import MoneyPasswordChange from '@/components/mypage/MoneyPasswordChange.vue'
import BankInfo from '@/components/mypage/BankInfo.vue'

const tabs = ['info', 'password', 'moneyPassword', 'bank']
const activeTab = ref('info')
const user = ref(null)

const fetchUserInfo = async () => {
  const token = localStorage.getItem('user_token')
  const lang = localStorage.getItem('lang') || 'ko'
  const res = await axios.get(`/users/info?lang=${lang}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  user.value = res.data
}

onMounted(fetchUserInfo)
</script>

<style scoped>
.mypage-container{
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
}

.tab-button {
  padding: 10px 16px;
  font-weight: 500;
  color: #666;
  border: none;
  background: transparent;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
}

.tab-button:hover {
  color: #000;
}

.tab-button.active {
  color: #3b49df; /* 탭 강조 색상 */
  border-bottom: 2px solid #3b49df;
  font-weight: bold;
  border-radius: 0;
}
.tab-content{
  padding: 1rem;
}
@media screen and (max-width: 768px) {
 .tab-content{
  padding: 0.5rem;
} 
}
</style>
