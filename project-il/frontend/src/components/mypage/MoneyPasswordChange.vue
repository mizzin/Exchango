<template>
  <div class="mypage-section">
    <h3>💰{{ $t('mypage.changeMoneyPassword') }}</h3>
     <form @submit.prevent="submit">
    <input v-model="currentMoneyPassword" :placeholder="$t('mypage.currentMoneyPassword')" />
    <input v-model="newMoneyPassword" :placeholder="$t('mypage.newMoneyPassword')" />
    <input v-model="confirmMoneyPassword" :placeholder="$t('mypage.confirmNewPassword')" />
    <button @click="changeMoneyPassword" >{{ $t('mypage.common.save') }}</button>
  </form>
  <p class="notice-text">{{ $t('mypage.moneyPasswordHelp') }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from '@/axiosUser'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const currentMoneyPassword = ref('')
const newMoneyPassword = ref('')
const confirmMoneyPassword = ref('')
const token = localStorage.getItem('token')

const changeMoneyPassword = async () => {
  if (newMoneyPassword.value !== confirmMoneyPassword.value) {
    alert(t('error.password_mismatch'))
    return
  }

  try {
    await axios.patch('/users/money-password', {
      currentPassword: currentMoneyPassword.value,
      newPassword: newMoneyPassword.value
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })

    alert(t('mypage.moneyPasswordUpdated'))
    currentMoneyPassword.value = ''
    newMoneyPassword.value = ''
    confirmMoneyPassword.value = ''
  } catch (err) {
    const code = err.response?.data?.code || 'unknown'
    alert(t(`error.${code}`))
  }
}
</script>

<style scoped>
.mypage-section {
  max-width: 460px;
  margin: 0 auto;
  padding: 10px 20px;
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
