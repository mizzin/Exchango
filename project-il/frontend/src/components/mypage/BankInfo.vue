<template>
  <div class="mypage-section">
    <div class="notice-box">
      ⚠️ {{ $t('mypage.bankInfoName') }}
    </div>

    <form @submit.prevent="submitBankInfo">
      <div class="form-group" v-if="!user.real_name">
        <label>{{ $t('mypage.realName') }}</label>
        <input
          v-model="form.real_name"
          :placeholder="$t('mypage.realName')"
        />
      </div>
      <div v-else class="readonly-field">
        <strong>{{ $t('mypage.realName') }}:</strong> {{ user.real_name }}
      </div>

      <div class="form-group">
        <label>{{ $t('mypage.bankName') }}</label>
        <input
          v-model="form.bank_name"
          :disabled="!user.real_name && !form.real_name"
          :placeholder="$t('mypage.bankName')"
        />
      </div>

      <div class="form-group">
        <label>{{ $t('mypage.bankAccount') }}</label>
        <input
          v-model="form.bank_account"
          :disabled="!user.real_name && !form.real_name"
          :placeholder="$t('mypage.bankAccount')"
        />
      </div>
      <div class="form-group">
        <label>{{ $t('mypage.walletAddress') }}</label>
        <input
          v-model="form.wallet_address"
          :placeholder="$t('mypage.walletAddress')"
        />
      </div>
      <button
        type="submit"
        :disabled="!isFormValid || loading"
        :class="{ disabled: !isFormValid || loading }"
      >
        {{ loading ? $t('common.saving') : $t('mypage.common.save') }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from '@/axiosUser'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const props = defineProps({ user: Object })
const emit = defineEmits(['updated'])

const form = ref({
  real_name: '',
  bank_name: '',
  bank_account: '',
  wallet_address: ''
})
const token = localStorage.getItem('user_token')
const loading = ref(false)

// ✅ 페이지 로드시 서버에 저장된 정보 불러오기
onMounted(async () => {
  try {
    const res = await axios.get('/users/info', {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = res.data
    form.value.real_name = data.real_name || ''
    form.value.bank_name = data.bank_name || ''
    form.value.bank_account = data.bank_account || ''
    form.value.wallet_address = data.wallet_address || ''  // ✅ 추가
  } catch (err) {
    console.error('❌ 사용자 정보 불러오기 실패:', err)
  }
})

const isFormValid = computed(() => {
  const hasRealName = props.user.real_name || form.value.real_name
  return hasRealName && form.value.bank_name && form.value.bank_account
})

const submitBankInfo = async () => {
  if (!isFormValid.value) return
  loading.value = true
  try {
    await axios.patch(
      `/users/${props.user.id}/bank-info`,
      {
        real_name: props.user.real_name || form.value.real_name,
        bank_name: form.value.bank_name,
        bank_account: form.value.bank_account,
        wallet_address: form.value.wallet_address
      },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    alert(t('mypage.bankInfoSaveSuccess'))
    emit('updated')
  } catch (err) {
    alert(t('mypage.bankInfoSaveFailed'))
  } finally {
    loading.value = false
  }
}
</script>


<style scoped>

.notice-box {
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
  background: #fff8f0;
  color: #c05621;
  border-radius: 8px;
  font-size: 0.9rem;
}

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

.readonly-field {
  font-size: 0.95rem;
  margin-bottom: 1rem;
  color: #333;
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

.mypage-section button.disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>
