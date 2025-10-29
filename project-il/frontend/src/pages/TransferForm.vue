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
        <div v-if="hasPending" class="blur-overlay"></div>

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
            <option disabled value="">{{ $t('mypage.platformName') }}</option>
            <option
              v-for="p in fromSelectablePlatforms"
              :key="p.id"
              :value="String(p.id)"
            >
              {{ p.name }}
            </option>
          </select>

          <input class="id_input"
            type="text"
            v-model="form.from_platform_user_id"
            :placeholder="$t('transfer.request1.fromPlatformId')"
            readonly
          />

          <p
            v-if="fromPlatformNotice"
            class="form-hint text-red-500 text-sm mt-1"
            v-html="fromPlatformNotice"
          ></p>
        </div>
        <!-- 도착 플랫폼 -->
        <div class="form-group">
          <label>{{ $t('transfer.request1.toPlatform') }}</label>
          <select v-model="form.to_platform_id">
            <option disabled value="">{{ $t('mypage.platformName') }}</option>
            <option
              v-for="p in toSelectablePlatforms"
              :key="p.id"
              :value="String(p.id)"
            >
              {{ p.name }}
            </option>
          </select>

          <input class="id_input"
            v-model="form.to_platform_user_id"
            type="text"
            :placeholder="$t('transfer.request1.toPlatformId')"
            readonly
          />

          <p
            v-if="toPlatformNotice"
            class="form-hint text-red-500 text-sm mt-1"
            v-html="toPlatformNotice"
          ></p>
        </div>

        <!-- 금액 입력 -->
        <div class="form-group">
          <label>{{ $t('transfer.request1.amount') }} ({{ fromCurrency }})</label>
          <input type="number" v-model.number="form.amount"  @input="onAmountInput" />
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

        <button class="btn-submit" :disabled="isSubmitting" @click="submit">
          {{ $t('transfer.request1.submit') }}
        </button>
      </div>
    </div>
  </UserLayout>
</template>

<script setup>
import UserLayout from '@/components/UserLayout.vue'
import { reactive, ref, onMounted, watch, computed } from 'vue'
import axios from '@/axiosUser'
import { useI18n } from 'vue-i18n'
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'

const { t } = useI18n()

