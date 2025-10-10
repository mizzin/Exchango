<template>
  <UserLayout>
    <div class="wallet-charge">
      <h2>{{ $t('charge.wallet.title') }}</h2>

    <div v-if="hasPending" class="pending-banner">
         <i class="icon-warning" />
        {{ $t('alert.pendingMoneyRequest') }}
        <a href="/wallet/history">{{ $t('alert.checkStatus') }}</a>
    </div>
    <div class="form-content" style="position:relative;">
      <div v-if="hasPending" class="blur-overlay">
        </div>
      <!-- 충전 수단 선택 -->
      <div class="form-group">
        <label>{{ $t('charge.wallet.method') }}</label>
        <select v-model="currency" @change="fetchExchangeRate">
          <option disabled value="">{{ $t('charge.wallet.selectCurrency') }}</option>
          <option value="KRW">₩ {{ $t('charge.wallet.krw') }}</option>
          <option value="PHP">₱ {{ $t('charge.wallet.php') }}</option>
          <option value="USDT">₮ {{ $t('charge.wallet.usdt') }}</option>
        </select>
      </div>

      <div class="form-group">
        <label>{{ $t('charge.wallet.inputUsdAmount') }}</label>
        <input type="number" v-model.number="amountUsd" @input="calculateSendAmount" />
      </div>

      <!-- 입금해야 할 금액 표시 -->
      <div class="form-group">
        <label>{{ $t('charge.wallet.totalSendWithFee') }}</label>
        <input type="text" :value="`${sendAmountWithFee.toLocaleString()} ${currency}`" readonly class="readonly-input" />
      </div>

      <button class="btn-submit" :disabled="!canSubmit" @click="submit">{{ $t('charge.wallet.submit') }}</button>
    </div>
    </div>
  </UserLayout>
</template>


<script setup>
import { reactive, computed, ref, watch, onMounted } from 'vue'
import UserLayout from '@/components/UserLayout.vue'
import axios from '@/axiosUser'
import { useI18n } from 'vue-i18n'

const hasPending = ref(false)
const { t } = useI18n()

const currency = ref('')
const localAmount = ref(0)
const exchangeRate = ref(0)
const usdAmount = ref(0)
const amountUsd = ref(0) // 사용자가 입력할 USD

// 🔹 환율 불러오기
const fetchExchangeRate = async () => {
  try {
    const res = await axios.get('/exchange-rate')
    const rates = res.data.rates

    if (currency.value === 'KRW') {
      exchangeRate.value = rates['KRW']
    } else if (currency.value === 'PHP') {
      exchangeRate.value = rates['PHP']
    } else if (currency.value === 'USDT') {
      exchangeRate.value = 1
    } else {
      exchangeRate.value = 0
    }

    calculateUsd()
  } catch (e) {
    alert(t('charge.wallet.fetchRateFailed'))
  }
}

// 🔹 USD 계산 (수수료 제거)
const calculateUsd = () => {
  if (!localAmount.value || !exchangeRate.value) return
  usdAmount.value = (localAmount.value * exchangeRate.value).toFixed(2)
}

const usdAmountDisplay = computed(() =>
  usdAmount.value > 0 ? `${usdAmount.value} USD` : ''
)

const canSubmit = computed(() =>
  currency.value && amountUsd.value >= 40
)

// 🔹 수수료 없는 송금액 계산
const sendAmountWithFee = computed(() => {
  if (!amountUsd.value || !exchangeRate.value) return 0
  const local = amountUsd.value * exchangeRate.value
  return Math.round(local)
})

// 🔹 충전 요청
const submit = async () => {
  try {
    await axios.post('/transactions/wallet/charge', {
      currency: currency.value,
      local_amount: sendAmountWithFee.value,
      amount_usd: amountUsd.value,
      expected_amount: sendAmountWithFee.value,
    })
    alert(t('charge.wallet.success'))
    currency.value = ''
    localAmount.value = 0
    usdAmount.value = 0
    alert(t('withdraw.alert.success'))
    window.location.reload()
  } catch (e) {
    console.error(e)
    alert(t('charge.wallet.failed'))
  }
}

// 🔹 진행중 신청 확인
const checkPending = async () => {
  try {
    const res = await axios.get('/users/me/transactions/pending-check?status=pending')
    const arr = Array.isArray(res.data.transactions) ? res.data.transactions : []

    const pendingTypes = [
      'charge', 'withdraw',
      'wallet_to_platform', 'platform_to_wallet', 'platform_to_platform',
      'platform_charge', 'wallet_charge', 'platform_withdraw', 'wallet_withdraw'
    ]

    hasPending.value = arr.some(
      tx => tx.status === 'pending' && pendingTypes.includes(tx.type)
    )
  } catch (e) {
    console.log('❌ 에러:', e)
    hasPending.value = false
  }
}

onMounted(checkPending)
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
.wallet-charge {
  background-color: #fff;
  max-width: 420px;
  margin: auto;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.04);
  border-radius: 12px;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  font-weight: 600;
  margin-bottom: 6px;
  display: block;
}

select, input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.readonly-input {
  background: #f4f4f4;
  color: #444;
}

.btn-submit {
  background: #3b49df;
  color: white;
  padding: 12px;
  width: 100%;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
}

.btn-submit:disabled {
  background: #bbb;
  cursor: not-allowed;
}
</style>