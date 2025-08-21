<template>
  <div class="charge-krw">
        <!--돈선택-->
    <div class="form-group">
      <label>{{ $t('charge.selectCurrency') }}</label>
      <select v-model="selectedCurrency" @change="fetchExchangeRate">
          <option disabled value="">{{ $t('charge.selectPlaceholder') }}</option>
          <option value="USDT">₮ USDT</option>
          <option value="PHP">₱ Philippine Peso</option>
          <option value="KRW">₩ Korean Won</option>
        </select>
    </div>
    
    <!-- 플랫폼 선택 -->
    <div class="form-group">
      <label>{{ $t('charge.selectPlatform') }}</label>
      <select v-model="platform" @change="updatePlatformId">
        <option disabled value="">{{ $t('charge.selectPlaceholder') }}</option>
        <option value="x-poker">X-Poker</option>
        <option value="pokernex">PokerNex</option>
      </select>
    </div>

    <!-- 플랫폼 ID -->
    <div class="form-group">
      <label>{{ $t('charge.platformId') }}</label>
      <input
        type="text"
        v-model="platformUserId"
        :readonly="!!userPlatformIds[platform]"
        :placeholder="$t('charge.platformIdPlaceholder')"
        class="readonly-input"
      />
    </div>

    <!-- KRW 입력 -->
    <div class="form-group">
      <label>{{ $t('charge.inputKrw') }}</label>
      <input
        type="number"
        v-model.number="krwAmount"
        :placeholder="$t('charge.krwPlaceholder')"
        @input="calculateTotal"
      />
    </div>

    <!-- 총 송금액 표시 -->
    <div class="form-group">
      <label>{{ $t('charge.totalSend') }} {{ totalSendLabel }}</label>
      <input type="text" :value="totalWithFeeDisplay" readonly class="readonly-input" />
      <small class="text-muted">{{ $t('charge.feeNote') }}</small>
    </div>

    <!-- 상세 내역 -->
    <div class="form-group" v-if="krwAmount > 0">
      <details>
        <summary class="detail-summary">{{ $t('charge.viewDetails') }}</summary>
        <ul class="details">
          <li>{{ $t('charge.rate') }}:1 KRW ≈ {{ exchangeRate.toFixed(6) }} {{ selectedCurrency }}</li>
          <li>{{ $t('charge.feeNote') }}: 2%</li>
          <li>{{ $t('charge.totalConverted') }}: {{ totalWithFee.toLocaleString() }} {{ totalSendLabel }}</li>
        </ul>
      </details>
    </div>
<!-- 충전 버튼 -->
        <button 
      class="btn-submit" 
      :disabled="!isChargeValid"
      @click="submit"
      >
      {{ $t('charge.submit') }}
      </button>
    <!-- 충전 이력 -->
    <div class="history-list" v-if="history.length">
      <div class="history-header">
        <h3>📋 {{ $t('charge.recentHistory') }}</h3>
        <span class="more-link" @click="goToHistory">{{ $t('charge.viewMore') }} &#129170;</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>{{ $t('charge.date') }}</th>
            <th>{{ $t('charge.inputAmount') }}</th>
            <th>{{ $t('charge.currency') }}</th>
            <th>{{ $t('charge.amount') }}</th>
            <th>{{ $t('charge.statusth') }}</th>
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
    <p v-else style="text-align:center; margin-top:2rem;">{{ $t('charge.noHistory') }}</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from '@/axiosUser'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const router = useRouter()
const exchangeRate = ref(0)
const selectedCurrency = ref('')
const platform = ref('')
const platformUserId = ref('')
const krwAmount = ref(0)
const totalWithFee = ref(0)
const userPlatformIds = ref({})
const history = ref([])

