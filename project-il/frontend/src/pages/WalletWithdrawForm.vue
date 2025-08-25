<template>
  <UserLayout>
    <div class="withdraw-form">
      <h2>{{ t('withdraw.titleWallet') }}</h2>

      <!-- 보유 금액 -->
      <div class="balance-box">
        <p>{{ t('mypage.balance') }}: {{ userBalance }} USD</p>
      </div>

    <div v-if="hasPending" class="pending-banner">
         <i class="icon-warning" />
        {{ $t('alert.pendingMoneyRequest') }}
        <a href="/wallet/history">{{ $t('alert.checkStatus') }}</a>
    </div>
     <div class="form-content" style="position:relative;">
      <div v-if="hasPending" class="blur-overlay">
        </div>
      <!-- 출금 통화 선택 -->
      <div class="form-group">
        <label for="currency">{{ t('withdraw.selectCurrency') }}</label>
        <select id="currency" v-model="currency" @change="fetchExchangeRate">
          <option disabled value="">{{ t('charge.selectPlaceholder') }}</option>
          <option value="KRW">KRW</option>
          <option value="PHP">PHP</option>
          <option value="USDT">USDT</option>
        </select>
        <small v-if="!currency" class="error-msg">{{ t('withdraw.wallet.selectError') }}</small>
      </div>

      <!-- 출금금액 (USD 단위) -->
      <div class="form-group">
        <label for="amount">{{ t('withdraw.inputAmount') }} (USD)</label>
        <input
          type="number"
          v-model.number="amountUsd"
        />

          <small v-if="amountUsd && amountUsd < 40" class="error-msg">{{ t('withdraw.wallet.minAmountError') }}</small>
          <small v-else-if="amountUsd > userBalance" class="error-msg">{{ t('withdraw.wallet.balanceExceeded') }}</small>

      </div>

      <!-- 환율 및 수령 금액 -->
      <div v-if="currency" class="form-group">
        <label>{{ t('withdraw.totalSend') }}</label>
        <div class="output-box">{{ convertedAmountDisplay }}</div>
      </div>

      <!-- KRW 선택 시 은행 정보 표시 -->
      <div v-if="currency === 'KRW'" class="form-group">
        <label>{{ t('withdraw.bankInfo') }}</label>
        <div class="output-box">{{ bankInfo }}</div>
      </div>

      <!-- 메모 -->
      <div class="form-group">
        <label for="user_memo">{{ t('withdraw.memoLabel') }}</label>
        <input type="text" id="user_memo" v-model="user_memo" placeholder="" />
      </div>

      <!-- 출금비밀번호 -->
 <div class="mb-3">
  <label for="money-password" class="form-label">{{ t('withdraw.moneyPassword') }}</label>
  <input
    type="password"
    id="money-password"
    v-model="moneyPassword"
    maxlength="6"
    autocomplete="new-password"
    class="form-control"
  />
  <div v-if="moneyPassword && moneyPassword.length !== 6" class="invalid-feedback d-block">
    {{ t('withdraw.wallet.passwordError') }}
  </div>
</div>

      <!-- 동의 체크 -->
      <div class="form-group checkbox-group">
        <div class="agree-label">
          <input type="checkbox" v-model="agree" id="agree" />
          <label for="agree">{{ t('withdraw.agreeConfirm') }}</label>
        </div>
        <small class="agree-warning">
          {{ t('withdraw.agreeCheck_line1') }}<br />
          {{ t('withdraw.agreeCheck_line2') }}<br />
          {{ t('withdraw.agreeCheck_line3') }}
        </small>
        <small v-if="!agree" class="error-msg">{{ t('withdraw.wallet.agreeError') }}</small>
      </div>

      <!-- 제출 버튼 -->
      <button class="btn-submit" @click="submitWithdraw">
  {{ t('withdraw.submit') }}
</button>

</div>

    </div>
  </UserLayout>
</template>

<script setup>
import UserLayout from '@/components/UserLayout.vue'
import { ref, computed, onMounted, watch } from 'vue'
import axios from '@/axiosUser'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const hasPending = ref(false)

