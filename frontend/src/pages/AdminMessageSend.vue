
<script setup>
import { ref } from 'vue'
import axios from '@/axiosAdmin'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/AdminLayout.vue'
const to_username = ref('')
const subject = ref('')
const content = ref('')
const language = ref('ko')
const router = useRouter()

const sendMessage = async () => {
  try {
    const token = localStorage.getItem('admin_token')
    await axios.post('/admin/messages/send', {
      to_username: to_username.value,
      subject: subject.value,
      content: content.value,
      language: language.value
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    alert('쪽지가 성공적으로 전송되었습니다.')
    router.push('/admin/dashboard')
  } catch (err) {
    alert(err.response?.data?.message || '쪽지 전송 실패')
  }
}
</script>

<template>
    <AdminLayout>
    <div class="message-send">
      <h2>쪽지 보내기</h2>
      <form @submit.prevent="sendMessage">
        <label>받는 사용자 아이디 *</label>
        <input v-model="to_username" required />
  
        <label>제목 *</label>
        <input v-model="subject" required />
  
        <label>내용 *</label>
        <textarea v-model="content" rows="5" required />
  
        <label>언어</label>
        <select v-model="language">
          <option value="ko">한국어</option>
          <option value="en">English</option>
          <option value="zh">中文</option>
          <option value="ja">日本語</option>
        </select>
  
        <button type="submit">보내기</button>
      </form>
    </div>
  </AdminLayout>
  </template>
  
  <style scoped>
  .message-send {
    max-width: 500px;
    margin: auto;
    padding: 30px;
    background: #f9f9ff;
    border-radius: 10px;
  }
  label {
    display: block;
    margin-top: 15px;
  }
  input, textarea, select {
    width: 100%;
    padding: 8px;
    margin-top: 5px;
    border-radius: 5px;
    border: 1px solid #ccc;
  }
  button {
    margin-top: 20px;
    width: 100%;
    padding: 10px;
    background: #5568f0;
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: bold;
  }
  </style>
  