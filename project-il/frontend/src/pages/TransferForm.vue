<template>
  <UserLayout>
    <div class="transfer-form">
      <h2>{{ $t('transfer.request1.title') }}</h2>

    <div v-if="hasPending" class="pending-banner">
         <i class="icon-warning" />
        {{ $t('alert.pendingMoneyRequest') }}
        <a href="/wallet/transfer/history">{{ $t('alert.checkStatus') }}</a>
    </div>
    <div class="form-content" style="position:relative;">
      <div v-if="hasPending" class="blur-overlay">
        </div>
      <!-- 이동 선택 -->
      <div class="form-group">
        <label class="form-label">{{ $t('transfer.request1.moveType') }}</label>
        <div class="radio-group">
          <label class="radio-option" :class="{ selected: form.from_type === 'wallet' }">
            <input type="radio" value="wallet" v-model="form.from_type" />
            <div class="radio-content">
              <strong>{{ $t('transfer.request1.walletToPlatform') }}</strong>
              <span class="radio-desc">{{ $t('transfer.request1.walletToPlatformDesc') }}</span>
            </div>
          </label>

          <label class="radio-option" :class="{ selected: form.from_type === 'platform' }">
            <input type="radio" value="platform" v-model="form.from_type" />
            <div class="radio-content">
              <strong>{{ $t('transfer.request1.platformToOther') }}</strong>
              <span class="radio-desc">{{ $t('transfer.request1.platformToOtherDesc') }}</span>
            </div>
          </label>
        </div>
      </div>

      <!-- 출발 플랫폼 -->
      <div class="form-group" v-if="form.from_type === 'platform'">
        <label>{{ $t('transfer.request1.fromPlatform') }}</label>
        <select v-model="form.from_platform_id">
          <option v-for="p in platformOptions" :key="p.platform_id" :value="p.platform_id">{{ p.name }}</option>
        </select>
        <input v-model="form.from_platform_user_id" :placeholder="$t('transfer.request1.fromPlatformId')" />
      </div>

      <!-- 도착 플랫폼 -->
      <div class="form-group">
        <label>{{ $t('transfer.request1.toPlatform') }}</label>
        <select v-model="form.to_platform_id">
          <option disabled value="">{{ $t('transfer.request1.toPlatform') }}</option>
          <option value="wallet">{{ $t('transfer.request1.myWallet') }}</option>
          <option v-for="p in platformOptions" :key="p.platform_id" :value="p.platform_id">{{ p.name }}</option>
        </select>
        <input v-model="form.to_platform_user_id" :placeholder="$t('transfer.request1.toPlatformId')" />
      </div>

      <!-- 금액 입력 -->
      <div class="form-group">
        <label>{{ $t('transfer.request1.amount') }} ({{ fromCurrency }})</label>
        <input type="number" v-model.number="form.amount" @input="calculateExpected" />
      </div>

      <!-- 예상 수령 금액 -->
      <div class="form-group" v-if="form.expected_amount > 0">
        <label>{{ $t('transfer.request1.expectedAmount') }} ({{ toCurrency }})</label>
        <div>{{ form.expected_amount.toLocaleString() }} {{ toCurrency }}</div>
      </div>

      <!-- 출금 비밀번호 -->
      <div class="form-group">
        <label>{{ $t('transfer.request1.moneyPassword') }}</label>
        <input type="password" v-model="form.money_password" />
      </div>

      <button class="btn-submit" @click="submit">{{ $t('transfer.request1.submit') }}</button>
      </div>
    </div>
  </UserLayout>
</template>


<script setup>
import UserLayout from '@/components/UserLayout.vue'
import { ref, onMounted, watch, computed } from 'vue'
import axios from '@/axiosUser'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

// ✅ 추가: pending 상태
const hasPending = ref(false)

// (선택) 안 쓰는 변수면 지워도 됨
// const platforms = ref([])

const form = ref({
  from_type: 'wallet',
  from_platform_id: null,
  from_platform_user_id: '',
  to_platform_id: '',
  to_platform_user_id: '',
  amount: 0,
  exchange_rate: 1,
  expected_amount: 0,
  money_password: '',
  memo: '',
})

const platformOptions = ref([])

const getCurrencyByPlatformId = (id) => {
  if (!id || id === 'wallet') return 'USD'
  const p = platformOptions.value.find(p => String(p.platform_id) === String(id))
  return p?.currency || 'USD'
}

const fromCurrency = computed(() => {
  return form.value.from_type === 'wallet'
    ? 'USD'
    : getCurrencyByPlatformId(form.value.from_platform_id)
})
const toCurrency = computed(() => getCurrencyByPlatformId(form.value.to_platform_id))

const fetchPlatformOptions = async () => {
  try {
    const lang = localStorage.getItem('lang') || 'en'
    const res = await axios.get(`/platforms?lang=${lang}`)
    platformOptions.value = res.data
  } catch (err) {
    console.error('Platform list:', err)
  }
}

