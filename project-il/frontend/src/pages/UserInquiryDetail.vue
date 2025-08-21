<template>
  <UserLayout>
    <div class="inquiry-detail-container">
      <h2 class="title">{{ $t('inquiry.detail.title') }}</h2>

      <!-- 문의 정보 -->
      <div class="card">
        <div class="row">
          <strong>{{ $t('inquiry.common.subject') }}</strong>
          <span>{{ inquiry.title }}</span>
        </div>
        <div class="row">
          <strong>{{ $t('inquiry.common.category') }}</strong>
          <span>{{ $t('inquiry.category.' + inquiry.category) }}</span>
        </div>
        <div class="row">
          <strong>{{ $t('inquiry.common.createdAt') }}</strong>
          <span>{{ formatDate(inquiry.created_at) }}</span>
        </div>
      </div>

      <!-- 문의 내용 -->
      <div class="card">
        <h3 class="section-title">{{ $t('inquiry.detail.content') }}</h3>
        <div class="content-box" v-html="inquiry.content"></div>
      </div>

      <!-- 답변 -->
      <div class="card answer">
        <h3 class="section-title">{{ $t('inquiry.detail.adminAnswerTitle') }}</h3>
        <div v-if="inquiry.status === 'answered'" v-html="inquiry.answer" class="content-box"></div>
        <div v-else class="no-answer">{{ $t('inquiry.detail.noAnswer') }}</div>
      </div>
    </div>
  </UserLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from '@/axiosUser'
import UserLayout from '@/components/UserLayout.vue'

const inquiry = ref({})
const route = useRoute()

const fetchInquiry = async () => {
  try {
    const token = localStorage.getItem('user_token')
    const res = await axios.get(`/users/inquiries/${route.params.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    inquiry.value = res.data
  } catch (err) {
    console.error('문의 상세 조회 실패:', err.response?.data || err.message)
  }
}

const formatDate = (str) => new Date(str).toLocaleString()

onMounted(fetchInquiry)
</script>

<style scoped>
.inquiry-detail-container {
  padding: 1rem;
  max-width: 720px;
  margin: auto;
  font-size: 0.95rem;
}

.title {
  font-size: 1.4rem;
  font-weight: bold;
  margin-bottom: 1.2rem;
  text-align: center;
}

.card {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  padding: 1rem;
  margin-bottom: 1.2rem;
}

.row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.6rem;
  font-size: 0.95rem;
}

.row strong {
  color: #555;
  flex-shrink: 0;
  min-width: 100px;
}

.section-title {
  font-weight: 600;
  font-size: 1.05rem;
  margin-bottom: 0.6rem;
  color: #333;
}

.content-box {
  white-space: pre-wrap;
  line-height: 1.6;
  color: #444;
}

.answer {
  border-left: 4px solid #007bff;
}

.no-answer {
  color: #888;
  font-style: italic;
}
@media (max-width: 600px) {
  .row {
    flex-direction: column;
    gap: 4px;
  }
  .row strong {
    min-width: auto;
  }
}
</style>