const fetchExchangeRate = async () => {
  if (!selectedCurrency.value) {
    return alert(t('charge.alert.fillAll'))
  }

  const res = await axios.get('/exchange-rate')
  const rates = res.data.rates
console.log('KRW:', rates['KRW'], 'USDT:', rates['USDT'])
  if (selectedCurrency.value === 'KRW') {
    exchangeRate.value = 1 // 같은 통화
  } else if (selectedCurrency.value === 'PHP') {
    // 원화 → USD → PHP
    const krwToUsd = 1 / rates['KRW'] // ex: 1 / 1366
    const usdToPhp = rates['PHP']     // ex: 56.43
    exchangeRate.value = krwToUsd * usdToPhp
  }  else if (selectedCurrency.value === 'USDT') {
  const usdToKrw = rates['KRW']
  const krwToUsd = 1 / usdToKrw
  const usdToUsdt = 1 
  exchangeRate.value = krwToUsd * usdToUsdt
} else {
    return alert(t('charge.alert.noExchange'))
  }

  calculateTotal()
}



const totalWithFeeDisplay = computed(() =>
  totalWithFee.value > 0 ? `${totalWithFee.value.toLocaleString()} ${selectedCurrency.value}` : ''
)

const calculateTotal = () => {
  if (!krwAmount.value || !exchangeRate.value) return
totalWithFee.value = Math.round(krwAmount.value * exchangeRate.value * 1.02)


}


const fetchUserPlatformIds = async () => {
  const res = await axios.get('/users/me', {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('user_token')}`,
    },
  })
  userPlatformIds.value = res.data.platform_ids || {}
  if (platform.value) {
    platformUserId.value = userPlatformIds.value[platform.value] || ''
  }
}

const updatePlatformId = () => {
  platformUserId.value = userPlatformIds.value[platform.value] || ''
}

const fetchHistory = async () => {
  try {
    const token = localStorage.getItem('user_token')
    const lang = localStorage.getItem('lang') || 'ko'
    const res = await axios.get(`/users/me/transactions?type=charge&lang=${lang}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    history.value = (Array.isArray(res.data) ? res.data : res.data.transactions || [])
     .filter(tx => tx.type === 'charge' && ['KRW', 'PHP', 'USDT'].includes(tx.currency))
  } catch (e) {
    console.error('충전 이력 불러오기 실패:', e)
  }
}

const goToHistory = () => {
  router.push('/trade/history')
}

const formatDate = (date) => new Date(date).toLocaleDateString()

const formatStatus = (status) => {
  switch (status) {
    case 'pending':
      return t('charge.status.pending')
    case 'approved':
      return t('charge.status.approved')
    case 'rejected':
      return t('charge.status.rejected')
    default:
      return status
  }
}
const isChargeValid = computed(() => {
  return (
    platform.value &&
    platformUserId.value &&
    krwAmount.value &&
    selectedCurrency.value &&
    krwAmount.value >= 10000
  )
})
const submit = async () => {
  if (!platform.value || !platformUserId.value || !krwAmount.value || !selectedCurrency.value) {
    return alert(t('charge.alert.fillAll'))
  }
  if (krwAmount.value < 10000) {
    return alert(t('charge.alert.minimumAmount'))
  }

  try {
    await axios.post(
      '/api/transactions',
      {
        type: 'platform_charge',
        amount: krwAmount.value,
        currency: selectedCurrency.value,
        local_amount: totalWithFee.value,
        platform_id: platform.value,
        platform_user_id: platformUserId.value,
        expected_amount: totalWithFee.value, 
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('user_token')}`,
        },
      }
    )

    alert(t('charge.alert.success'))
      window.location.reload()
    krwAmount.value = 0
    totalWithFee.value = 0
    selectedCurrency.value = ''
  } catch (err) {
    alert(t('charge.alert.error'))
    console.error(err)
  }
}

const totalSendLabel = computed(() => {
  return selectedCurrency.value ? `(${selectedCurrency.value})` : ''
})

onMounted(async () => {
  await fetchUserPlatformIds()
  await fetchHistory()
})
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
  background-color: #fff;
  transition: border 0.2s ease;
}

.form-group select:focus,
.form-group input:focus {
  border-color: #3b49df;
  outline: none;
}

.readonly-input {
  background-color: #f1f3f8;
  color: #555;
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
  font-size: 14px;
  color: #3b49df;
  cursor: pointer;
  text-decoration: underline;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
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
.btn-submit:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}
</style>
