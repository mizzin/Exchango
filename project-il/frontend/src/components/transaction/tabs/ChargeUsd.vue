<template>
  <div class="charge-usd">
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

    <div class="form-group">
      <label>{{ $t('charge.selectPlatform') }}</label>
      <select v-model="platform" @change="updateExchangeRate">
      <option disabled value="">{{ $t('charge.selectPlaceholder') }}</option>
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
      <label>{{ $t('charge.platformId') }}</label>
      <input
        type="text"
        v-model="platformUserId"
        :readonly="!!userPlatformIds[platform]"
        :placeholder="$t('charge.platformIdPlaceholder')"
        class="readonly-input"
      />
    </div>

    <div class="form-group">
      <label>{{ $t('charge.inputUsd') }}</label>
      <input
        type="number"
        v-model.number="usdAmount"
        :placeholder="$t('charge.inputPlaceholder')"
        @input="calculateConvertedAmount"
      />
    </div>

    <div class="form-group">
      <label>{{ $t('charge.totalSend') }} ({{ selectedCurrency }})</label>
      <input type="text" :value="convertedAmountDisplay" readonly />
      <small class="text-muted">{{ $t('charge.feeNote') }}</small>
    </div>

    <div class="form-group" v-if="usdAmount > 0">
      <details>
        <summary class="detail-summary">{{ $t('charge.viewDetails') }}</summary>
         <ul class="details">
          <li>{{ $t('charge.rate') }}: {{ exchangeRateDisplay }} {{ selectedCurrency }}</li>
          <li>{{ $t('charge.amountUsd') }}: {{ usdAmount }} USD</li>
          <li>{{ $t('charge.totalConverted') }}: {{convertedAmountDisplay}}</li>
        </ul>
      </details>
    </div>

        <button 
      class="btn-submit" 
      :disabled="!isChargeValid"
      @click="submit"
      >
      {{ $t('charge.submit') }}
      </button>
      
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/axiosUser'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const selectedCurrency = ref('')
const platform = ref('')
const platformUserId = ref('')
const usdAmount = ref(0)
const exchangeRate = ref(0)
const convertedAmount = ref(0)
const platforms = ref([])
const userPlatformIds = ref({})
const router = useRouter()
const totalAmount = ref(0)

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
  const res = await axios.get('/users/me', {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('user_token')}`
    }
  })
  userPlatformIds.value = res.data.platform_ids || {}
}

onMounted(async () => {
  await fetchPlatformOptions()
  await fetchUserPlatformIds()
  await fetchHistory()
})

const fetchExchangeRate = async () => {
  const res = await axios.get('/exchange-rate')
  const rates = res.data.rates
  const usdToKrw = rates['KRW']
  const usdToPhp = rates['PHP']
  const usdtToUsdt = rates['USDT']

  if (selectedCurrency.value === 'PHP') {
    exchangeRate.value = usdToPhp
  } else if (selectedCurrency.value === 'KRW') {
    exchangeRate.value = usdToKrw
  } else if (selectedCurrency.value === 'USDT') {
      exchangeRate.value = 1 // 1 USD = 1 USDT
  }
}

const updateExchangeRate = () => {
  const id = userPlatformIds.value[platform.value]
  platformUserId.value = id || ''
}
const calculateConvertedAmount = () => {
  if (!usdAmount.value || !exchangeRate.value) return
  const result = Math.round(usdAmount.value * exchangeRate.value * 1.02)
  convertedAmount.value = result // ✅ 이 줄 추가
  totalAmount.value = result
}

watch([usdAmount, selectedCurrency], calculateConvertedAmount)

const convertedAmountDisplay = computed(() => {
  if (!usdAmount.value || !exchangeRate.value || !selectedCurrency.value) return ''
  const result = Math.round(usdAmount.value * exchangeRate.value * 1.02)
  return `${result.toLocaleString()} ${selectedCurrency.value}`
})

const exchangeRateDisplay = computed(() => {
  return exchangeRate.value ? exchangeRate.value.toFixed(2) : '-'
})
const isChargeValid = computed(() => {
  return (
    platform.value &&
    platformUserId.value &&
    usdAmount.value &&
    selectedCurrency.value &&
    usdAmount.value >= 40
  )
})
const submit = async () => {
  if (!platform.value || !platformUserId.value || !usdAmount.value || !selectedCurrency.value) {
    return alert(t('charge.alert.fillAll')) 
  }

  if (usdAmount.value < 40) {
    return alert(t('charge.alert.minimumAmount'))
  }

  try {
    await axios.post('/api/transactions', {
      type: 'platform_charge',
      amount: usdAmount.value,
      currency: selectedCurrency.value,
      local_amount: convertedAmount.value,
      platform_id: platform.value,
      platform_user_id : platformUserId.value,
      expected_amount:convertedAmount.value,
    }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('user_token')}`
      }
    })

    alert(t('charge.alert.success'))
    window.location.reload()
    platform.value = ''
    platformUserId.value = ''
    usdAmount.value = 0
    convertedAmount.value = 0
    selectedCurrency.value = ''
  } catch (err) {
    alert(t('charge.alert.error'))
    console.error(err)
  }
}

const history = ref([])

const fetchHistory = async () => {
  try {
    const token = localStorage.getItem('user_token')
    const lang = localStorage.getItem('lang') || 'ko'
    const res = await axios.get(`/users/me/transactions?type=charge&lang=${lang}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    history.value = (Array.isArray(res.data) ? res.data : res.data.transactions || [])
  .filter(tx => tx.type === 'charge')
  } catch (e) {
    console.error('충전 이력 불러오기 실패:', e)
  }
}

const goToHistory = () => {
  router.push('/trade/history')
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString()
}

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
.btn-submit:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}
</style>
