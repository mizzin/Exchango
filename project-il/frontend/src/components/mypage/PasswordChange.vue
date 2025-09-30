<template>
  <div class="mypage-section">

    <form @submit.prevent="changePassword">
      <div class="form-group">
        <label>{{ $t('mypage.currentPassword') }}</label>
        <input
          type="password"
          v-model="currentPassword"
          :placeholder="$t('mypage.currentPassword')"
        />
      </div>

      <div class="form-group">
        <label>{{ $t('mypage.newPassword') }}</label>
        <input
          type="password"
          v-model="newPassword"
          :placeholder="$t('mypage.newPassword')"
        />
      </div>

      <div class="form-group">
        <label>{{ $t('mypage.confirmNewPassword') }}</label>
        <input
          type="password"
          v-model="confirmNewPassword"
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
const currentPassword = ref('')
const newPassword = ref('')
const confirmNewPassword = ref('')
const loading = ref(false)

const token = localStorage.getItem('token')

const changePassword = async () => {
  if (newPassword.value !== confirmNewPassword.value) {
    alert(t('mypage.passwordMismatch'))
    return
  }
  loading.value = true
  try {
    await axios.patch(
      '/users/password',
      {
        currentPassword: currentPassword.value,
        newPassword: newPassword.value
      },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    alert(t('mypage.passwordChanged'))
    currentPassword.value = ''
    newPassword.value = ''
    confirmNewPassword.value = ''
  } catch (err) {
    alert(err.response?.data?.message || t('mypage.passwordChangeFailed'))
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
