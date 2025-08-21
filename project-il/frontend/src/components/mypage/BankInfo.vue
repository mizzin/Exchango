<template>
  <div class="mypage-section">
    <h3>🏦 {{ $t('mypage.bankInfo') }}</h3>
    <p class="notice-text">{{ $t('mypage.bankInfoName') }}</p>
    <form @submit.prevent="submit">
    <div v-if="!user.real_name">
      <label>{{ $t('mypage.realName') }}</label>
      <input v-model="form.real_name" :placeholder="$t('mypage.realName')" />
    </div>
    <div v-else>
      <p><strong>{{ $t('mypage.realName') }}:</strong> {{ user.real_name }}</p>
    </div>
    <div>
      <label>{{ $t('mypage.bankName') }}</label>
      <input v-model="form.bank_name" :disabled="!user.real_name && !form.real_name" :placeholder="$t('mypage.bankName')" />
    </div>
    <div>
      <label>{{ $t('mypage.bankAccount') }}</label>
      <input v-model="form.bank_account" :disabled="!user.real_name && !form.real_name" :placeholder="$t('mypage.bankAccount')" />
    </div>
    <button @click="submitBankInfo" :disabled="!isFormValid" :class="{ disabled: !isFormValid }">{{ $t('mypage.common.save') }}</button>   </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n' // 추가
import axios from '@/axiosUser'

const { t } = useI18n() // 추가

const props = defineProps({ user: Object })
const emit = defineEmits(['updated'])

const form = ref({
  real_name: '',
  bank_name: '',
  bank_account: ''
})
const token = localStorage.getItem('user_token')

const isFormValid = computed(() => {
  const hasRealName = props.user.real_name || form.value.real_name
  return hasRealName && form.value.bank_name && form.value.bank_account
})

const submitBankInfo = async () => {
  try {
    await axios.patch(`/users/${props.user.id}/bank-info`, {
      real_name: props.user.real_name || form.value.real_name,
      bank_name: form.value.bank_name,
      bank_account: form.value.bank_account
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    alert(t('mypage.bankInfoSaveSuccess')) // 메시지 키 변경
    emit('updated')
  } catch (err) {
    alert(t('mypage.bankInfoSaveFailed'))
  }
}
</script>


<style scoped>
.mypage-section {
  max-width: 460px;
  margin: 0 auto;
  padding: 10px 10px;
  background-color: #fff;
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
}.notice-text{
  font-size: 14px;
  color: crimson;
}
button.disabled {
  background-color: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