// ✅ 반응형 객체
const form = reactive({
  from_type: 'wallet',
  from_platform_id: '',
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
const registeredPlatforms = ref([])

const fromPlatformNotice = ref('')
const toPlatformNotice = ref('')
const isSubmitting = ref(false)
const hasPending = ref(false)
const userInfo = ref(null)


// ✅ 통화 정보 계산
const getCurrencyByPlatformId = (id) => {
  if (!id || id === 'wallet') return 'USD'
  const p = platformOptions.value.find(p => String(p.platform_id) === String(id))
  return p?.currency || 'USD'
}
const onAmountInput = () => {
  form.amount = Math.floor(form.amount || 0) // 소수점 제거
  calculateExpected()                        // 정수값으로 다시 계산
}
const fromCurrency = computed(() =>
  form.from_type === 'wallet' ? 'USD' : getCurrencyByPlatformId(form.from_platform_id)
)
const toCurrency = computed(() => getCurrencyByPlatformId(form.to_platform_id))


// ✅ 플랫폼 목록 (사용자 등록 기준)
const fetchUserPlatforms = async () => {
  try {
    const lang = localStorage.getItem('lang') || 'en'
    const res = await axios.get(`/users/info?lang=${lang}`)
    registeredPlatforms.value = res.data.platforms || []
    userInfo.value = res.data  // ✅ 사용자 정보 저장
  } catch (err) {
    console.error('❌ 사용자 플랫폼 조회 실패:', err)
  }
}


// ✅ pending 체크
const checkPending = async () => {
  try {
    const res = await axios.get('/users/me/transactions/pending-check?status=pending')
    const arr = Array.isArray(res.data.transactions) ? res.data.transactions : []
    const pendingTypes = [
      'charge', 'withdraw',
      'wallet_to_platform', 'platform_to_wallet', 'platform_to_platform',
      'platform_charge', 'wallet_charge', 'platform_withdraw', 'wallet_withdraw',
    ]
    hasPending.value = arr.some(tx => tx.status === 'pending' && pendingTypes.includes(tx.type))
  } catch (e) {
    console.log('axios 에러:', e)
    hasPending.value = false
  }
}
const fetchPlatformOptions = async () => {
  try {
    const lang = localStorage.getItem('lang') || 'en'
    
    const res = await axios.get(`/platforms/public?lang=${lang}`)
    
    platformOptions.value = Array.isArray(res.data) ? res.data : []
  } catch (err) {
    console.error('❌ 플랫폼 목록 불러오기 실패:', err)
  }
}

// ✅ 출발용 목록 (내지갑 제외)
const fromSelectablePlatforms = computed(() => {
  return platformOptions.value.filter(p => p.id !== 'wallet')
})

// ✅ 도착용 목록 (내지갑 포함)
const toSelectablePlatforms = computed(() => {
  const wallet = { id: 'wallet', name: t('transfer.request1.myWallet') }
  return [wallet, ...platformOptions.value]
})

// ✅ 출발 플랫폼 선택 시 자동 닉네임 입력
watch(() => form.from_platform_id, (newVal) => {

  if (!newVal || newVal === 'wallet') {
    form.from_platform_user_id = ''
    fromPlatformNotice.value = ''
    return
  }

  // ✅ 등록된 플랫폼 목록에서 매칭
  const match = registeredPlatforms.value.find(p => String(p.platform_id) === String(newVal))

  if (match && match.platform_user_id) {
    form.from_platform_user_id = match.platform_user_id
    fromPlatformNotice.value = ''
  } else {
    // 등록 안 된 경우
    form.from_platform_user_id = ''
    fromPlatformNotice.value = `
      ${t('transfer.request1.noRegisteredId')}
      <a href="/mypage" class="underline text-blue-500 hover:text-blue-700">
        ${t('transfer.request1.goToMypage')}
      </a>
    `
  }
})


// ✅ 도착 플랫폼 선택 시 자동 닉네임 입력
watch(() => form.to_platform_id, (newVal) => {

  if (!newVal) {
    form.to_platform_user_id = ''
    toPlatformNotice.value = ''
    return
  }

  if (newVal === 'wallet') {
    form.to_platform_user_id = userInfo.value?.username || ''
    toPlatformNotice.value = ''
    return
  }

  const match = registeredPlatforms.value.find(p => String(p.platform_id) === String(newVal))

  if (match && match.platform_user_id) {
    form.to_platform_user_id = match.platform_user_id
    toPlatformNotice.value = ''
  } else {
    form.to_platform_user_id = ''
    toPlatformNotice.value = `
      ${t('transfer.request1.noRegisteredId')}
      <a href="/mypage" class="underline text-blue-500 hover:text-blue-700">
        ${t('transfer.request1.goToMypage')}
      </a>
    `
  }
})

// ✅ 금액 계산
const calculateExpected = async () => {
  if (!form.amount || !form.to_platform_id) return
  form.exchange_rate = 1
  form.expected_amount = form.amount

  if (fromCurrency.value && toCurrency.value && fromCurrency.value !== toCurrency.value) {
    try {
      const res = await axios.get(`/exchange-rate?from=${fromCurrency.value}&to=${toCurrency.value}`)
      let rate = res.data.rate
      if (rate == null && res.data.rates) {
        const fromR = res.data.rates[fromCurrency.value]
        const toR = res.data.rates[toCurrency.value]
        if (!fromR || !toR) throw new Error('지원되지 않는 통화입니다.')
        rate = toR / fromR
      }
      form.exchange_rate = Number(rate.toFixed(6))
      form.expected_amount = Math.floor(form.amount * rate)
    } catch (err) {
      console.error('❌ 환율 요청 실패:', err)
      alert(t('transfer.request1.alert.rateFetchFailed'))
    }
  }
}

watch([() => form.amount, () => form.to_platform_id, () => form.from_platform_id, () => form.from_type], calculateExpected)
// ✅ 머니이동 신청
const submit = async () => {

  if (isSubmitting.value) return
  isSubmitting.value = true

  try {
    // 유효성 검사
    if (!form.from_platform_id && form.from_type === 'platform') {
      Swal.fire({
        icon: 'warning',
        title: 'Need Info',
      text: 'Pick where you send from.',
      })
      return
    }

    if (!form.to_platform_id) {
      Swal.fire({
        icon: 'warning',
        title: 'Need Info',
      text: 'Pick where you send to.',
      })
      return
    }

    if (!form.amount || form.amount <= 0) {
      Swal.fire({
        icon: 'warning',
            title: 'Wrong Number',
      text: 'Type how much you send.',
      })
      return
    }

    if (!form.money_password) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Password',
      text: 'Type your 6 number password.',
      })
      return
    }
if (
  form.from_type === 'platform' &&
  form.from_platform_id &&
  form.to_platform_id &&
  form.from_platform_id === form.to_platform_id
) {
  Swal.fire({
    icon: 'warning',
    title: 'Invalid Request',
    text: 'You cannot transfer between the same platform.',
  })
  return
}
    // ✅ 실제 요청
    const res = await axios.post('/transactions/wallet/transfer', form)

    Swal.fire({
      icon: 'success',
      title: 'success',
      confirmButtonText: 'OK',
    }).then(() => {
  // ✅ SweetAlert 닫힌 후 새로고침
  window.location.reload()
})

    // 폼 초기화
    Object.assign(form, {
      from_platform_id: '',
      from_platform_user_id: '',
      to_platform_id: '',
      to_platform_user_id: '',
      amount: 0,
      expected_amount: 0,
      money_password: '',
      memo: '',
    })
  } catch (err) {
    console.error('❌ 전송 실패:', err)
    Swal.fire({
      icon: 'error',
      title: 'error',
      confirmButtonText: 'OK',
    })
  } finally {
    isSubmitting.value = false
  }
}

onMounted(async () => {
  await fetchPlatformOptions()
  await fetchUserPlatforms()
  await checkPending()
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
  border-radius: 10px;
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
.id_input{
  background-color: #eff3f5 !important;
}
.id_input input:focus{
    border-color: #eff3f5 !important;
  box-shadow: none !important;
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
