<template>
  <UserLayout>
           <!-- 페이지 헤더 -->
    <div class="page-header">
      <h2 class="page-title">👤 {{ $t('mypage.title') }}</h2>
    </div>
    <div class="mypage-container">
   

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
.page-header {
  margin: 0 auto 1rem;
  max-width: 720px;
  padding: 0 1rem;
}

.page-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: #222;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.mypage-container{
  background-color: #fff;
  max-width: 720px;
  margin: auto;
  padding: 2rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08); /* 더 선명한 그림자 */
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
  .mypage-container {
    max-width: 100%;     
    border-radius: 12px;    
    box-shadow: none;    
    padding: 1rem;
  }

  .tab-buttons {
    flex-wrap: wrap;     
    gap: 0.3rem;
  }

  .tab-button {
    font-size: 0.85rem;
    padding: 0.6rem 0.4rem;
    flex: 1;               
    text-align: center;
  }

  .tab-content {
    padding: 0.8rem 0.5rem;
  }
}
</style>
