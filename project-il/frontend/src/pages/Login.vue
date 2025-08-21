<script setup>
import UserLayout from '@/components/UserLayout.vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/axiosUser'

const router = useRouter()
const username = ref('')
const password = ref('')

const handleLogin = async () => {
  try {
    const res = await axios.post('/users/login', {
      username: username.value,
      password: password.value
    });

    const token = res.data.token;
    const role = res.data.role;

    if (role === 'admin') {
      localStorage.setItem('admin_token', token);
      router.push('/admin/dashboard');
    } else {
      localStorage.setItem('user_token', token);
      localStorage.setItem('role', 'user');
      router.push('/');
    }
  } catch (err) {
    alert(err.response?.data?.message || 'Login failed');
  }
}


const goToRegister = () => {
  router.push('/register')
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
      <button type="button" class="btn-secondary" @click="goToRegister">{{ $t('login.registerButton') }}</button>
    </form>
  </div>
  </UserLayout>
</template>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 100px auto;
  padding: 30px;
  background: #fff;
  border-radius: 1rem;
   box-shadow: 0 6px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease-in-out;
}
label {
  display: block;
  margin-top: 15px;
}
input {
  outline: none;
  border: 1px solid #ccc;
  padding: 10px;
  width: 100%;
  border-radius: 6px;
  box-sizing: border-box;
  margin-bottom: 15px;
}
input:focus, button:focus {
  border-color: #6488fa;
  box-shadow: 0 0 0 2px rgba(100, 136, 250, 0.2);
  outline: none;
}
button {
  width: 100%;
  padding: 10px;
  margin-top: 10px;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
}
.btn-primary {
  background-color: #5a75f0;
  color: white;
}
.btn-secondary {
  background-color: #999;
  color: white;
}
</style>