// ✅ 추가: pending 체크 (전역 차단형)
const checkPending = async () => {
  try {
  const res = await axios.get('/users/me/transactions/pending-check?status=pending');
     console.log('📦 raw res.data:', res.data)
    const arr = Array.isArray(res.data.transactions) ? res.data.transactions : []
    const pendingTypes = [
      'charge', 'withdraw',
      'wallet_to_platform', 'platform_to_wallet', 'platform_to_platform',
      'platform_charge', 'wallet_charge', 'platform_withdraw', 'wallet_withdraw'
    ]
   // hasPending.value = arr.some(tx => pendingTypes.includes(tx.type))
   hasPending.value = arr.some(
      tx => tx.status === 'pending' && pendingTypes.includes(tx.type)
    )
  } catch (e) {
    console.log('axios 에러:', e)
    hasPending.value = false
  }
}

// 계산 결과값이 백엔드에서 한번 더 검증됨. 수정 시 함께 반영할 것.
const calculateExpected = async () => {
  if (!form.value.amount || !form.value.to_platform_id) return

  form.value.exchange_rate = 1
  form.value.expected_amount = form.value.amount

  if (fromCurrency.value && toCurrency.value && fromCurrency.value !== toCurrency.value) {
    try {
      const res = await axios.get(`/exchange-rate?from=${fromCurrency.value}&to=${toCurrency.value}`)
      let rate = res.data.rate
      if (rate == null && res.data.rates) {
        const fromR = res.data.rates[fromCurrency.value]
        const toR   = res.data.rates[toCurrency.value]
        if (!fromR || !toR) throw new Error('지원되지 않는 통화입니다.')
        rate = toR / fromR
      }
      if (!rate) return alert(t('transfer.request1.alert.rateFetchFailed'))

      form.value.exchange_rate = Number(rate.toFixed(6))
      // 수수료 제외 없이 기대값(지금 로직대로면 0% fee)
      form.value.expected_amount = Math.floor(form.value.amount * rate)
    } catch (err) {
      console.error('❌ 환율 요청 실패:', err)
      alert(t('transfer.request1.alert.rateFetchFailed'))
    }
  }
}

watch([
  () => form.value.amount,
  () => form.value.to_platform_id,
  () => form.value.from_platform_id,
  () => form.value.from_type
], calculateExpected)

const submit = async () => {
  // ✅ 제출 직전에도 최신 상태로 재확인 (경쟁 상태 방지)
  await checkPending()
  if (hasPending.value) {
    return alert(t('alert.pendingRequestWithAction'))
  }

  if (!form.value.exchange_rate || !form.value.expected_amount) {
    return alert(t('transfer.request1.alert.rateNotReady'))
  }

  try {
    const res = await axios.post('/transactions/wallet/transfer', form.value)
    alert(res.data.message)
    // 필요하면 새로고침
    window.location.reload()
  } catch (err) {
    alert(err.response?.data?.message || t('transfer.request1.alert.failed'))
  }
}

onMounted(() => {
  fetchPlatformOptions()
  checkPending() // ✅ 페이지 진입 시 체크
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

.transfer-form{
  background-color: #fff;
  max-width: 420px;
  margin: auto;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.04);
  border-radius: 12px;}

.form-group label {
  font-weight: 600;
    margin-bottom: 6px;
    color: #333;
    font-size: 14px;
}

.form-group input[type="radio"] {
  margin-right: 6px;
  accent-color: #007bff; /* 선택된 색상 커스터마이즈 */
}
.form-group{
  margin-bottom: 1.5rem;
    display: flex;
    flex-direction: column;
}

input, select {
  width: 100%;
  padding: 10px;
  margin-bottom:0.4rem ;
}
.btn-submit {
  width: 100%;
  padding: 12px;
  font-size: 14px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}


.radio-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.radio-option {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid #ccc;
  border-radius: 10px;
  transition: border-color 0.2s ease, background-color 0.2s ease;
  background-color: #f9f9f9;
  cursor: pointer;
}
.radio-option:hover,
.radio-option:active {
  border-color: #3b49df;
}
.radio-option.selected {
  background-color: #fff;
  border-color: #3b49df;
}
.radio-option input[type="radio"] {
  margin-top: 4px;
  transform: scale(1.2);
}

.radio-content {
  display: flex;
  flex-direction: column;
}

.radio-desc {
  font-size: 13px;
  color: #666;
  margin-top: 2px;
  font-weight: 400;
}
input[type="radio"] {
  width: auto;
  height: auto;
  margin: 2px 6px 0 0;
  padding: 0;
  transform: scale(1.1);
  vertical-align: middle;
  cursor: pointer;
}
/* 모바일 대응 */
@media (max-width: 480px) {
  .radio-option {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .radio-option input[type="radio"] {
    margin-top: 0;
  }

  .radio-content {
    margin-left: 0;
  }
}
</style>
