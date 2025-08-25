
<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from '@/axiosAdmin'
import '@/assets/style.css' 
import AdminLayout from '@/components/AdminLayout.vue'
const messages = ref([])
const selected = ref(null)
const searchUsername = ref('')
const readFilter = ref('') // '', 'true', 'false'

const fetchMessages = async () => {
  const token = localStorage.getItem('admin_token')
  const res = await axios.get('/admin/messages/sent', { 
    headers: { Authorization: `Bearer ${token}` }
  })
  messages.value = res.data.messages
}

const formatDate = date => new Date(date).toLocaleString()

const filteredMessages = computed(() => {
  return messages.value.filter(msg => {
    const usernameMatch = msg.to_username.includes(searchUsername.value)
    const readMatch =
      readFilter.value === '' ||
      (readFilter.value === 'true' && msg.is_read === 1) ||
      (readFilter.value === 'false' && msg.is_read === 0)

    return usernameMatch && readMatch
  })
})

const viewMessage = (msg) => {
  selected.value = msg
}
onMounted(fetchMessages)

const deleteMessage = async (id) => {
  if (!confirm('삭제하시겠습니까?')) return

  const token = localStorage.getItem('admin_token') 

  try {
    await axios.delete(`/admin/messages/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    alert('삭제 완료!')
    fetchMessages()
  } catch (err) {
    alert(err.response?.data?.message || '삭제 실패')
  }
}
</script>

<template>
  <AdminLayout>
    <div class="admin-messages">
      <h2>📬 보낸 쪽지 목록</h2>
      <div class="filter-bar">
        <input v-model="searchUsername" placeholder="수신자 ID 검색" />
        <select v-model="readFilter">
          <option value="">전체</option>
          <option value="false">읽지 않음</option>
          <option value="true">읽음</option>
        </select>
      </div>
      <table>
        <thead>
          <tr>
            <th>받는 사용자</th>
            <th>제목</th>
            <th>언어</th>
            <th>보낸 날짜</th>
            <th>내용 보기</th>
            <th>읽음여부</th>
            <th>삭제</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="msg in filteredMessages" :key="msg.id">
            <td>{{ msg.to_username }}</td>
            <td>{{ msg.subject }}</td>
            <td>{{ msg.language }}</td>
            <td>{{ formatDate(msg.created_at) }}</td>
            <td><button @click="viewMessage(msg)">보기</button></td>
            <td>{{ msg.is_read ? '읽음' : '읽지 않음' }}</td>
            <td>
              <button @click="deleteMessage(msg.id)">삭제</button>
            </td>
          </tr>
        </tbody>
      </table>
  
      <div v-if="selected" class="popup">
        <h3>{{ selected.subject }}</h3>
        <p>{{ selected.content }}</p>
        <button @click="selected = null">닫기</button>
      </div>
    </div>
  </AdminLayout>
  </template>
  
  <style scoped>
  
  table {
    width: 100%;
    margin-top: 20px;
    border-collapse: collapse;
  }
  th, td {
    padding: 10px;
    border: 1px solid #ccc;
  }
  .popup {
    position: fixed;
    top: 30%;
    left: 50%;
    transform: translate(-50%, -30%);
    background: rgb(245, 245, 245);
    padding: 20px;
    border: 2px solid #aaa;
  }
  .filter-bar {
    margin-bottom: 1rem;
    display: flex;
    gap: 1rem;
  }
  .filter-bar input,
  .filter-bar select {
    padding: 8px;
    font-size: 1rem;
  }
  </style>
  