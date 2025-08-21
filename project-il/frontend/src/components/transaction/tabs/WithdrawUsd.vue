<template>
  <div class="withdraw-usd">
    <!--돈선택-->
    <div class="form-group">
      <label>{{ $t('withdraw.selectCurrency') }}</label>
     <select v-model="form.currency" @change="fetchExchangeRate">
  <option disabled value="">{{ $t('withdraw.selectPlaceholder') }}</option>
  <option value="USDT">₮ USDT</option>
  <option value="PHP">₱ Philippine Peso</option>
  <option value="KRW">₩ Korean Won</option>
</select>
    </div>

    <div class="form-group">
      <label>{{ $t('withdraw.selectPlatform') }}</label>
      <select v-model="platform" @change="updateExchangeRate">
      <option disabled value="">{{ $t('withdraw.selectPlaceholder') }}</option>
      <option
        v-for="item in filteredPlatforms"
        :key="item.id"
        :value="item.id"
      >
        {{ item.name }}
      </option>
    </select>
    </div>

    <div class="form-group">
      <label>{{ $t('withdraw.platformId') }}</label>
      <input
        type="text"
        v-model="platformUserId"
        :readonly="!!userPlatformIds[platform]"
        :placeholder="$t('withdraw.platformIdPlaceholder')"
      />
    </div>

 <!-- 출금금액입력-->
    <div class="form-group">
      <label>{{ $t('withdraw.inputUsd') }}</label>
      <input
        type="number"
        v-model.number="form.amount "
        :placeholder="$t('withdraw.inputPlaceholder')"
        @input="calculateConvertedAmount"
      />
    </div>
 <!-- 총전송 -->
    <div class="form-group">
      <label>{{ $t('withdraw.totalSend') }} ({{ selectedCurrency }})</label>
      <input type="text" :value="convertedAmountDisplay" readonly />
      <small class="text-muted">{{ $t('withdraw.feeNote') }}</small>
    </div>
 <!-- 디테일 -->
    <div class="form-group" v-if="form.amount > 0">
      <details>
        <summary class="detail-summary">{{ $t('withdraw.viewDetails') }}</summary>
         <ul class="details">
          <li>{{ $t('withdraw.rate') }}: {{ exchangeRateDisplay }} {{ selectedCurrency }}</li>
          <li>{{ $t('withdraw.amountUsd') }}: {{ form.amount }} USD</li>
          <li>{{ $t('withdraw.totalConverted') }}: {{convertedAmountDisplay}}</li>
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
      <div v-if="form.currency && form.currency !== 'KRW'" class="form-group">
        <label for="user_memo">{{ $t('withdraw.memoLabel') }}</label>
        <textarea id="user_memo" v-model="form.user_memo" rows="3"
          :placeholder="$t('withdraw.memoPlaceholder')"
          class="styled-textarea"></textarea>
      </div>

      <!-- 본인 명의 계좌 안내 -->
      <div v-if="form.currency === 'KRW'" class="alert-box">
         ⚠️ {{ $t('withdraw.onlyOwnAccount') }}
      </div>
      <!-- 최종 확인 체크 -->
      <div class="form-group checkbox-inline">
        <p class="warning-text">
        <label class="agree-label">
          <input type="checkbox" v-model="form.agree" />
          {{ $t('withdraw.agreeConfirm') }}
        </label>
          {{ $t('withdraw.agreeCheck_line1') }}<br />
          {{ $t('withdraw.agreeCheck_line2') }}
          {{ $t('withdraw.agreeCheck_line3') }}
        </p>
      </div>

    <button class="btn-submit" @click="submitWithdraw">{{ $t('withdraw.submit') }}</button>

    
      <div class="history-list" v-if="history.length">
        <div class="history-header">
          <h3> {{ $t('withdraw.recentHistory') }}</h3>
          <span class="more-link" @click="goToHistory">{{ $t('withdraw.viewMore') }} &#129170;</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>{{ $t('withdraw.date') }}</th>
              <th>{{ $t('withdraw.inputAmount') }}</th>
              <th>{{ $t('withdraw.currency') }}</th>
              <th>{{ $t('withdraw.amount') }}</th>
              <th>{{ $t('withdraw.statusth') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in history.slice(0, 10)" :key="item.id">
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
</template>

<script setup>
import { reactive, ref, computed, onMounted, watch } from 'vue'
import axios from '@/axiosUser'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
const { t } = useI18n()
const router = useRouter()
const history = ref([])
const exchangeRate = ref(1)
const convertedAmount = ref(0)
const platforms = ref([])
const platform = ref('')
const platformUserId = ref('')
const userPlatformIds = ref({})

const user = reactive({
  bank_name: '',
  bank_account: ''
})

const form = reactive({
  currency: '',
  amount: null,
  platform_id: '',
  user_memo: '',
  agree: false
})

const selectedCurrency = computed(() => form.currency || '')


const fetchPlatformOptions = async () => {
  const lang = localStorage.getItem('lang') || 'ko'
  const res = await axios.get(`/api/platforms?lang=${lang}`)
  platforms.value = res.data
}
const filteredPlatforms = computed(() => {
  const blockedIds = ['x-poker', 'pokernex']
  return platforms.value.filter(p => !blockedIds.includes(p.id.toLowerCase()))
})

const fetchUserPlatformIds = async () => {
  const res = await axios.get('/users/me/withdraws', {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('user_token')}`
    }
  })
  userPlatformIds.value = res.data.platform_ids || {}
}

//출금불러오기
const fetchHistory = async () => {
  const token = localStorage.getItem('user_token')
  try {
    const res = await axios.get('/users/me/withdraws', {
      headers: { Authorization: `Bearer ${token}` }
    })
    history.value = (Array.isArray(res.data) ? res.data : res.data.transactions || [])
  } catch (err) {
    console.error('출금 내역 불러오기 실패:', err)
    history.value = []
  }
}
const goToHistory = () => {
  router.push({ path: '/trade/history', query: { tab: 'withdraw' } })
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
    case 'pending': return '대기 중'
    case 'completed': return '완료'
    case 'rejected': return '거절됨'
    default: return status
  }
}

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
  await fetchPlatformOptions()
  await fetchUserPlatformIds()
  await fetchExchangeRate()
   await fetchHistory()
})

const fetchExchangeRate = async () => {
  const res = await axios.get('/exchange-rate')
  const rates = res.data.rates

  const usdToKrw = rates['KRW']
  const usdToPhp = rates['PHP']

  if (selectedCurrency.value === 'PHP') {
    exchangeRate.value = usdToPhp
  } else if (selectedCurrency.value === 'KRW') {
    exchangeRate.value = usdToKrw
  } else if (selectedCurrency.value === 'USDT') {
    exchangeRate.value = 1// 1 USD → 0.98 USDT
  }
}

const calculateConvertedAmount = () => {
  if (!form.amount  || !exchangeRate.value) return
  convertedAmount.value = Math.round(form.amount  * exchangeRate.value)
}

watch(() => [form.amount, form.currency], () => {
  calculateConvertedAmount()
})

const convertedAmountDisplay = computed(() => {
  if (!form.amount || !exchangeRate.value || !selectedCurrency.value) return ''
  const result = Math.round(form.amount * exchangeRate.value * 0.98)
  return `${result.toLocaleString()} ${selectedCurrency.value}`
})
const convertedAmountNet = computed(() => {
  if (!form.amount || !exchangeRate.value || !selectedCurrency.value) return 0
  return Math.round(form.amount * exchangeRate.value * 0.98)
})

const exchangeRateDisplay = computed(() => {
  return exchangeRate.value ? exchangeRate.value.toFixed(2) : '-'
})

const submitWithdraw = async () => {
  if (!form.agree) return alert(t('withdraw.alert.agree'))
  if (!form.amount || !platform.value || !form.currency) {
    return alert(t('withdraw.alert.fillAll'))
  }
if (form.amount < 40) return alert(t('withdraw.alert.minimumAmount'))
  try {
    await axios.post('/api/transactions/withdraw', {
      amount: form.amount,
      currency: selectedCurrency.value,
      local_amount: convertedAmount.value,
       krw_amount: convertedAmount.value,
      platform_id: platform.value,
      platform_user_id: platformUserId.value,
      user_memo: form.user_memo,
      expected_amount: convertedAmountNet.value,
    }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('user_token')}`
      }
    })
    console.log(form.amount);
    alert(t('withdraw.alert.success'))
    window.location.reload()
    await fetchHistory() // ✅ 출금 후 내역 갱신도 추가해주면 좋음
  } catch (e) {
    console.error(e)
    alert(t('withdraw.alert.error'))
  }
}


