<template>
  <UserLayout>
    <div class="transfer-form">
      <h2>머니 이동 신청</h2>
          <!-- 이동 선택 -->
<div class="form-group">
  <label class="form-label">이동 유형 선택</label>
  <div class="radio-group">
      <label
        class="radio-option"
        :class="{ selected: form.from_type === 'wallet' }"
      >
        <input type="radio" value="wallet" v-model="form.from_type" />
        <div class="radio-content">
          <strong>지갑 → 플랫폼</strong>
          <span class="radio-desc">내 지갑에서 외부 플랫폼으로 머니 전송</span>
        </div>
      </label>

        <label
          class="radio-option"
          :class="{ selected: form.from_type === 'platform' }"
        >
          <input type="radio" value="platform" v-model="form.from_type" />
          <div class="radio-content">
            <strong>플랫폼 → 플랫폼 / 지갑</strong>
            <span class="radio-desc">플랫폼 간 이동 또는 플랫폼에서 내 지갑으로 전송</span>
          </div>
        </label>
      </div>
    </div>

      <!-- 출발 플랫폼 정보 -->
      <div class="form-group" v-if="form.from_type === 'platform'">
        <label>출발 플랫폼</label>
        <select v-model="form.from_platform_id">
          <option v-for="p in platformOptions" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
        <input v-model="form.from_platform_user_id" placeholder="출발 플랫폼 ID" />
      </div>


      <!-- 도착 플랫폼 정보 -->
      <div class="form-group">
        <label>도착 플랫폼</label>
        <select v-model="form.to_platform_id">
        <option disabled value="">도착 플랫폼 </option>
         <option value="wallet">내 지갑</option> 
        <option
          v-for="p in platformOptions"
          :key="p.id"
          :value="p.id"
        >
          {{ p.name }}
        </option>
      </select>

        <input v-model="form.to_platform_user_id" placeholder="도착 플랫폼 ID" />
      </div>

      <!-- 금액 입력 -->
      <div class="form-group">
        <label>이동 금액 ({{ fromCurrency }})</label>
        <input type="number" v-model.number="form.amount" @input="calculateExpected" />
      </div>

      <!-- 예상 수령 금액 -->
      <div class="form-group" v-if="form.expected_amount > 0">
        <label>예상 수령 금액 ({{ toCurrency }})</label>
        <div>{{ form.expected_amount.toLocaleString() }} {{ toCurrency }}</div>
        <small>적용 환율: 1 {{ fromCurrency }} → {{ form.exchange_rate }} {{ toCurrency }} (수수료 2%)</small>

      </div>

      <!-- 출금 비밀번호 -->
      <div class="form-group">
        <label>출금 비밀번호</label>
        <input type="password" v-model="form.money_password" />
      </div>

      <button class="btn-submit" @click="submit">신청하기</button>
    </div>
  </UserLayout>
</template>

<script setup>
import UserLayout from '@/components/UserLayout.vue'
import { ref, onMounted, watch, computed  } from 'vue'
import axios from '@/axiosUser'

const platforms = ref([])
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
const fromCurrency = computed(() => {
  return form.value.from_type === 'wallet'
    ? 'USD'
    : getCurrencyByPlatformId(form.value.from_platform_id)
})

const toCurrency = computed(() => {
  return form.value.to_platform_id === 'wallet'
    ? 'USD'
    : getCurrencyByPlatformId(form.value.to_platform_id)
})

const platformOptions = ref([])

const fetchPlatformOptions   = async () => {
  try {
    const lang = localStorage.getItem('lang') || 'en'
    const res = await axios.get(`/api/platforms?lang=${lang}`)
    platformOptions.value = res.data
  } catch (err) {
    console.error('플랫폼 목록 로딩 실패:', err)
  }
}
const getCurrencyByPlatformId = (id) => {
  const p = platformOptions.value.find(p => p.id === id)
  return p?.currency || 'USD'
}
//계산 결과값이 벡엔드에서 한번더 검증함. 수정시 함께 해야함.
const calculateExpected = async () => {
  if (!form.value.amount || !form.value.to_platform_id) return

  form.value.exchange_rate = 1
  form.value.expected_amount = form.value.amount

  if (fromCurrency.value !== toCurrency.value) {
    try {
      const res = await axios.get(`/api/exchange-rate?from=${fromCurrency.value}&to=${toCurrency.value}`)
      const rate = res.data.rate
      form.value.exchange_rate = rate
      form.value.expected_amount = Math.floor(form.value.amount * rate * 0.98)
    } catch (err) {
      console.error('환율 가져오기 실패:', err)
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
  try {
    console.log(JSON.stringify(form.value, null, 2))

    const res = await axios.post('/api/transactions/wallet/transfer', form.value)
    
    alert(res.data.message)
  } catch (err) {
    alert(err.response?.data?.message || '신청 실패')
  }
}

onMounted(fetchPlatformOptions)
</script>

<style scoped>

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
