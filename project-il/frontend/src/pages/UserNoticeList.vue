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
          <h3 class="card-title">{{ notice.title || 'Untitled' }}</h3>
          <p class="date">{{ formatDate(notice.created_at) }}</p>
        </div>
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

const fetchNotices = async () => {
  const lang = localStorage.getItem('lang') || 'ko'
  try {
    const res = await axios.get(`/users/notices?lang=${lang}`)
    notices.value = res.data.notices
  } catch (err) {
    console.error('❌ 공지 목록 불러오기 실패:', err)
  }
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
  text-align: center;
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
  color: #777;
}

@media (max-width: 600px) {
  .card {
    padding: 0.8rem;
  }
  .card-title {
    font-size: 1rem;
  }
}
</style>
