<template>
    <UserLayout>
      <div class="messages-page">
        <h2 class="title">📩 {{ $t('messages.title') }}</h2>

        <table v-if="paginatedMessages.length" class="message-table">
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
              @click="readMessage(msg)"
              class="clickable"
            >
              <td>{{ msg.subject }}</td>
              <td>{{ formatDate(msg.created_at) }}</td>
              <td>
                <span :class="msg.is_read ? 'read animated' : 'unread'">
                  {{ msg.is_read ? $t('messages.read') : $t('messages.unread') }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

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
            <h3>{{ selectedMessage.subject }}</h3>
            <p>{{ selectedMessage.content }}</p>
            <button class="btn-primary" @click="closeModal">Close</button>
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
  
  const fetchMessages = async () => {
    const token = localStorage.getItem('user_token')
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
    const token = localStorage.getItem('token')
    try {
      const res = await axios.get(`/users/messages/${msg.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      selectedMessage.value = res.data.message
      msg.is_read = 1
    } catch (err) {
      console.error('❌ Failed to read message:', err)
    }
  }
  
  const closeModal = () => {
    selectedMessage.value = null
  }
  
  const formatDate = (dateStr) => new Date(dateStr).toLocaleString()
  
  onMounted(fetchMessages)
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
    transition: color 0.3s ease-in;
  }
  .unread {
    color: #e74c3c;
    font-weight: bold;
    transition: color 0.3s ease-in;
  }
  .animated {
    animation: flash-read 0.5s ease-out;
  }
  @keyframes flash-read {
    from {
      background-color: #eef6ff;
    }
    to {
      background-color: transparent;
    }
  }
  .clickable {
    cursor: pointer;
    transition: background 0.2s;
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
    background: #fff;
    border: 1px solid #ccc;
    padding: 6px 12px;
    cursor: pointer;
    font-size: 0.9rem;
    border-radius: 4px;
    transition: background-color 0.2s;
  }
  .page-btn:hover {
    background-color: #eef3ff;
  }
  .page-btn.active {
    background-color: #6488fa;
    color: white;
    font-weight: bold;
    border-color: #6488fa;
  }
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
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    max-width: 400px;
    width: 90%;
  }
  </style>