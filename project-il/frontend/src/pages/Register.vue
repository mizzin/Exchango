
<script setup>
import UserLayout from '@/components/UserLayout.vue'   
import '@/assets/style.css' 
import { reactive, ref, computed,onMounted, onUnmounted  } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/axiosUser'
import { useI18n } from 'vue-i18n'

const showCodeInput = ref(false)
const verificationCode = ref('')
const countdown = ref(180) // 180초 = 3분
const timer = ref(null)

const { t } = useI18n()

const router = useRouter()

const form = reactive({
  username: '',
  password: '',
  real_name: '',
  email: '',
  phone: '',
  referral_id: '',
  money_password: '', 
  platforms: [{ platform_id: '', platform_user_id: '' }],
    language: localStorage.getItem('lang') || 'en'
})

const confirmPassword = ref('')
const passwordMismatch = computed(() => confirmPassword.value && confirmPassword.value !== form.password)

const platformOptions = ref([])

const fetchPlatformOptions = async () => {
  try {
    const lang = localStorage.getItem('lang') || 'en'
    const res = await axios.get(`/platforms?lang=${lang}`)
    platformOptions.value = res.data // [{ id: '001', name: 'A플랫폼' }, ...]
  } catch (err) {
    console.error('플랫폼 목록 로딩 실패:', err)
  }
}

onMounted(fetchPlatformOptions)

const emailSent = ref(false)


const sendVerificationCode = async () => {
  if (!form.email) {
    alert(t('register.alert.enterCodeAlert'))
    return
  }

  try {
    await axios.post('/auth/send-email-code', { 
      email: form.email,
    lang: localStorage.getItem('lang') || 'en'
   })

    // 코드 입력창 보여주기
    showCodeInput.value = true
    verificationCode.value = ''

    // 타이머 시작
    countdown.value = 180
    clearInterval(timer.value)
    timer.value = setInterval(() => {
      if (countdown.value > 0) {
        countdown.value--
      } else {
        clearInterval(timer.value)
      }
    }, 1000)
  } catch (err) {
    alert(t('register.alert.sendEmailFailed'))
  }
}
const verifyEmailCode = async () => {
  if (!verificationCode.value) {
    alert(t('register.alert.enterCode'))
    return
  }

  try {
    const res = await axios.post('/auth/verify-email-code', {
      email: form.email,
      code: verificationCode.value
    })

    alert(t('register.alert.emailVerified'))
    clearInterval(timer.value)
  } catch (err) {
    alert(err.response?.data?.message || t('register.alert.verificationFailed'))
  }
}

const addPlatform = () => {
  const lastIndex = form.platforms.length - 1
  const lastPlatform = form.platforms[lastIndex]

  if (!lastPlatform.platform_id) {
    alert(t('register.alert.selectPlatformFirst'))
    return
  }

  // 현재 입력 중인 마지막 항목을 제외한 기존 항목들과 중복 검사
  const otherIds = form.platforms.slice(0, lastIndex).map(p => p.platform_id)

  if (otherIds.includes(lastPlatform.platform_id)) {
    alert(t('register.alert.noDuplicatePlatform'))
    return
  }

  if (form.platforms.length < 4) {
    form.platforms.push({ platform_id: '', platform_user_id: '' })
  }
}

const removePlatform = (index) => {
  form.platforms.splice(index, 1)
}


 const handleRegister = async () => {
  form.language = localStorage.getItem('lang') || 'en'

  // ✅ 기본 필수 항목 입력 확인
  if (!form.username || !form.password || !confirmPassword.value || !form.money_password || !form.phone || !form.email) {
    alert(t('register.alert.fillAllRequiredFields')) // 다국어 메시지로 "모든 필수 항목을 입력해 주세요"
    return
  }

  if (!usernameChecked.value) {
    alert(t('register.alert.checkUsernameFirst')) // 아이디 중복체크 요구
    return
  }

  if (passwordMismatch.value) {
    alert(t('register.alert.passwordMismatch'))
    return
  }

  if (!/^\d{6}$/.test(form.money_password)) {
    alert(t('register.alert.invalidMoneyPassword'))
    return
  }


  const platformIds = form.platforms.map(p => p.platform_id)

  const hasDuplicatePlatform = new Set(platformIds).size !== platformIds.length
  if (hasDuplicatePlatform) {
    alert(t('register.alert.noDuplicatePlatform'))
    return
  }
const cleanPlatforms = form.platforms.filter(
  p => p.platform_id && p.platform_user_id
)
  // 변환된 플랫폼을 포함한 새 객체로 전송
const payload = {
  ...form,
  platforms: cleanPlatforms
}
console.log('회원가입 payload:', payload) 

  try {
    await axios.post('/users/register', payload)
    alert(t('register.alert.registrationSuccess'))
    router.push('/')
  } catch (err) {
    alert(err.response?.data?.message ||t('register.alert.registrationFail'))
  }
}