</script>

<style scoped>
.form-group {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 600;
  margin-bottom: 6px;
  color: #333;
  font-size: 14px;
}

.form-group select,
.form-group input[type="text"],
.form-group input[type="number"],
.readonly-input {
  padding: 10px 12px;
  font-size: 14px;
  border: 1px solid #ddd;
  border-radius: 6px;
  transition: border 0.2s ease;
}

.form-group select:focus,
.form-group input:focus {
  border-color: #3b49df;
  outline: none;
}

.readonly-input {
  background-color: #f1f3f8; /* 연한 회색 */
  color: #3f3f3f; /* 글씨도 연하게 */
  border: 1px solid #ccc; /* 테두리 진하게 */
  cursor: not-allowed; /* 커서로 비활성 느낌 */
  font-style: italic; /* 글꼴 기울임 */
}


.btn-submit {
  background-color: #3b49df;
  color: #fff;
  font-size: 15px;
  font-weight: bold;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  width: 100%;
}

.btn-submit:hover {
  background-color: #2e3bd1;
}
.btn-submit:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}
.history-list {
  margin-top: 2rem;
  border-top: 1px solid #eee;
  padding-top: 1.5rem;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.history-header h3 {
  font-size: 16px;
  color: #333;
}

.more-link {
  font-size: 13px;
  color: #3b49df;
  cursor: pointer;
  text-decoration: underline;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

table th,
table td {
  padding: 10px 8px;
  border-bottom: 1px solid #eee;
  text-align: left;
}

table th {
  color: #666;
  font-weight: 600;
}

table td {
  color: #333;
}

.detail-summary {
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #3b49df;
  margin-bottom: 6px;
}

.details {
  font-size: 14px;
  color: #555;
  margin-left: 1rem;
  list-style-type: disc;
}

.text-muted {
  font-size: 12px;
  color: #999;
}
.alert-box {
  background-color: #ffe8e8;
  border: 1px solid #e74c3c;
  color: #c0392b;
  padding: 12px;
  margin-bottom: 1.2rem;
  border-radius: 6px;
  font-weight: bold;
  font-size: 14px; 
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
.agree-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  margin-bottom: 6px;
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
}

@media (max-width: 768px) {
  .agree-label {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
