<template>
  <UserLayout>
    <div class="inquiry-list-container">
      <h2 class="title">{{ $t('inquiry.list.title') }}</h2>

      <button class="btn-submit new-inquiry-btn" @click="goToWrite">
        ➕ {{ $t('inquiry.list.newInquiry') }}
      </button>

      <div v-if="inquiries.length === 0" class="empty">
        {{ $t('inquiry.list.noInquiry') }}
      </div>

      <div v-else class="card-list">
        <div
          v-for="i in inquiries"
          :key="i.id"
          class="card"
          @click="goToDetail(i.id)"
        >
          <h3 class="card-title">{{ i.title }}</h3>
          <div class="info">
            <span><strong>{{ $t('inquiry.common.category') }}</strong> {{ $t('inquiry.category.' + i.category) }}</span>
            <span><strong>{{ $t('inquiry.common.status') }}</strong> {{ $t('inquiry.status.' + i.status) }}</span>
            <span><strong>{{ $t('inquiry.common.createdAt') }}</strong> {{ formatDate(i.created_at) }}</span>
          </div>
        </div>
      </div>
    </div>
  </UserLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from '@/axiosUser'
import UserLayout from '@/components/UserLayout.vue';

const inquiries = ref([]);
const router = useRouter();

const fetchInquiries = async () => {
  try {
    const token = localStorage.getItem('user_token');
    const res = await axios.get('/users/inquiries', {
      headers: { Authorization: `Bearer ${token}` }
    });
    inquiries.value = res.data;
  } catch (err) {
    console.error('문의 내역 불러오기 실패:', err);
  }
};

const formatDate = (d) => new Date(d).toLocaleString();
const goToDetail = (id) => router.push(`/support/inquiry/${id}`);
const goToWrite = () => router.push('/support/inquiry/write');

onMounted(fetchInquiries);
</script>

<style scoped>
.inquiry-list-container {
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

.new-inquiry-btn {
  display: block;
  margin: 0 auto 1.5rem auto;
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
  cursor: pointer;
  transition: transform 0.15s ease;
}

.card:hover {
  transform: translateY(-3px);
}

.card-title {
  font-size: 1.05rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.info {
  font-size: 0.92rem;
  color: #555;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.empty {
  text-align: center;
  color: #999;
  font-size: 1rem;
  margin-top: 2rem;
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
