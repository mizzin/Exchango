<template>
  <UserLayout>
    <div class="notice-detail">
      <h2 class="notice-title">📌 {{ notice.title || 'Untitled' }}</h2>
     <p class="notice-meta">
        {{ formatDate(notice.created_at) }}
      </p>


      <div class="notice-content" v-html="notice.content"></div>

      <div class="notice-nav">
        <router-link
          v-if="prev"
          :to="`/support/notice/${prev.id}`"
          class="nav-item"
        >
          ▲ {{ prev.title || 'Previous' }}
          <span class="date">{{ formatDate(prev.created_at) }}</span>
        </router-link>

        <router-link
          v-if="next"
          :to="`/support/notice/${next.id}`"
          class="nav-item"
        >
          ▼ {{ next.title || 'Next' }}
          <span class="date">{{ formatDate(next.created_at) }}</span>
        </router-link>

        <button @click="goToList" class="btn-back">← {{ $t('notice.backToList') }}</button>
      </div>
    </div>
  </UserLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from '@/axiosUser'
import UserLayout from '@/components/UserLayout.vue'

const route = useRoute()
const router = useRouter()

const notice = ref({})
const prev = ref(null)
const next = ref(null)

const fetchNotice = async () => {
  try {
    const res = await axios.get(`/users/notices/${route.params.id}`)
    notice.value = res.data.notice
    prev.value = res.data.prev
    next.value = res.data.next
  } catch (err) {
    console.error('❌ 공지 상세 불러오기 실패:', err)
  }
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`
}

const goToList = () => router.push('/support/notice')

onMounted(fetchNotice)
</script>

<style scoped>
.notice-detail {
  max-width: 720px;
  margin: auto;
  padding: 1rem;
}

.notice-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.3rem;
  color: #333;
}

.notice-meta {
  font-size: 0.85rem;
  color: #888;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5rem;
}

.notice-content {
  font-size: 1rem;
  line-height: 1.6;
  color: #444;
  padding-bottom: 2rem;
  white-space: pre-wrap;
}

.notice-nav {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  border-top: 1px solid #eee;
  padding-top: 1rem;
}

.nav-item {
  display: flex;
  flex-direction: column;
  background: #f8f9fb;
  padding: 0.8rem;
  border-radius: 10px;
  font-size: 0.95rem;
  text-decoration: none;
  color: #333;
  transition: background 0.2s ease;
}
.nav-item:hover {
  background: #eef1f4;
}
.nav-item .date {
  font-size: 0.8rem;
  color: #777;
  margin-top: 0.3rem;
}

.btn-back {
  align-self: flex-start;
  background: none;
  border: none;
  color: #007BFF;
  font-size: 0.9rem;
  cursor: pointer;
  margin-top: 0.8rem;
  padding: 0;
}
.btn-back:hover {
  text-decoration: underline;
}

@media (max-width: 600px) {
  .notice-title {
    font-size: 1.3rem;
  }
  .notice-content {
    font-size: 0.95rem;
  }
}
</style>