const currency = ref('')
const amountUsd = ref(null)
const exchangeRate = ref(1)
const convertedAmount = ref(0)
const user_memo = ref('')
const moneyPassword = ref('')
const agree = ref(false)
const user = ref({})

const userBalance = computed(() => Number(user.value?.balance ?? 0))
const bankInfo = computed(() => `${user.value?.bank_name ?? '-'} / ${user.value?.bank_account ?? '-'}`)

const isValidWithdraw = computed(() => {
  const amt = Number(amountUsd.value)
  const bal = userBalance.value
  return (
    currency.value &&
    !isNaN(amt) &&
    amt >= 40 &&
    amt <= bal &&
    moneyPassword.value.length === 6 &&
    agree.value
  )
})


const convertedAmountDisplay = computed(() => {
  if (!amountUsd.value || !exchangeRate.value || !currency.value) return ''
  const result = Math.round(amountUsd.value * exchangeRate.value * 0.98)
  return `${result.toLocaleString()} ${currency.value}`
})

const convertedAmountValue = computed(() => {
  if (!amountUsd.value || !exchangeRate.value || !currency.value) return 0
  return Math.round(amountUsd.value * exchangeRate.value * 0.98)
})

const fetchUserInfo = async () => {
  const token = localStorage.getItem('user_token')
  const lang = localStorage.getItem('lang') || 'ko'
  try {
    const res = await axios.get(`/users/info?lang=${lang}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    user.value = res.data
  } catch (err) {
    console.error('[유저 정보 로딩 실패]', err)
  }
}
const checkPending = async () => {
  try {
        const res = await axios.get('/users/me/transactions/pending-check?status=pending');

    const arr = Array.isArray(res.data.transactions) ? res.data.transactions : []
    const pendingTypes = [
      'charge', 'withdraw',
      'wallet_to_platform', 'platform_to_wallet', 'platform_to_platform',
      'platform_charge', 'wallet_charge', 'platform_withdraw', 'wallet_withdraw'
    ]
    hasPending.value = arr.some(tx => tx.status === 'pending' && pendingTypes.includes(tx.type))
  } catch (e) {
    console.log('axios 에러:', e)
    hasPending.value = false
  }
}

const fetchExchangeRate = async () => {
  if (!currency.value) return
  const res = await axios.get('/exchange-rate')
  const rates = res.data.rates

  if (currency.value === 'KRW') {
    exchangeRate.value = rates['KRW']      // USD → KRW
  } else if (currency.value === 'PHP') {
    exchangeRate.value = rates['PHP']      // USD → PHP
  } else if (currency.value === 'USDT') {
    exchangeRate.value = 1                 // USD ↔ USDT
  }
  calculateConvertedAmount()
}

// (선택) 통화 바뀔 때 환율 다시 가져오고 싶으면 이거도 추가:
// watch(currency, fetchExchangeRate)

watch([amountUsd, exchangeRate], () => {
  calculateConvertedAmount()
})

const calculateConvertedAmount = () => {
  if (!amountUsd.value || !exchangeRate.value) return
  const rawAmount = amountUsd.value * exchangeRate.value * 0.98
  convertedAmount.value = Math.round(rawAmount)
}

const submitWithdraw = async () => {
  if (!agree.value) return alert(t('withdraw.alert.agree'))
  if (!currency.value || !amountUsd.value || !moneyPassword.value) {
    if (!currency.value) return alert(t('withdraw.alert.requiredCurrency'))
    if (!amountUsd.value) return alert(t('withdraw.alert.requiredAmount'))
    if (!moneyPassword.value || moneyPassword.value.length !== 6) return alert(t('withdraw.alert.requiredPassword'))
  }
  if (amountUsd.value < 40) return alert(t('withdraw.alert.minimumAmount'))
  if (amountUsd.value > userBalance.value) {
    return alert(t('withdraw.alert.insufficientBalance'))
  }

  // ✅ pending일 땐 막기 (프런트 이중 방지)
  if (hasPending.value) {
    return alert(t('alert.pendingRequestWithAction'))
  }

  calculateConvertedAmount()

  try {
    await axios.post('/transactions/wallet/withdraw', {
      currency: currency.value,
      amount_usd: amountUsd.value,
      local_amount: convertedAmount.value,
      user_memo: currency.value === 'KRW' ? '' : user_memo.value,
      money_password: moneyPassword.value,
      expected_amount: convertedAmountValue.value,
    })
    alert(t('withdraw.alert.success'))
    window.location.reload() 
  } catch (err) {
    console.error('[출금 오류]', err)
    alert(err.response?.data?.message || '출금 중 오류 발생')
  }
}

onMounted(() => {
  fetchUserInfo()
  checkPending()        // ✅ 추가: 진입 시 pending 여부 확인
  currency.value = ''
  amountUsd.value = null
  moneyPassword.value = ''
  user_memo.value = ''
  agree.value = false
})
</script>


<style scoped>
.pending-banner {
  background-color: #fff3cd; /* 연한 노랑 (경고 느낌) */
  color: #856404;            /* 어두운 갈색 텍스트 */
  border: 1px solid #ffeeba;
  padding: 12px 16px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  margin-bottom: 1rem;
}

.pending-banner i {
  color: #856404;
  font-size: 18px;
}

.pending-banner a {
  margin-left: auto;
  color: #0d6efd; /* 파란색 링크 */
  font-weight: 500;
  text-decoration: underline;
}


.blur-overlay {
  position: absolute; top:0; left:0; right:0; bottom:0;
  background: rgba(255,255,255,0.8);
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  font-size: 17px; z-index:10;
  pointer-events: all;
}
.error-msg {
  color: #d9534f;
  font-size: 13px;
  margin-top: 4px;
}
.withdraw-form {
  background-color: #fff;
  max-width: 420px;
  margin: auto;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.04);
  border-radius: 12px;
}
input:not([type="checkbox"]),
select {
  outline: none;
  border: 1px solid #ccc;
  padding: 8px;
  width: 100%;
  border-radius: 0.375rem;
  box-sizing: border-box;
  font-family: inherit;
  font-size: 0.8rem;
}

input[type="checkbox"] {
  width: auto;
  height: auto;
  margin: 2px 6px 0 0;
  padding: 0;
  transform: scale(1.1);
  vertical-align: middle;
  cursor: pointer;
}


.output-box {
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 15px;
  margin-top: 6px;
}

.checkbox-group {
  display: block;
  margin-top: 20px;
}

.agree-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  margin-bottom: 8px;
}

.agree-label input[type="checkbox"] {
  transform: scale(1.1);
  margin-top: 2px;
}

.agree-text {
  display: inline-block;
  line-height: 1.5;
}
.agree-warning {
  display: block;
  font-size: 13px;
  color: #555;
  line-height: 1.5;
}

.form-group {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
}
.form-group input:not([type="checkbox"]),
.form-group select {
  width: 100%;
  padding: 8px;
  font-size: 14px;
}
.form-group label {
    font-weight: 600;
    margin-bottom: 6px;
    color: #333;
    font-size: 14px;
}
.result-box p {
  margin: 4px 0;
}

.checkbox-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  margin-top: 1rem;
}
.checkbox-inline input[type="checkbox"] {
  width: auto;
  transform: scale(1.1);
  margin-right: 6px;
}
.agree-text {
  display: inline-block;
  word-break: keep-all; /* 한국어 자연스럽게 줄바꿈 */
  max-width: 100%;
}
.warning-text {
  font-size: 0.92rem;
  color: #666;
  line-height: 1.6;
  word-break: keep-all;
}.alert-box {
  background-color: #ffe8e8;
  border: 1px solid #e74c3c;
  color: #c0392b;
  padding: 12px;
  margin-bottom: 1.2rem;
  border-radius: 6px;
  font-weight: bold;
  font-size: 14px; 
}
.btn-submit {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
.btn-submit:disabled {
  background-color: #cbd5e1; /* gray-300 */
  cursor: not-allowed;
  opacity: 0.6;
}
.warning-msg {
  color: #dc2626; /* red-600 */
  background-color: #fef2f2; /* red-50 */
  padding: 0.5rem 0.75rem;
  border: 1px solid #fecaca; /* red-200 */
  border-radius: 0.375rem;
  margin-top: 0.25rem;
  font-size: 0.875rem;
}

</style>
