<template>
  <UserLayout>
    <div class="messages-page">
      <h2 class="title">📩 {{ $t('messages.title') }}</h2>

      <!-- ✅ PC 전용 테이블 -->
      <table v-if="paginatedMessages.length && !isMobile" class="message-table">
        <thead>
          <tr>
            <th>{{ $t('messages.subject') }}</th>
            <th>{{ $t('messages.date') }}</th>
            <th>{{ $t('messages.status') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="msg in paginatedMessages"
            :key="msg.id"
            @click="$router.push(`/messages/${msg.id}`)"
            class="clickable"
          >
            <td>{{ msg.subject }}</td>
            <td>{{ formatDate(msg.created_at) }}</td>
            <td>
              <span :class="msg.is_read ? 'read' : 'unread'">
                {{ msg.is_read ? $t('messages.read') : $t('messages.unread') }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- ✅ 모바일 전용 카드 리스트 -->
      <div v-else-if="paginatedMessages.length && isMobile" class="message-list">
        <div
          v-for="msg in paginatedMessages"
          :key="msg.id"
          class="message-card"
            @click="$router.push(`/messages/${msg.id}`)"
        >
          <div class="message-header">
            <span class="message-title">{{ msg.subject }}</span>
            <span
              :class="['status-badge', msg.is_read ? 'status-read' : 'status-unread']"
            >
              {{ msg.is_read ? $t('messages.read') : $t('messages.unread') }}
            </span>
          </div>
          <div class="message-date">{{ formatDate(msg.created_at) }}</div>
        </div>
      </div>

      <!-- 쪽지 없음 -->
      <p v-else class="empty-message">{{ $t('messages.noMessages') }}</p>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button
          v-for="page in totalPages"
          :key="page"
          @click="currentPage = page"
          :class="['page-btn', { active: currentPage === page }]"
        >
          {{ page }}
        </button>
      </div>

      <!-- 모달 -->
      <div v-if="selectedMessage" class="modal">
        <div class="modal-content">
          <div class="modal-header">📩 {{ selectedMessage.subject }}</div>
          <div class="modal-body">{{ selectedMessage.content }}</div>
          <div class="modal-footer">
            <button class="btn-primary" @click="closeModal">Close</button>
          </div>
        </div>
      </div>
    </div>
  </UserLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from '@/axiosUser'
import UserLayout from '@/components/UserLayout.vue'

const messages = ref([])
const selectedMessage = ref(null)
const currentPage = ref(1)
const pageSize = 10
const isMobile = ref(false)

// 반응형 감지
const handleResize = () => {
  isMobile.value = window.innerWidth <= 768
}

onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
  fetchMessages()
})

const fetchMessages = async () => {
  try {
    const res = await axios.get('/users/messages')
    messages.value = res.data.messages || []
  } catch (err) {
    console.error('❌ Failed to load messages:', err)
  }
}

const paginatedMessages = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return messages.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(messages.value.length / pageSize)
})

const readMessage = async (msg) => {
  try {
    const res = await axios.get(`/users/messages/${msg.id}`)
    selectedMessage.value = res.data.message
    msg.is_read = 1
  } catch (err) {
    console.error('❌ Failed to read message:', err)
  }
}

const closeModal = () => {
  selectedMessage.value = null
}

const formatDate = (dateStr) => {
  const d = new Date(dateStr)
  return d
    .toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
    .replace(/\./g, '-')
    .replace(/ /g, '')
}
</script>

<style scoped>
.messages-page {
  padding: 2rem 0;
}
.title {
  font-size: 1.6rem;
  margin-bottom: 1.5rem;
  color: #333;
}
.message-table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  border: 1px solid #ddd;
}
.message-table th,
.message-table td {
  padding: 12px;
  border: 1px solid #eee;
  text-align: left;
  font-size: 0.95rem;
}
.message-table th {
  background-color: #f5f8ff;
  color: #5a75f0;
}
.read {
  color: #999;
}
.unread {
  color: #e74c3c;
  font-weight: bold;
}
.clickable {
  cursor: pointer;
}
.clickable:hover {
  background-color: #f9f9ff;
}
.empty-message {
  font-style: italic;
  color: #888;
  margin-top: 1rem;
}
.pagination {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.page-btn {
  background: #6488fa;
  border: 1px solid #ccc;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 0.9rem;
  border-radius: 4px;
}
.page-btn.active {
  background-color: #2046c5;
  color: #fff;
  font-weight: bold;
}

/* 모달 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
  max-width: 420px;
  width: 90%;
}
.modal-header {
  font-size: 0.95rem;
  font-weight: 600;
  color: #555;
  margin-bottom: 0.8rem;
}
.modal-body {
  font-size: 0.95rem;
  line-height: 1.6;
  color: #333;
  white-space: pre-line;
  user-select: text;
}
.modal-footer {
  margin-top: 0 !important;
  text-align: right;
}
.modal-footer button {
  background: #f1f1f1;
  border: none;
  color: #333;
  font-size: 0.85rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
}

/* 📱 모바일 카드 스타일 */
.message-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
.message-card {
  padding: 1rem;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}
.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.4rem;
}
.message-title {
  font-weight: bold;
  font-size: 1rem;
  color: #333;
}
.status-badge {
  font-size: 0.75rem;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-weight: 600;
}
.status-read {
  background: #eaeaea;
  color: #666;
}
.status-unread {
  background: #e74c3c;
  color: #fff;
}
.message-date {
  font-size: 0.85rem;
  color: #666;
}
@media (max-width: 768px) {
  .messages-page {
  padding: 1rem 0;
}
.title{
 font-size: 1.4rem;
}
.modal-footer {
    padding-top: 0.2rem;
    padding-bottom: 0.2rem;
}
}
</style>
