<template><UserLayout>
   <div class="mypage-container">
    <h2>{{ $t('mypage.title') }}</h2>

    <!-- 사용자 정보 -->
    <div class="section">
      <h3>{{ $t('mypage.myInfo') }}</h3>
      <ul v-if="user">
        <li><strong>{{ $t('mypage.username') }}:</strong> {{ user.username }}</li>
        <li><strong>{{ $t('mypage.realName') }}:</strong> {{ user.real_name || '-' }}</li>
        <li><strong>{{ $t('mypage.referral') }}:</strong> {{ user.referral_id || '-' }}</li>
        <li><strong>{{ $t('mypage.warningCount') }}:</strong> {{ user.warning_count }}</li>
        <li><strong>{{ $t('mypage.language') }}:</strong> {{ user.language || 'ko' }}</li>
        <li><strong>{{ $t('mypage.bankName') }}:</strong> {{ user.bank_name || '-' }}</li>
        <li><strong>{{ $t('mypage.bankAccount') }}:</strong> {{ user.bank_account || '-' }}</li>
      </ul>
    </div>

    <!-- 플랫폼 정보 섹션 -->
    <div class="section" v-if="user?.platforms?.length">
      <h3>🎮 {{ $t('mypage.linkedPlatforms') }}</h3>
      <table class="platform-table">
        <thead>
          <tr>
            <th>{{ $t('mypage.platformName') }}</th>
            <th>{{ $t('mypage.platformId') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(p, idx) in user.platforms" :key="idx">
            <td>{{ p.platform_name }}</td>
            <td>{{ p.platform_user_id }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  </UserLayout></template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from '@/axiosUser'
import '@/assets/style.css'
import UserLayout from '@/components/UserLayout.vue'  

const user = ref(null)
const currentPassword = ref('')
const newPassword = ref('')
const confirmNewPassword = ref('')

const token = localStorage.getItem('user_token')
const fetchUserInfo = async () => {
  try {
    const lang = localStorage.getItem('lang') || 'ko'
    const res = await axios.get(`/users/info?lang=${lang}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    console.log('🧩 사용자 정보:', res.data)
    user.value = res.data
  } catch (err) {
    alert('Unable to retrieve user information.')
  }
}


const changePassword = async () => {
  if (newPassword.value !== confirmNewPassword.value) {
    alert('New password does not match.')
    return
  }

  try {
    await axios.patch('/users/password', {
      currentPassword: currentPassword.value,
      newPassword: newPassword.value
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    alert('Your password has been changed.')
    currentPassword.value = ''
    newPassword.value = ''
    confirmNewPassword.value = ''
  } catch (err) {
    alert(err.response?.data?.message || 'Password change failed.')
  }
}

onMounted(fetchUserInfo)
</script>

<style scoped>
.mypage-container {
  max-width: 600px;
  margin: 40px auto;
  padding: 20px;
  background: #f8f9ff;
  border-radius: 12px;
}

.section {
  margin-top: 30px;
}

ul {
  list-style: none;
  padding: 0;
}
li {
  margin-bottom: 10px;
}
.platform-table {
  width: 100%;
  margin-top: 10px;
  border-collapse: collapse;
  background-color: #fff;
  border: 1px solid #ddd;
}
.platform-table th,
.platform-table td {
  padding: 10px;
  border: 1px solid #eee;
  text-align: left;
}
.platform-table th {
  background-color: #f0f4ff;
  color: #5a75f0;
}

</style>
