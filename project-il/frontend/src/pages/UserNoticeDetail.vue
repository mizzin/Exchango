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
  padding: 1.5rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.notice-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: #222;
  margin-bottom: 0.4rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}


.notice-meta {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 1.2rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.6rem;
}

.notice-content {
  font-size: 1rem;
  line-height: 1.7;
  color: #333;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.notice-nav {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  border-top: 1px solid #eee;
  padding-top: 1rem;
}

.nav-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fb;
  padding: 0.8rem 1rem;
  border-radius: 8px;
  text-decoration: none;
  color: #333;
  font-size: 0.95rem;
  transition: 0.2s;
}

.nav-item:hover {
  background: #eef3ff;
  border-left: 4px solid #5a75f0;
}
.nav-item .date {
  font-size: 0.8rem;
  color: #888;
}
.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: transparent;
  border: 1px solid #5a75f0;
  color: #5a75f0;
  font-size: 0.9rem;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  cursor: pointer;
  transition: 0.2s;
}
.btn-back:hover {
  background: #eef3ff;
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
