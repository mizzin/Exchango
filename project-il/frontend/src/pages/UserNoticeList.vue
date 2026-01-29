<template>
  <UserLayout>
    <div class="notice-list-container">
      <h2 class="title">📢 Notices</h2>

      <div v-if="notices.length === 0" class="empty">
        No notices available.
      </div>

      <div v-else class="card-list">
        <div
          v-for="notice in notices"
          :key="notice.id"
          class="card"
          @click="goToDetail(notice.id)"
        >
          <span v-if="notice.pinned" class="pinned-label">📌 Pinned</span>
          <h3 class="card-title">{{ notice.title || 'Untitled' }}</h3>
          <p class="date">{{ formatDate(notice.created_at) }}</p>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1">Prev</button>
        <button
          v-for="page in totalPages"
          :key="page"
          @click="changePage(page)"
          :class="{ active: page === currentPage }"
        >
          {{ page }}
        </button>
        <button @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages">Next</button>
      </div>
    </div>
  </UserLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/axiosUser'
import UserLayout from '@/components/UserLayout.vue'

const notices = ref([])
const router = useRouter()
const currentPage = ref(1)
const totalPages = ref(1)
const perPage = 10

const fetchNotices = async () => {
  const lang = localStorage.getItem('lang') || 'ko'
  try {
    const res = await axios.get('/users/notices', {
      params: {
        lang: lang,
        page: currentPage.value,
        limit: perPage
      }
    })
    notices.value = res.data.notices
    totalPages.value = res.data.totalPages
  } catch (err) {
    console.error('❌ 공지 목록 불러오기 실패:', err)
  }
}

const changePage = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  fetchNotices()
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`
}

const goToDetail = (id) => {
  router.push(`/support/notice/${id}`)
}

onMounted(fetchNotices)
</script>

<style scoped>
.notice-list-container {
  padding: 1rem;
  max-width: 720px;
  margin: auto;
}

.title {
  font-size: 1.4rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

.empty {
  text-align: center;
  color: #999;
  margin-top: 2rem;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 8px rgba(0,0,0,0.06);
  padding: 1rem;
  transition: transform 0.15s ease;
  cursor: pointer;
}

.card:hover {
  transform: translateY(-3px);
}

.card-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.date {
  font-size: 0.85rem;
  color: #666;
}

.pinned-label {
  font-size: 0.8rem;
  font-weight: bold;
  color: #4a6ef6;
  margin-bottom: 0.5rem;
  display: block;
}

.pagination {
  margin-top: 20px;
  text-align: center;
}
.pagination button {
  margin: 0 5px;
  padding: 6px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
}
.pagination button:hover {
  background: #f0f0f0;
}
.pagination button.active {
  font-weight: bold;
  background-color: #4a6ef6;
  color: #fff;
  border-color: #4a6ef6;
}
.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .date{
  margin: 0 !important;
  }
  .container {
        padding: 1rem 0;
    }
  .notice-list-container{
    padding: 0 !important;
  }
  .title {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 1.4rem;
    margin-top: 0.5rem;
    color: #333;
  }
  .card {
    padding: 1rem;
  }
  
  }
@media (max-width: 600px) {
  
  .card-title {
    font-size: 1rem;
  }
}
</style>
