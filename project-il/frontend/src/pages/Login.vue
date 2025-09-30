<script setup>
import UserLayout from '@/components/UserLayout.vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/axiosUser'

const router = useRouter()
const username = ref('')
const password = ref('')

// ✅ 기존 로그인
const handleLogin = async () => {
  try {
    const res = await axios.post('/users/login', {
      username: username.value,
      password: password.value
    })
    const token = res.data.token
    const role = res.data.role
    if (role === 'admin') {
      localStorage.setItem('admin_token', token)
      router.push('/admin/dashboard')
    } else {
      localStorage.setItem('user_token', token)
      localStorage.setItem('role', 'user')
      router.push('/')
    }
  } catch (err) {
    alert(err.response?.data?.message || 'Login failed')
  }
}
const goToRegister = () => router.push('/register')

// ✅ 비밀번호 찾기(모달)
const showForgot = ref(false)
const fpUsername = ref('')
const fpEmail = ref('')
const fpLoading = ref(false)

const openForgot = () => {
  fpUsername.value = username.value
  showForgot.value = true
}

const submitForgot = async () => {
  if (!fpUsername.value || !fpEmail.value) {
    alert($t('alert.emptyFields'))
    return
  }
  try {
    fpLoading.value = true
    await axios.post('/auth/forgot', {
      username: fpUsername.value,
      email: fpEmail.value
    })
    alert($t('alert.linkSent'))
    showForgot.value = false
  } catch (e) {
    alert(e.response?.data?.message || $t('alert.requestFailed'))
  } finally {
    fpLoading.value = false
  }
}
</script>

<template>
  <UserLayout>
    <div class="login-container">
      <h2>{{ $t('login.title') }}</h2>

      <form @submit.prevent="handleLogin">
        <label>{{ $t('login.username') }}</label>
        <input v-model="username" required />

        <label>{{ $t('login.password') }}</label>
        <input type="password" v-model="password" required />

        <button type="submit" class="btn-primary">{{ $t('login.loginButton') }}</button>
        <button type="button" class="btn-secondary" @click="goToRegister">
          {{ $t('login.registerButton') }}
        </button>

        <!-- ✅ 깔끔한 하단 라인: 비밀번호 찾기 -->
        <div class="login-aux">
          <a href="javascript:;" @click="openForgot">{{ $t('login.forgotPassword') }}</a>
        </div>
      </form>
    </div>

    <!-- ✅ 모달 -->
    <div v-if="showForgot" class="reset-backdrop" @click.self="showForgot=false">
      <div class="reset-modal">
        <h3>{{ $t('forgot.title') }}</h3>
        <p class="desc">{{ $t('forgot.desc') }}</p>

        <label>{{ $t('login.username') }}</label>
        <input v-model="fpUsername" placeholder="your_id" />

        <label>{{ $t('register.email') }}</label>
        <input v-model="fpEmail" type="email" placeholder="you@example.com" />

        <button class="btn-primary" :disabled="fpLoading" @click="submitForgot">
          {{ fpLoading ? $t('common.sending') : $t('forgot.sendLink') }}
        </button>
        <button class="btn-ghost" @click="showForgot=false">{{ $t('common.cancel') }}</button>

        <p class="hint">{{ $t('forgot.hint') }}</p>
      </div>
    </div>
  </UserLayout>
</template>

<style scoped>
:global(.reset-backdrop){
  position:fixed; inset:0; background:rgba(0,0,0,.4);
  display:grid; place-items:center; z-index:10000;
}
:global(.reset-modal){
  display:block !important; /* 부트스트랩 등 전역 modal 규칙 무시 */
  width:100%; max-width:420px; background:#fff; border-radius:14px; padding:24px;
  box-shadow:0 12px 32px rgba(0,0,0,.12); animation:reset-pop .15s ease-out; z-index:10001;
}
@keyframes reset-pop{from{transform:translateY(8px);opacity:0}to{transform:translateY(0);opacity:1}}

.login-container {
  max-width: 400px; margin: 100px auto; padding: 30px; background: #fff;
  border-radius: 1rem; box-shadow: 0 6px 12px rgba(0,0,0,.05);
}
label { display:block; margin-top: 15px; }
input {
  outline: none; border: 1px solid #ccc; padding: 10px; width: 100%;
  border-radius: 6px; box-sizing: border-box; margin-bottom: 15px;
}
input:focus, button:focus {
  border-color: #6488fa; box-shadow: 0 0 0 2px rgba(100,136,250,.2); outline: none;
}
button { width: 100%; padding: 10px; margin-top: 10px; border: 0; border-radius: 6px; font-weight: 600; cursor: pointer; }
.btn-primary { background: #5a75f0; color:#fff; }
.btn-secondary { background: #999; color:#fff; }
.login-aux { margin-top: 10px; text-align: right; }
.login-aux a { color: #5a75f0; text-decoration: underline; cursor: pointer; }


.btn-ghost { background: #f4f5f7; color: #333; }
.hint { margin-top: 12px; color: #888; font-size: .85rem; line-height: 1.3; }

</style>