const username = ref('')
const recommender = ref('')
const platformIds = ref([''])

const onlyAlphanumeric = (fieldRef) => {
  fieldRef.value = fieldRef.value.replace(/[^a-zA-Z0-9]/g, '')
}

const usernameCheckMessage = ref('')
const usernameChecked = ref(false)

const checkUsername = async () => {
  usernameCheckMessage.value = ''
  usernameChecked.value = false

  if (!form.username) {
    alert(t('register.alert.enterUsername'))
    return
  }

  try {
    const res = await axios.post('/users/check-username', {
      username: form.username
    })

    if (res.data.available) {
      usernameCheckMessage.value = t('register.alert.usernameAvailable')
      usernameChecked.value = true
    } else {
      usernameCheckMessage.value = t('register.alert.usernameTaken')
    }
  } catch (err) {
    usernameCheckMessage.value = t('register.alert.checkError')
  }
}
onUnmounted(() => {
  clearInterval(timer.value)
})
const goToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <UserLayout>
  <div class="register-container">
    <h2>{{ $t('register.title') }}</h2>
    <form @submit.prevent="handleRegister">
      <!-- Username -->
      <label>{{ $t('register.username') }}</label>
      <div class="platform-row">
        <input
          v-model="form.username"
          @input="form.username = form.username.replace(/[^a-zA-Z0-9]/g, '')"
          :placeholder="$t('register.usernamePlaceholder')"
          required
        />
        <button type="button" class="btn-primary btn-sm" @click="checkUsername">
          {{ $t('register.checkAvailability') }}
        </button>
      </div>
      <p v-if="usernameCheckMessage"
         :style="{ color: usernameChecked ? 'green' : 'red', fontSize: '0.9em', marginTop: '5px' }">
        {{ usernameCheckMessage }}
      </p>

      <!-- Password -->
      <label>{{ $t('register.password') }}</label>
      <input
        type="password"
        v-model="form.password"
        :placeholder="$t('register.passwordPlaceholder')"
        required
      />

      <!-- Confirm Password -->
      <label>{{ $t('register.confirmPassword') }}</label>
      <input
        type="password"
        v-model="confirmPassword"
        :placeholder="$t('register.passwordPlaceholder')"
        required
      />
      <p v-if="passwordMismatch" class="error">{{ $t('register.passwordMismatch') }}</p>

      <!-- Money Password (6-digit PIN) -->
      <label>{{ $t('register.moneyPassword') }}</label>
      <input
        type="password"
        v-model="form.money_password"
        :placeholder="$t('register.moneyPasswordPlaceholder')"
        maxlength="6"
        inputmode="numeric"
        pattern="\d*"
        required
      />

     
      <!-- Full Name0630 -->
      <label>{{ $t('register.realName') }}</label>
      <input v-model="form.real_name" :placeholder="$t('register.realName')" />


      <!-- Phone -->
      <label>{{ $t('register.phone') }}</label>
      <div class="platform-row">
        <input v-model="form.phone" :placeholder="$t('register.phone')" required />
      </div>
      <!-- Email -->
       <div class="form-item ">
      <label>{{ $t('register.email') }}</label>
      <small class="form-note warning">{{ $t('register.emailNote') }}</small>
      <input
        v-model="form.email"
        type="email"
        :placeholder="$t('register.emailPlaceholder')"
        required
      />
      </div>
      <!-- 이메일 인증 요청 버튼 -->
      <div class="email-send-wrapper">
        <button type="button" class="btn-primary btn-sm" @click="sendVerificationCode">
          {{ $t('register.sendEmailCode') }}
        </button>
      </div>

      <!-- 인증 코드 입력창 -->
    <div v-if="showCodeInput" class="email-verification-section">
      <label>{{ $t('register.enterCodeLabel') }}</label>
      <input v-model="verificationCode" type="text" placeholder="123456" />

      <div class="timer">
        {{ Math.floor(countdown / 60).toString().padStart(2, '0') }}:
        {{ (countdown % 60).toString().padStart(2, '0') }}
      </div>

      <button type="button" class="btn-dark btn-sm" @click="verifyEmailCode">
        {{ $t('register.verifyCode') }}
      </button>
    </div>

      <!-- Referral -->
      <label>{{ $t('register.referral') }}</label>
      <input
        v-model="form.referral_id"
        @input="form.referral_id = form.referral_id.replace(/[^a-zA-Z0-9]/g, '')"
        :placeholder="$t('register.referral')"
      />


      <!-- Platform -->
      <label>{{ $t('register.platform') }}</label>
      <div v-for="(platform, index) in form.platforms" :key="index" class="platform-row">
        <select v-model="platform.platform_id">
          <option disabled value="">{{ $t('register.platform') }}</option>
          <option v-for="opt in platformOptions" :key="opt.id" :value="opt.id">
            {{ opt.name }}
          </option>
        </select>
        <input
          v-model="platform.platform_user_id"
          @input="platform.platform_user_id = platform.platform_user_id.replace(/[^a-zA-Z0-9]/g, '')"
          :placeholder="$t('register.usernamePlaceholder')"
        />
        <button
          v-if="index === form.platforms.length - 1"
          type="button"
          class="btn-primary btn-sm"
          @click="addPlatform"
          :disabled="form.platforms.length >= 4"
        >{{ $t('register.addPlatform') }}</button>
        <button
          type="button"
          class="btn-dark btn-sm"
          @click="removePlatform(index)"
          v-if="form.platforms.length > 1"
        >{{ $t('register.removePlatform') }}</button>
      </div>

      <!-- Submit -->
      <div class="button-group">
        <button type="button" class="btn-primary full" @click="handleRegister">{{ $t('register.submit') }}</button>
        <button type="button" class="btn-secondary full" @click="goToLogin">{{ $t('register.login') }}</button>
      </div>
    </form>
  </div>
