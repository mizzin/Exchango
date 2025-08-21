<template>
  <div class="mypage-section">
    <h3>🔒{{ $t('mypage.changePassword') }}</h3>
    <form @submit.prevent="submit">
    <input type="password" v-model="currentPassword" :placeholder="$t('mypage.currentPassword')" />
    <input type="password" v-model="newPassword" :placeholder="$t('mypage.newPassword')" />
    <input type="password" v-model="confirmNewPassword" :placeholder="$t('mypage.confirmNewPassword')" />
    <button @click="changePassword">{{ $t('mypage.common.save') }}</button>
    </form>
    <!-- 안내 문구 -->
  <p class="notice-text">{{ $t('mypage.moneyPasswordHelp') }}</p>
  </div>
  
</template>
<script setup>
import { ref } from 'vue'
import axios from '@/axiosUser'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const currentPassword = ref('')
const newPassword = ref('')
const confirmNewPassword = ref('')

const token = localStorage.getItem('token') // 예시로 추가 (token 필요 시)

const changePassword = async () => {
  if (newPassword.value !== confirmNewPassword.value) {
    alert(t('mypage.passwordMismatch'))
    return
  }

  try {
    await axios.patch('/users/password', {
      currentPassword: currentPassword.value,
      newPassword: newPassword.value
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    alert(t('mypage.passwordChanged'))
    currentPassword.value = ''
    newPassword.value = ''
    confirmNewPassword.value = ''
  } catch (err) {
    alert(err.response?.data?.message || t('mypage.passwordChangeFailed'))
  }
}
</script>


<style scoped>
.mypage-section {
  max-width: 460px;
  margin: 0 auto;
  padding: 10px 20px;
  background-color: #fff;
  border-radius: 12px;
}

.mypage-section h3 {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.mypage-section form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mypage-section input {
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 14px;
  width: 100%;
}

.mypage-section button {
  background-color: #007BFF;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 6px;
  font-weight: bold;
  font-size: 14px;
  transition: background-color 0.2s ease;
  margin-top: 10px;
  cursor: pointer;
}

.mypage-section button:hover {
  background-color: #0056c7;
}
.notice-text{
  font-size: 14px;
  color: crimson;
}
button.disabled {
  background-color: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
