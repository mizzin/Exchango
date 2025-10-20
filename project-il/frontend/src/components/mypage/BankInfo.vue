<template>
  <div class="mypage-section">
    <div class="notice-box">
      ⚠️ {{ $t('mypage.bankInfoName') }}
    </div>
<form @submit.prevent="submitBankInfo">

  <!-- 🏦 원화 전용 -->
  <h3 class="section-title">🇰🇷 KRW</h3>
  <div class="form-group">
    <label>{{ $t('mypage.bankName') }}</label>
    <input v-model="form.bank_name" :placeholder="$t('mypage.bankName')" />
  </div>
  <div class="form-group">
    <label>{{ $t('mypage.bankAccount') }}</label>
    <input v-model="form.bank_account" :placeholder="$t('mypage.bankAccount')" />
  </div>

  <!-- 💰 USDT 전용 -->
  <h3 class="section-title">💵 USDT</h3>
  <div class="form-group">
    <label>{{ $t('mypage.walletAddress') }}</label>
    <input v-model="form.wallet_address" :placeholder="$t('mypage.walletAddress')" />
  </div>

  <!-- 🇵🇭 PHP 전용 -->
  <h3 class="section-title">🇵🇭 PHP</h3>
  <div class="form-group">
    <label>{{ $t('mypage.pesoAccountType') }}</label>
    <select v-model="form.peso_account_type">
      <option disabled value="">Select</option>
      <option value="GCash">GCash</option>
      <option value="GoTyme">GoTyme</option>
      <option value="BDO">BDO</option>
    </select>
  </div>
  <div class="form-group">
    <label>{{ $t('mypage.pesoAccount') }}</label>
    <input v-model="form.peso_account" :placeholder="$t('mypage.pesoAccountPlaceholder')" />
  </div>

  <button type="submit" :disabled="loading" :class="{ disabled: loading }">
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
    form.value.wallet_address = data.wallet_address || ''  
    form.value.peso_account_type = data.peso_account_type || ''  
    form.value.peso_account = data.peso_account || ''  
  } catch (err) {
    console.error('❌ 사용자 정보 불러오기 실패:', err)
  }
})

const isFormValid = computed(() => {
  return (
    form.value.real_name ||
    form.value.bank_name ||
    form.value.bank_account ||
    form.value.wallet_address||
    form.value.peso_account_type ||
    form.value.peso_account
  )
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
        wallet_address: form.value.wallet_address,
        peso_account_type: form.value.peso_account_type,
        peso_account: form.value.peso_account
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
.section-title {
  margin-top: 1.8rem;
  margin-bottom: 0.8rem;
  font-size: 1.05rem;
  font-weight: 600;
  color: #1f2d5a;
  border-left: 4px solid #0052cc;
  padding-left: 8px;
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
select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 14px;
  background-color: #fff;
  color: #333;
  appearance: none; /* 브라우저 기본 화살표 제거 */
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: url("data:image/svg+xml;charset=US-ASCII,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8'><path fill='black' d='M0 0l6 8 6-8z'/></svg>");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 10px 8px;
}

select:focus {
  outline: none;
  border-color: #0052cc;
  box-shadow: 0 0 0 2px rgba(0, 82, 204, 0.1);
}

</style>
