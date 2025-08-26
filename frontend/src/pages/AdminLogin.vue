<template>
    <div class="login-container">
      <h2>관리자 로그인</h2>
      <form @submit.prevent="handleLogin">
        <label>아이디</label>
        <input v-model="username" placeholder="admin" required />
  
        <label>비밀번호</label>
        <input type="password" v-model="password" placeholder="비밀번호" required />
  
        <button type="submit" class="submit-btn">로그인</button>
      </form>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import axios from '@/axiosAdmin'
  import { useRouter } from 'vue-router'
  
  const router = useRouter()
  const username = ref('')
  const password = ref('')
  
  const handleLogin = async () => {
    try {
      const res = await axios.post('/users/login', {
        username: username.value,
        password: password.value
      })
  
      if (res.data.token) {
        localStorage.setItem('admin_token', res.data.token)
        router.push('/admin/dashboard')
      }
    } catch (err) {
      alert(err.response?.data?.message || '로그인 실패')
    }
  }
  </script>
  
  <style scoped>
  .login-container {
    max-width: 400px;
    margin: 100px auto;
    padding: 30px;
    background: #f4f6ff;
    border-radius: 12px;
  }
  label {
    display: block;
    margin-top: 15px;
  }
  input {
    width: 100%;
    padding: 8px;
    margin-top: 5px;
  }
  .submit-btn {
    margin-top: 20px;
    background: #5a75f0;
    color: white;
    width: 100%;
    padding: 10px;
    border: none;
    border-radius: 6px;
  }
  </style>
  