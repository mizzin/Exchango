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
        <input   type="text" v-model="form.from_platform_user_id" :placeholder="$t('transfer.request1.fromPlatformId')" />
      </div>

      <!-- 도착 플랫폼 -->
      <div class="form-group">
        <label>{{ $t('transfer.request1.toPlatform') }}</label>
        <select v-model="form.to_platform_id">
          <option disabled value="">{{ $t('transfer.request1.toPlatform') }}</option>
          <option value="wallet">{{ $t('transfer.request1.myWallet') }}</option>
          <option v-for="p in platformOptions" :key="p.platform_id" :value="p.platform_id">{{ p.name }}</option>
        </select>
        <input v-model="form.to_platform_user_id"   type="text" :placeholder="$t('transfer.request1.toPlatformId')" />
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

      <button class="btn-submit" :disabled="isSubmitting" @click="submit">{{ $t('transfer.request1.submit') }}</button>
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
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'


const isSubmitting = ref(false)


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
const canSubmit = computed(() =>
  currency.value && amountUsd.value >= 40
)


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
  if (isSubmitting.value) return
  isSubmitting.value = true

  try {
    await checkPending()
    if (hasPending.value) {
      await Swal.fire({
        icon: 'warning',
        title: t('alert.pendingRequestWithAction'),
        confirmButtonText: 'OK',
        confirmButtonColor: '#0052cc',
      })
      return
    }

    if (!form.value.exchange_rate || !form.value.expected_amount) {
      await Swal.fire({
        icon: 'warning',
        title: t('alert.rateNotReady'),
        confirmButtonText: 'OK',
        confirmButtonColor: '#0052cc',
      })
      return
    }

    await axios.post('/transactions/wallet/transfer', form.value)

    // ✅ 성공 알림
    await Swal.fire({
      icon: 'success',
      title: t('alert.transferSuccess'),
      confirmButtonText: 'OK',
      confirmButtonColor: '#0052cc',
    })

    window.location.reload()

  } catch (err) {
    await Swal.fire({
      icon: 'error',
      title: err.response?.data?.message || t('alert.transferFailed'),
      confirmButtonText: 'OK',
      confirmButtonColor: '#0052cc',
    })
  } finally {
    isSubmitting.value = false
  }
}


onMounted(() => {
  fetchPlatformOptions()
  checkPending() // ✅ 페이지 진입 시 체크
})
onMounted(async () => {
  const res = await axios.get('/users/info')
})
</script>


<style scoped>

/* 💡 전체 폼 박스 */
.transfer-form {
  background-color: #fff;
  max-width: 420px;
  margin: auto;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.04);
  border-radius: 12px;
}


/* 라벨 */
.form-group label {
  font-weight: 600;
  font-size: 0.9rem;
  color: #333;
  margin-bottom: 0.4rem;
}
/* 인풋/셀렉트 */
input[type="text"],
input[type="number"],
input[type="password"],
select {
  width: 100%;
  border: 1.2px solid #dbe1fa;
  border-radius: 14px;
  padding: 0.95rem 1rem;
  font-size: 0.95rem;
  background: #ffffff;
  color: #333;
  outline: none;
  transition: 0.2s;
  box-shadow: 0 2px 5px rgba(0,0,0,0.03);
}

input:focus,
select:focus {
  border-color: #3c5ef0;
  box-shadow: 0 0 0 3px rgba(60,94,240,0.1);
}

::placeholder {
  color: #aaa;
  font-size: 0.9rem;
}

/* select 바로 아래 input 간격 확보 */
select + input {
  margin-top: 0.6rem; /* 살짝 띄워서 시각적으로 여유 줌 */
}
.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

/* 그룹 간격 */
.form-group {
  margin-bottom: 1.1rem;
}

/* 라디오 버튼 그룹 */
.radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

/* 라디오 버튼 카드 */
.radio-option {
  border: 1.6px solid #e4e8ff;
  border-radius: 14px;
  background: #fff;
  padding: 1rem;
  transition: 0.25s ease;
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  cursor: pointer;
}

.radio-option.selected {
  border-color: #3c5ef0;
  background: linear-gradient(180deg, #f6f8ff 0%, #ffffff 100%);
  box-shadow: 0 3px 10px rgba(60, 94, 240, 0.1);
}

.radio-option input[type="radio"] {
  transform: scale(1.2);
  accent-color: #3c5ef0;
}
.radio-content {
    display: flex
;
    flex-direction: column;
}
.radio-content strong {
  font-size: 0.95rem;
  color: #222;
}

.radio-desc {
  font-weight: 400;
  font-size: 0.82rem;
  color: #666;
  margin-top: 0.25rem;
}

/* 버튼 */
.btn-submit {
  background: linear-gradient(90deg, #3c5ef0 0%, #274bdf 100%);
  border: none;
  border-radius: 14px;
  color: #fff;
  width: 100%;
  font-size: 1rem;
  font-weight: 600;
  padding: 0.9rem;
  margin-top: 1.2rem;
  box-shadow: 0 4px 10px rgba(60, 94, 240, 0.25);
  transition: 0.2s ease;
}

.btn-submit:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(60, 94, 240, 0.3);
}


/* 경고 배너 */
.pending-banner {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeeba;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 1.2rem;
}

/* 블러 오버레이 */
.blur-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(255,255,255,0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
  pointer-events: all;
  border-radius: 16px;
}

/* ✅ 모바일 세부 조정 */
@media (max-width: 768px) {
  .transfer-form {
    box-shadow: none;
    border: none;
    padding: 1.2rem;
  }

  .radio-option {
    padding: 0.9rem 0.8rem;
    border-radius: 10px;
  }

  input, select {
    font-size: 0.9rem;
    border-radius: 10px;
  }

  .btn-submit {
    border-radius: 10px;
    font-size: 0.95rem;
    padding: 0.9rem;
  }
}

</style>