</UserLayout>
</template>

<style scoped>
.button-group {
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: 0px;
}
.form-note {
  font-size: 0.75rem;
  color: #cc3300 ;
  margin-top: 2px;
}
.form-item {
  display: flex;
  flex-direction: column;
}
.form-item label {
  font-weight: 500;
}
.form-note.warning {
  font-size: 0.75rem;
  color: #cc3300; /* 은은한 레드 */
  margin-bottom: 0.3rem;
  font-weight: 500;
}
.btn-primary.full,
.btn-secondary.full {
  width: 48%;
  /*max-width: 300px;  필요하면 조정 가능 */
  padding: 12px 0;
  font-size: 16px;
  border-radius: 6px;
  text-align: center;
}
.register-container {
  max-width: 420px;
  margin: 40px auto;
  padding: 30px;
  background: #f4f6ff;
  border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.04);
  border-radius: 12px;
}
label {
  display: block;
  margin-top: 0.7rem;
  font-weight: 500;
  font-size: 14px;
  color: #555555;
}
input, select {
  outline: none;        
  border: 1px solid #ccc;
  padding: 10px;
  width: 70%;
  border-radius: 6px;
  box-sizing: border-box;
}
input:focus, button:focus {
  border-color: #6488fa;
  box-shadow: 0 0 0 2px rgba(100, 136, 250, 0.2); /* 예쁜 포커스 효과 */
  outline: none;
}
.platform-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}
.error {
  color: red;
  font-size: 0.9em;
  margin-top: 5px;
}
.email-verification-section {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f3f6fd;
  border: 1px solid #d0d7e4;
  border-radius: 8px;
  max-width: 400px;
}

.email-verification-section label {
  display: block;
  margin-bottom: 0.4rem;
  font-weight: 600;
}

.email-verification-section input[type="text"] {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-bottom: 0.6rem;
  font-size: 14px;
}

.email-verification-section .timer {
  margin-bottom: 0.8rem;
  font-weight: bold;
  font-size: 14px;
  color: #333;
}

.email-verification-section .btn-dark.btn-sm {
  background-color: #004085;
  color: white;
  padding: 6px 12px;
  font-size: 14px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.email-verification-section .btn-dark.btn-sm:hover {
  background-color: #003067;
}
.email-send-wrapper {
  margin-top: 8px;
  margin-bottom: 16px;
}

.email-send-wrapper button {
  width: 100%;
  max-width: 200px;
}
.btn-primary {
  background-color: #2563eb;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: bold;
  transition: 0.3s ease;
}
.btn-primary:hover {
  background-color: #1e40af;
}

.btn-secondary {
  background-color: #f1f5f9;
  color: #334155;
  border: 1px solid #cbd5e1;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  margin-left: 10px;
  transition: 0.3s ease;
}
.btn-secondary:hover {
  background-color: #e2e8f0;
}

</style>
