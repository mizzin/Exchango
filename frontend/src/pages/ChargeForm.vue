<template>
  <UserLayout>
    <div class="form_box">
      <h2>🔋 {{ $t('charge.title') }}</h2>

      <div class="form-group">
        <label>{{ $t('charge.selectCurrency') }}</label>
        <select v-model="selectedCurrency" @change="fetchExchangeRate">
          <option disabled value="">{{ $t('charge.selectPlaceholder') }}</option>
          <option value="KRW">₩ {{ $t('charge.koreanWon') }}</option>
          <option value="PHP">₱ {{ $t('charge.philippinePeso') }}</option>
          <option value="USDT">₮ {{ $t('charge.usdt') }}</option>
        </select>
      </div>

      <div class="form-group">
        <label>{{ $t('charge.selectPlatform') }}</label>
        <select v-model="platform" @change="updateExchangeRate">
          <option disabled value="">{{ $t('charge.selectPlaceholder') }}</option>
          <option v-for="item in platforms" :key="item.id" :value="item.id">
            {{ item.name }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label>{{ $t('charge.platformId') }}</label>
        <input type="text" :value="platformUserId" readonly class="readonly-input" />
      </div>

      <div class="form-group">
        <label>{{ $t('charge.inputUsd') }}</label>
        <input type="number" v-model.number="usdAmount" :placeholder="$t('charge.inputPlaceholder')" @input="calculateConvertedAmount" />
      </div>

      <div class="form-group">
        <label>{{ $t('charge.totalSend') }} ({{ selectedCurrency }})</label>
        <input type="text" :value="convertedAmountDisplay" readonly class="readonly-input" />
        <small class="text-muted">{{ $t('charge.feeNote') }}</small>
      </div>

      <div class="form-group" v-if="usdAmount > 0">
        <details>
          <summary class="detail-summary">{{ $t('charge.viewDetails') }}</summary>
          <ul class="details">
            <li>{{ $t('charge.rate') }}: {{ exchangeRateDisplay }} {{ selectedCurrency }}</li>
            <li>{{ $t('charge.amountUsd') }}: {{ usdAmount }} USD</li>
            <li>{{ $t('charge.totalConverted') }}: {{ Math.round(convertedAmount).toLocaleString() }} {{ selectedCurrency }}</li>
          </ul>
        </details>
      </div>

      <button class="btn-submit" @click="submit">{{ $t('charge.submit') }}</button>

      <div class="history-list" v-if="history.length">
        <div class="history-header">
          <h3>📋 {{ $t('charge.recentHistory') }}</h3>
          <span class="more-link" @click="goToHistory">{{ $t('charge.viewMore') }} &#129170;</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>{{ $t('charge.date') }}</th>
              <th>$</th>
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
  </UserLayout>
</template>


<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from '@/axiosUser'
import UserLayout from '@/components/UserLayout.vue'
import { useI18n } from 'vue-i18n'


const { t } = useI18n()
const platform = ref('')
const platformUserId = ref('')
const usdAmount = ref(0)
const exchangeRate = ref(0)
const convertedAmount = ref(0)
const userPlatformIds = ref({})
const selectedCurrency = ref('')
const history = ref([])

const platforms = ref([])
const fetchPlatformOptions = async () => {
  const lang = localStorage.getItem('lang') || 'ko'
  try {
    const res = await axios.get(`/platforms?lang=${lang}`)
    platforms.value = res.data // [{ id: '001', name: 'A플랫폼' }, ...]
  } catch (err) {
    console.error('Failed to load platform list:', err)
  }
}

onMounted(async () => {
  const token = localStorage.getItem('user_token')
  try {
    const res = await axios.get('/users/me')
    userPlatformIds.value = res.data.platform_ids || {}
  } catch (err) {
    console.error(err)
  }

  await fetchPlatformOptions()
  await fetchHistory()
})


const fetchExchangeRate = async () => {
  if (!selectedCurrency.value) return

  try {
    const res = await axios.get('/exchange-rate')
    const rate = res.data.rates[selectedCurrency.value]
    if (!rate) throw new Error(t('charge.alert.noExchange'))

    exchangeRate.value = rate * 1.02  // 충전은 +2% 수수료
    calculateConvertedAmount()
  } catch (err) {
    console.error('Exchange rate inquiry failed:', err)
  }
}

const updateExchangeRate = () => {
  platformUserId.value = userPlatformIds.value[platform.value] || ''
}

const calculateConvertedAmount = () => {
  convertedAmount.value = Math.round(usdAmount.value * exchangeRate.value)
}

const convertedAmountDisplay = computed(() => {
  return convertedAmount.value > 0 ? `${convertedAmount.value.toLocaleString()} ${selectedCurrency.value}` : ''
})

const exchangeRateDisplay = computed(() => {
  return exchangeRate.value ? exchangeRate.value.toFixed(2) : '-'
})

const submit = async () => {
  if (!platform.value || !platformUserId.value || !usdAmount.value || !selectedCurrency.value) {
    alert(t('charge.alert.fillAll'))
    return
  }

  if (usdAmount.value < 40) {
    alert(t('charge.alert.minimumAmount'))
    return
  }

  try {
    const token = localStorage.getItem('user_token')
    await axios.post('/api/transactions', {
      type: 'charge',
      amount: usdAmount.value,
      currency: selectedCurrency.value,
      local_amount: convertedAmount.value,
      platform_id: platform.value,
      platform_user_id: platformUserId.value
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    
    alert(t('charge.alert.success'))
    platform.value = ''
    platformUserId.value = ''
    usdAmount.value = 0
    convertedAmount.value = 0
    selectedCurrency.value = ''
    await fetchHistory()
  } catch (err) {
    alert(t('charge.alert.error'))
    console.error(err)
  }
}

const fetchHistory = async () => {
  const token = localStorage.getItem('user_token')
  try {
    const res = await axios.get('/users/me/transactions', {
      headers: { Authorization: `Bearer ${token}` }
    })
    history.value = res.data.transactions || []
  } catch (err) {
    console.error('충전 이력 로딩 실패:', err)
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
    case 'pending': return t('charge.status.pending')
    case 'completed': return t('charge.status.completed')
    case 'rejected': return t('charge.status.rejected')
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
  margin-bottom: 1.25rem;
}

label {
  font-weight: 600;
  display: block;
  margin-bottom: 0.4rem;
}

input, select {
  width: 100%;
  padding: 0.55rem 0.8rem;
  border-radius: 6px;
  border: 1px solid #d0d0d0;
  font-size: 0.95rem;
}

input[disabled] {
  background-color: #f1f1f1;
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

.btn-submit:hover {
  background-color: #3a56d8;
}

.text-muted {
  font-size: 0.8rem;
  color: #777;
  margin-top: 0.2rem;
  display: block;
}

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

</style>