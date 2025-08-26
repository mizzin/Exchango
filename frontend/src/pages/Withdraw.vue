<template>
  <UserLayout>
    <div class="form_box">
      <h2>{{ $t('withdraw.title') }}</h2>

      <!-- 통화 선택 -->
      <div class="form-group">
        <label>{{ $t('withdraw.selectCurrency') }}</label>
        <select v-model="form.currency" @change="updateExchange">
          <option disabled value="">{{ $t('common.select') }}</option>
          <option value="KRW">₩ {{ $t('currency.krw') }}</option>
          <option value="PHP">₱ {{ $t('currency.php') }}</option>
          <option value="USDT">₮ {{ $t('currency.usdt') }}</option>
        </select>
      </div>

      <!-- 플랫폼 선택 -->
        <div class="form-group">
          <label>{{ $t('withdraw.selectPlatform') }}</label>
          <select v-model="form.platform_id">
            <option disabled value="">{{ $t('common.selectPrompt') }}</option>
            <option v-for="item in platforms" :key="item.id" :value="item.id">
              {{ item.name }}
            </option>
          </select>
        </div>

      <!-- 플랫폼 ID 표시 -->
      <div class="form-group">
        <label>{{ $t('withdraw.platformId') }}</label>
        <input type="text" :value="platformUserId" readonly class="readonly-input" />
      </div>

      <!-- 출금 금액 입력 -->
      <div class="form-group">
       <label>{{ $t('withdraw.amountInput') }}</label>
        <input type="number" v-model.number="form.amount" @input="updateExchange" placeholder="예: 100" />
      </div>

      <!-- 예상 수령 금액 -->
      <div class="form-group" v-if="form.amount >= 40 && exchangeRate">
       <label>{{ $t('withdraw.expectedReceive', { currency: form.currency }) }}</label>
        <input type="text" :value="convertedAmountDisplay" readonly class="readonly-input" />
      </div>

      <!-- 세부 내역 -->
      <div v-if="form.amount >= 40 && exchangeRate" class="details-box">
        <details>
          <summary class="detail-summary">{{ $t('withdraw.viewDetails') }}</summary>
          <ul class="details">
           <li>{{ $t('withdraw.rateWithFee') }}: {{ exchangeRateDisplay }} {{ form.currency }}</li>
            <li>{{ $t('withdraw.amountUsd') }}: {{ form.amount }} USD</li>
            <li>{{ $t('withdraw.estimatedReceive') }}: {{ convertedAmountDisplay }}</li>
          </ul>
        </details>
      </div>

      <!-- 한화(KRW)일 경우 은행정보 표시 -->
      <div v-if="form.currency === 'KRW'" class="form-group">
        <label>{{ $t('withdraw.bankName') }}</label>
        <input type="text" :value="user.bank_name" readonly class="readonly-input"/>
        <label>{{ $t('withdraw.bankAccount') }}</label>
        <input type="text" :value="user.bank_account" readonly class="readonly-input"/>
      </div>

      <!-- 페소/테더일 경우 메모 -->
      <div v-if="form.currency !== 'KRW'" class="form-group">
        <label for="user_memo">{{ $t('withdraw.memoLabel') }}</label>
  <textarea id="user_memo" v-model="form.user_memo" rows="3"
    :placeholder="$t('withdraw.memoPlaceholder')"
    class="styled-textarea"></textarea>
      </div>

      <!-- 본인 명의 계좌 안내 -->
      <div class="alert-box">
         ⚠️ {{ $t('withdraw.onlyOwnAccount') }}
      </div>

      <!-- 최종 확인 체크 -->
      <div class="form-group checkbox-inline">
            <label>
                <input type="checkbox" v-model="form.agree" />
                 {{ $t('withdraw.agreeCheck') }}
            </label>
        </div>

      <!-- 제출 버튼 -->
      <button :disabled="!form.agree" @click="submitWithdraw">
        {{ $t('withdraw.submit') }}
      </button>

      <div class="history-list " v-if="withdrawHistory.length">
         <div class="history-header">
          <h3>{{ $t('withdraw.recentWithdraw') }}</h3>
          <span class="more-link" @click="goToHistory">{{ $t('common.more') }} &#129170;</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>{{ $t('common.date') }}</th>
              <th>$</th>
              <th>{{ $t('common.currency') }}</th>
              <th>{{ $t('charge.amount') }}</th>
              <th>{{ $t('common.status') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in withdrawHistory" :key="item.id">
              <td>{{ formatDate(item.created_at) }}</td>
              <td>{{ item.amount }}</td>
              <td>{{ item.currency }}</td>
              <td>{{ item.krw_amount?.toLocaleString() }}</td>
              <td>{{ formatStatus(item.status) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else style="text-align:center; margin-top:2rem;">{{ $t('withdraw.noHistory') }}</p>

    </div>
  </UserLayout>
</template>

<script setup>
import { reactive, ref, computed, onMounted, watch } from 'vue'
import axios from '@/axiosUser'
import UserLayout from '@/components/UserLayout.vue'

const exchangeRate = ref(0)
const convertedAmount = ref(0)
const platformUserId = ref('')
const userPlatformIds = ref({})
const withdrawHistory = ref([])

const user = reactive({
  bank_name: '',
  bank_account: ''
})

const platforms = ref([])

const fetchPlatformOptions = async () => {
  const lang = localStorage.getItem('lang') || 'ko'
  try {
    const res = await axios.get(`/platforms?lang=${lang}`)
    platforms.value = res.data 
  } catch (err) {
    console.error('플랫폼 목록 불러오기 실패:', err)
  }
}
const getPlatformName = (id) => {
  const found = platformOptions.value.find(p => p.id === id)
  return found ? found.name : id
}
const form = reactive({
  currency: '',
  amount: null,
  platform_id: '',
  user_memo: '',
  agree: false
})

watch(() => form.platform_id, (newVal) => {
  platformUserId.value = userPlatformIds.value[newVal] || ''
})

const updateExchange = async () => {
  if (!form.currency || !form.amount) return

  try {
    const res = await axios.get('/exchange-rate')

    const rate = res.data.rates[form.currency]
    if (!rate) throw new Error('선택한 통화 환율이 없습니다.')

    exchangeRate.value = rate * 0.98  // 수수료 적용
    convertedAmount.value = Math.round(form.amount * exchangeRate.value)
  } catch (err) {
    console.error('❌ 환율 조회 실패:', err)
    alert('Failed to retrieve exchange rate information.')
  }
}


const convertedAmountDisplay = computed(() => {
  return convertedAmount.value > 0 ? `${convertedAmount.value.toLocaleString()} ${form.currency}` : ''
})

const exchangeRateDisplay = computed(() => {
  return exchangeRate.value ? exchangeRate.value.toFixed(4) : '-'
})

onMounted(async () => {
  const token = localStorage.getItem('user_token')
  try {
    const res = await axios.get('/users/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
    userPlatformIds.value = res.data.platform_ids || {}
    user.bank_name = res.data.bank_name
    user.bank_account = res.data.bank_account
  } catch (err) {
    console.error('사용자 정보 로딩 실패:', err)
  }
   await fetchWithdrawHistory()
   await fetchPlatformOptions()
})

const submitWithdraw = async () => {
  if (!form.agree) return alert('Please agree to confirm withdrawal information.')
  if (!form.platform_id || !platformUserId.value || !form.amount || !form.currency) {
    return alert('Please enter all items.')
  }
  if (form.amount < 40) return alert('The minimum withdrawal amount is $40.')

  try {
    const token = localStorage.getItem('user_token')
    await axios.post('/api/transactions/withdraw', {
      amount: form.amount,
      currency: form.currency,
      krw_amount: convertedAmount.value,
      platform_id: form.platform_id,
      platform_user_id: platformUserId.value,
      user_memo: form.user_memo
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })

    alert('Withdrawal request has been completed.')
    form.currency = ''
    form.amount = null
    form.platform_id = ''
    form.user_memo= ''
    form.agree = false
    convertedAmount.value = 0
    platformUserId.value = ''
  } catch (err) {
    console.error('❌ 출금신청 오류:', err)
    alert('An error occurred while applying.')
  }
}
const fetchWithdrawHistory = async () => {
  const token = localStorage.getItem('user_token')
  try {
    const res = await axios.get('/users/me/withdraws', {
      headers: { Authorization: `Bearer ${token}` }
    })
    withdrawHistory.value = res.data.transactions || []
    console.log(res.data.transactions);
  } catch (err) {
    console.error('출금 이력 로딩 실패:', err)
  }
}
const formatDate = (str) => {
  const date = new Date(str)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')

  return `${year}.${month}.${day} ${hours}:${minutes}`
}

const formatStatus = (status) => {
  switch (status) {
    case 'pending': return 'pending'
    case 'completed': return 'completed'
    case 'rejected': return 'rejected'
    default: return status
  }
}

import { useRouter } from 'vue-router'
const router = useRouter()

const goToHistory = () => {
  router.push('/trade/history')
}

</script>

<style scoped>
.detail-summary {
  cursor: pointer;
  color: #4a6cf7;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.details {
  font-size: 0.9rem;
  color: #444;
  margin-left: 1rem;
}
.styled-textarea {
  width: 90%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  resize: vertical;
  font-size: 14px;
  font-family: inherit;
  background-color: #fff;
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

.strong-alert {
  margin-top: 1rem;
  background-color: #fff4f4;
  border: 1px solid #e74c3c;
  color: #c0392b;
  padding: 10px;
  border-radius: 6px;
  font-weight: 500;
  font-size: 14px;
  line-height: 1.4;
}

.form_box {
  max-width: 420px;
  margin: auto;
  padding: 1.5rem;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  font-family: 'Noto Sans KR', sans-serif;
}
.form-group {
  margin-bottom: 1.2rem;
}
.btn-submit {
  background-color: #4a6cf7;
  color: white;
  padding: 0.8rem;
  width: 100%;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s ease;
}
.btn-submit:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}
.alert-box {
  background-color: #ffe8e8;
  border: 1px solid #e74c3c;
  color: #c0392b;
  padding: 12px;
  margin-bottom: 1.2rem;
  border-radius: 6px;
  font-weight: bold;
}
.details-box {
  margin-bottom: 1.5rem;
}
.readonly-input {
  background-color: #f5f5f5;
  color: #555;
  cursor: not-allowed;
  border: 1px solid #ccc;
  padding: 8px;
  border-radius: 4px;
}

</style>