<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import axios from '@/axiosUser'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const token = ref('')
const valid = ref(false)
const loading = ref(true)
const pw1 = ref('')
const pw2 = ref('')

onMounted(async () => {
  token.value = route.query.token?.toString() || ''
  if (!token.value) {
    alert(t('reset.invalidAccess'))
    return router.replace('/login')
  }
  try {
    const { data } = await axios.get('/auth/reset', { params: { token: token.value } })
    valid.value = !!data.valid
  } catch (e) {
    valid.value = false
  } finally {
    loading.value = false
  }
})

const submit = async () => {
  if (!pw1.value || pw1.value.length < 8) {
    return alert(t('reset.minLength'))
  }
  if (pw1.value !== pw2.value) {
    return alert(t('reset.mismatch'))
  }
  try {
    await axios.post('/auth/reset', { token: token.value, newPassword: pw1.value })
    alert(t('reset.success'))
    router.replace('/login')
  } catch (e) {
    alert(e.response?.data?.message || t('reset.failed'))
  }
}
</script>

<template>
  <div class="wrap">
    <div class="card">
      <h2>{{ t('reset.changeButton') }}</h2>

      <div v-if="loading">{{ t('reset.verifying') }}</div>
      <div v-else-if="!valid">
        <p>{{ t('reset.tokenExpired') }}</p>
        <a href="/login">{{ t('reset.backToLogin') }}</a>
      </div>
      <div v-else>
        <label>{{ t('reset.newPassword') }}</label>
        <input type="password" v-model="pw1" :placeholder="t('reset.placeholderMin')" />
        <label>{{ t('reset.confirmPassword') }}</label>
        <input type="password" v-model="pw2" :placeholder="t('reset.placeholderConfirm')" />
        <button class="btn-primary" @click="submit">{{ t('reset.changeButton') }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wrap { min-height: 60vh; display: grid; place-items: center; padding: 24px; }
.card {
  width: 100%; max-width: 420px; background: #fff; border-radius: 14px; padding: 24px;
  box-shadow: 0 12px 32px rgba(0,0,0,.08);
}
label { display:block; margin-top: 14px; }
input {
  outline: none; border: 1px solid #ccc; padding: 10px; width: 100%;
  border-radius: 6px; box-sizing: border-box; margin-bottom: 10px;
}
button { width:100%; padding: 10px; margin-top: 10px; border:0; border-radius: 6px; font-weight:600; cursor:pointer; }
.btn-primary { background:#5a75f0; color:#fff; }
</style>
