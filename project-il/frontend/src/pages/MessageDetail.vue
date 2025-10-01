<template>
  <UserLayout>
    <div class="message-detail">
      <h2 class="message-title">📩 {{ message.subject }}</h2>
      <p class="message-meta">{{ formatDate(message.created_at) }}</p>
      <div class="message-content">{{ message.content }}</div>

      <button @click="$router.push('/messages')" class="btn-back">
        ← {{ $t('notice.backToList') }}
      </button>
    </div>
  </UserLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from '@/axiosUser'
import UserLayout from '@/components/UserLayout.vue'

const route = useRoute()
const message = ref({})

onMounted(async () => {
  try {
    const res = await axios.get(`/users/messages/${route.params.id}`)
    message.value = res.data.message
  } catch (err) {
    console.error('❌ Failed to load message detail:', err)
  }
})

const formatDate = (dateStr) => {
  const d = new Date(dateStr)
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\./g, '-').replace(/ /g, '')
}
</script>

<style scoped>
.message-detail {
  max-width: 720px;
  margin: auto;
  padding: 1.5rem;
}

.message-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.3rem;
  color: #111;
}

.message-meta {
  font-size: 0.85rem;
  color: #888;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5rem;
}

.message-content {
  font-size: 1rem;
  line-height: 1.7;
  color: #333;
  white-space: pre-wrap;
  padding-bottom: 2rem;
}

/* 뒤로가기 버튼 기본 */
.btn-back {
  background: none;
  border: none;
  color: #007BFF;
  cursor: pointer;
  font-size: 0.95rem;
}
.btn-back:hover {
  text-decoration: underline;
}

/* 📱 모바일에서 토스 스타일 적용 */
@media (max-width: 768px) {
  .message-detail {
    background: #fff;
    padding: 1.2rem;
    border-radius: 16px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.05);
  }

  .message-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.4rem;
    color: #222;
  }

  .message-meta {
    font-size: 0.8rem;
    color: #666;
    margin-bottom: 1rem;
    border: none;
    padding: 0;
  }

  .message-content {
    font-size: 0.95rem;
    line-height: 1.65;
    color: #444;
  }

  .btn-back {
    display: inline-block;
    background: #007BFF;
    color: white;
    padding: 0.6rem 1.2rem;
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 500;
    box-shadow: 0 2px 6px rgba(0,0,0,0.08);
  }
  .btn-back:hover {
    text-decoration: none;
    background: #0056c7;
  }
}
</style>
