<template>
  <div class="mypage-section">

    <form @submit.prevent="changeMoneyPassword">
      <div class="form-group">
        <label>{{ $t('mypage.currentMoneyPassword') }}</label>
        <input
          type="password"
          v-model="currentMoneyPassword"
          :placeholder="$t('mypage.currentMoneyPassword')"
        />
      </div>

      <div class="form-group">
        <label>{{ $t('mypage.newMoneyPassword') }}</label>
        <input
          type="password"
          v-model="newMoneyPassword"
          :placeholder="$t('mypage.newMoneyPassword')"
        />
      </div>

      <div class="form-group">
        <label>{{ $t('mypage.confirmNewPassword') }}</label>
        <input
          type="password"
          v-model="confirmMoneyPassword"
          :placeholder="$t('mypage.confirmNewPassword')"
        />
      </div>

      <button type="submit" :disabled="loading">
        {{ loading ? $t('common.saving') : $t('mypage.common.save') }}
      </button>
    </form>

    <!-- 안내 문구 -->
    <div class="notice-box">
      ⚠️ {{ $t('mypage.moneyPasswordHelp') }}
    </div>
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
const loading = ref(false)

const changeMoneyPassword = async () => {
  if (newMoneyPassword.value !== confirmMoneyPassword.value) {
    alert(t('error.password_mismatch'))
    return
  }
  loading.value = true
  try {
    await axios.patch(
      '/users/money-password',
      {
        currentPassword: currentMoneyPassword.value,
        newPassword: newMoneyPassword.value,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )

    alert(t('mypage.moneyPasswordUpdated'))
    currentMoneyPassword.value = ''
    newMoneyPassword.value = ''
    confirmMoneyPassword.value = ''
  } catch (err) {
    const code = err.response?.data?.code || 'unknown'
    alert(t(`error.${code}`))
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>


.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
}

.form-group label {
  font-size: 0.9rem;
  margin-bottom: 6px;
  color: #555;
}

.mypage-section input {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
}

.mypage-section button {
  width: 100%;
  background-color: #007bff;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 6px;
  font-weight: bold;
  font-size: 0.95rem;
  transition: background-color 0.2s ease;
  margin-top: 0.5rem;
  cursor: pointer;
}

.mypage-section button:hover:not(:disabled) {
  background-color: #0056c7;
}

.mypage-section button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.notice-box {
  margin-top: 1.2rem;
  padding: 0.75rem 1rem;
  background: #fff5f5;
  color: #c53030;
  border-radius: 8px;
  font-size: 0.9rem;
}
</style>
