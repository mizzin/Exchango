<template>
    <UserLayout>
      <div class="wallet-charge">
        <h2>{{ $t('charge.title') }}</h2>
      <!-- 충전 수단 선택 -->
<div class="form-group">
  <label>충전 수단</label>
  <select v-model="currency" @change="fetchExchangeRate">
    <option disabled value="">통화 선택</option>
    <option value="KRW">₩ 원화</option>
    <option value="PHP">₱ 페소</option>
    <option value="USDT">₮ 테더</option>
  </select>
</div>

    <div class="form-group">
      <label>적립하고 싶은 USD</label>
      <input type="number" v-model.number="amountUsd" @input="calculateSendAmount" />
    </div>

          <!-- 입금해야 할 금액 표시 -->
      <div class="form-group">
        <label>입금할 금액 (수수료 포함)</label>
        <input type="text" :value="`${sendAmountWithFee.toLocaleString()} ${currency}`" readonly class="readonly-input" />
      </div>
            
      <button class="btn-submit" :disabled="!canSubmit" @click="submit">충전 신청</button>
    </div>
  </UserLayout>
</template>

<script setup>
import { reactive, computed, ref, watch } from 'vue'
import UserLayout from '@/components/UserLayout.vue'
import axios from '@/axiosUser'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const currency = ref('')
const localAmount = ref(0)
const exchangeRate = ref(0)
const usdAmount = ref(0)

const fetchExchangeRate = async () => {
  try {
    const res = await axios.get('/exchange-rate')
    const rates = res.data.rates

    if (currency.value === 'KRW') {
      exchangeRate.value = rates['KRW'] // 1 USD = ? KRW
    } else if (currency.value === 'PHP') {
      exchangeRate.value = rates['PHP']
    } else if (currency.value === 'USDT') {
      exchangeRate.value = 1  // 1 USDT = 1 USD
    } else {
      exchangeRate.value = 0
    }

    calculateUsd()
  } catch (e) {
    alert('환율 정보를 불러오지 못했습니다.')
  }
}

const calculateUsd = () => {
  if (!localAmount.value || !exchangeRate.value) return
  usdAmount.value = (localAmount.value * exchangeRate.value * 0.98).toFixed(2) // 수수료 2%
}

const usdAmountDisplay = computed(() =>
  usdAmount.value > 0 ? `${usdAmount.value} USD` : ''
)

const canSubmit = computed(() =>
  currency.value && amountUsd.value >= 40
)

const amountUsd = ref(0) // 사용자가 입력할 USD

const sendAmountWithFee = computed(() => {
  if (!amountUsd.value || !exchangeRate.value) return 0

  const rawUsd = amountUsd.value / (1 - 0.02)
  const local = rawUsd * exchangeRate.value

  return Math.round(local)
})

const submit = async () => {
  try {
      await axios.post('/api/transactions/wallet/charge', {
      currency: currency.value,
      local_amount: sendAmountWithFee.value,
      amount_usd: amountUsd.value,
       expected_amount: sendAmountWithFee.value,
    })
    alert('충전 신청이 완료되었습니다.')
    currency.value = ''
    localAmount.value = 0
    usdAmount.value = 0
  } catch (e) {
    console.error(e)
    alert('충전 신청에 실패했습니다.')
  }
}
</script>


<style scoped>
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