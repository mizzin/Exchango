
<script setup>
import UserLayout from '@/components/UserLayout.vue'   
import '@/assets/style.css' 
import { reactive, ref, computed,onMounted  } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/axiosUser'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const router = useRouter()

const form = reactive({
  username: '',
  password: '',
  real_name: '',
  phone: '',
  referral_id: '',
  bank_name: '',
  bank_account: '',
  platforms: [{ platform_id: '', platform_user_id: '' }]
})

const confirmPassword = ref('')
const showVerificationInput = ref(false)
const verificationCode = ref('')
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
  if (passwordMismatch.value) {
    alert(t('register.alert.passwordMismatch'))
    return
  }

  for (const p of form.platforms) {
    if (!p.platform_id || !p.platform_user_id) {
      alert(t('register.alert.enterAllPlatformInfo'))
      return
    }
  }

  const platformIds = form.platforms.map(p => p.platform_id)

  const hasDuplicatePlatform = new Set(platformIds).size !== platformIds.length
  if (hasDuplicatePlatform) {
    alert(t('register.alert.noDuplicatePlatform'))
    return
  }

  // 변환된 플랫폼을 포함한 새 객체로 전송
const payload = {
  ...form,
  platforms: form.platforms.map(p => ({
    platform_id: p.platform_id,
    platform_user_id: p.platform_user_id
  }))
}
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

      <!-- Full Name -->
      <label>{{ $t('register.realName') }}</label>
      <input v-model="form.real_name" :placeholder="$t('register.realName')" required />

      <!-- Phone -->
      <label>{{ $t('register.phone') }}</label>
      <div class="platform-row">
        <input v-model="form.phone" :placeholder="$t('register.phone')" required />
        <!--  <button type="button" class="btn-primary btn-sm" @click="showVerificationInput = true">
          {{ $t('register.verifyCode') }}
        </button>-->
      </div>

      <!-- Verification -->
      <div v-if="showVerificationInput">
        <input v-model="verificationCode" :placeholder="$t('register.codePlaceholder')" />
        <p v-if="verificationCode !== '1234'" class="error">
          {{ $t('register.codeInvalid') }}
        </p>
      </div>

      <!-- Referral -->
      <label>{{ $t('register.referral') }}</label>
      <input
        v-model="form.referral_id"
        @input="form.referral_id = form.referral_id.replace(/[^a-zA-Z0-9]/g, '')"
        :placeholder="$t('register.referral')"
      />

      <!-- Bank Info -->
      <label>{{ $t('register.bankName') }}</label>
      <input v-model="form.bank_name" :placeholder="$t('register.bankName')" />

      <label>{{ $t('register.bankAccount') }}</label>
      <input v-model="form.bank_account" :placeholder="$t('register.bankAccount')" />

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
      <button type="submit" class="btn-primary btn-lg mt-4">{{ $t('register.submit') }}</button>
    </form>
    <button type="button" class="btn-dark btn-lg mt-4" @click="goToLogin">{{ $t('register.login') }}</button>
  </div>
</UserLayout>
</template>

<style scoped>
.register-container {
  max-width: 400px;
  margin: 40px auto;
  padding: 30px;
  background: #f4f6ff;
  border-radius: 12px;
}
label {
  display: block;
  margin-top: 15px;
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
</style>
