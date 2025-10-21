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
        <!-- ✅ 선택한 통화의 입금 주소 표시 -->
        <div v-if="depositAddress" class="form-group deposit-address-box">
          <label>{{ $t('charge.wallet.depositAddress') }}</label>
          <div class="address-row">
            <input type="text" :value="depositAddress" readonly class="readonly-input" />
            <button type="button" @click="copyAddress" class="btn-copy">복사</button>
          </div>
          <p class="note">
            {{t('charge.wallet.note')}}
          </p>
        </div>

      <button class="btn-submit" :disabled="!canSubmit|| isSubmitting" @click="submit">{{ $t('charge.wallet.submit') }}</button>
    </div>
    </div>
  </UserLayout>
</template>


<script setup>
import { reactive, computed, ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import UserLayout from '@/components/UserLayout.vue'
import axiosUser  from '@/axiosUser'
import { useI18n } from 'vue-i18n'
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'
const depositAddress = ref('')

const hasPending = ref(false)
const { t } = useI18n()

const router = useRouter()

const currency = ref('')
const localAmount = ref(0)
const exchangeRate = ref(0)
const usdAmount = ref(0)
const amountUsd = ref(0) // 사용자가 입력할 USD

const isSubmitting = ref(false)


// 🔹 환율 불러오기
const fetchExchangeRate = async () => {
  try {
    const res = await axiosUser.get('/exchange-rate')
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

const submit = async () => {
  if (isSubmitting.value) return
  isSubmitting.value = true

  try {
    const token = localStorage.getItem('user_token')
    if (!token) return

    // ✅ 유저 정보 확인 (버튼 클릭 시 체크)
    const res = await axiosUser.get('/users/info')
    const user = res.data

    const hasBankInfo = user.bank_name && user.bank_account
    const hasWallet = user.wallet_address
    const hasPesoAccount = user.peso_account_type && user.peso_account

    // ✅ 셋 다 없으면 팝업 띄우고 종료
    if (!hasBankInfo && !hasWallet && !hasPesoAccount) {
      await Swal.fire({
        title: t('charge.wallet.title1'),
        text: t('charge.wallet.text'),
        icon: 'info',
        confirmButtonText: t('charge.wallet.confirmButtonText'),
        confirmButtonColor: '#0052cc'
      })
      isSubmitting.value = false
      return
    }

    // ✅ 정상 충전 요청
    await axiosUser.post('/transactions/wallet/charge', {
      currency: currency.value,
      local_amount: sendAmountWithFee.value,
      amount_usd: amountUsd.value,
      expected_amount: sendAmountWithFee.value,
    })
router.push('/mypage')
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: t('charge.wallet.success'),
      confirmButtonText: 'OK',
      confirmButtonColor: '#0052cc',
    })

    currency.value = ''
    localAmount.value = 0
    usdAmount.value = 0

  } catch (e) {
    console.error(e)
    alert(t('charge.wallet.failed'))
  } finally {
    isSubmitting.value = false
  }
}


// 🔹 선택한 통화의 입금 주소 불러오기
const fetchDepositAddress = async () => {
  if (!currency.value) return
  try {
    const res = await axiosUser.get(`/deposit-addresses/${currency.value}`)
    depositAddress.value = res.data.address || ''
  } catch (err) {
    console.warn('❌ 입금주소 없음:', err)
    depositAddress.value = ''
  }
}

// 통화 바뀔 때마다 주소 다시 가져오기
watch(currency, (newVal) => {
  if (newVal) fetchDepositAddress()
})

const copyAddress = async () => {
  try {
    await navigator.clipboard.writeText(depositAddress.value)
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Address copied!',
      showConfirmButton: false,
      timer: 1500,
    })
  } catch (err) {
    alert('Copy failed. Please copy it manually.')
  }
}

// 🔹 진행중 신청 확인
const checkPending = async () => {
  try {
    const res = await axiosUser.get('/users/me/transactions/pending-check?status=pending')
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
  padding: 2rem 1rem;
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
.deposit-address-box {
  margin-top: 15px;
  background: #f9fbff;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #d0d7e2;
}

.address-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn-copy {
  background: #0052cc;
  color: #fff;
  border: none;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-copy:hover {
  opacity: 0.85;
}

.note {
  font-size: 0.85rem;
  color: #b02a37;
  margin-top: 6px;
  line-height: 1.4;
}
</style>