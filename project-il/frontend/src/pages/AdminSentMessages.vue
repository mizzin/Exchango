<script setup>
import { ref, onMounted } from 'vue'
import axios from '@/axiosAdmin'
import AdminLayout from '@/components/AdminLayout.vue'
import '@/assets/style.css'

const messages = ref([])
const selected = ref(null)
const searchUsername = ref('')
const readFilter = ref('') 

const currentPage = ref(1)
const totalPages = ref(1)
const pageSize = 15

const fetchMessages = async () => {
  const token = localStorage.getItem('admin_token')
  try {
    const res = await axios.get('/admin/messages/sent', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        page: currentPage.value,
        limit: pageSize,
        username: searchUsername.value,
        readFilter: readFilter.value
      }
    })
    messages.value = res.data.messages
    totalPages.value = res.data.totalPages
  } catch (err) {
    console.error('❌ 메시지 불러오기 실패:', err)
  }
}

const formatDate = date => new Date(date).toLocaleString()

const changePage = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  fetchMessages()
}

const viewMessage = (msg) => {
  selected.value = msg
}

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

onMounted(fetchMessages)
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
        <button @click="fetchMessages">검색</button>
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
          <tr v-for="msg in messages" :key="msg.id">
            <td>{{ msg.to_username }}</td>
            <td>{{ msg.subject }}</td>
            <td>{{ msg.language }}</td>
            <td>{{ formatDate(msg.created_at) }}</td>
            <td><button @click="viewMessage(msg)">보기</button></td>
            <td>{{ msg.is_read ? '읽음' : '읽지 않음' }}</td>
            <td><button @click="deleteMessage(msg.id)">삭제</button></td>
          </tr>
        </tbody>
      </table>

      <!-- 페이지네이션 -->
      <div class="pagination" v-if="totalPages > 1">
        <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1">이전</button>
        <span v-for="page in totalPages" :key="page">
          <button :class="{ active: currentPage === page }" @click="changePage(page)">{{ page }}</button>
        </span>
        <button @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages">다음</button>
      </div>

      <div v-if="selected" class="popup">
        <h3>{{ selected.subject }}</h3>
        <p>{{ selected.content }}</p>
        <button @click="selected = null">닫기</button>
      </div>
    </div>
  </AdminLayout>
</template>

  
  <style scoped>
  .pagination {
  margin-top: 20px;
  text-align: center;
}
.pagination button {
  margin: 0 5px;
  padding: 6px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #011257;
  cursor: pointer;
  transition: all 0.2s ease;
}
.pagination button:hover {
  background: #011257;
}
.pagination button.active {
  font-weight: bold;
  background-color: #4a6cf7;
  color: #fff;
  border: none;
}
.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

  .pagination {
  margin-top: 20px;
  text-align: center;
}
.pagination button {
  margin: 0 5px;
  padding: 5px 10px;
}
.pagination .active {
  font-weight: bold;
  background-color: #007bff;
  color: white;
  border: none;
}
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
  